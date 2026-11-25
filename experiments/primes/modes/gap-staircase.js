// Gap Staircase — the gap grid, built upward one gap pair at a time.
//
// Like the Gap Grid, each pair of consecutive gaps (g1, g2) picks a cell on a 120×120
// grid: x = g1/2, z = g2/2. Here every pair lays a thin flat tile on its cell, a
// small rise (a fraction of the tile's thickness) above the tile before it, so the
// run climbs as a dense staircase that wanders over the grid. The camera rides at
// the top; you can orbit it.
(function() {
  const GRID = 120;            // same grid as the Gap Grid (gaps up to 238)
  const THICK = 0.18;          // tile thickness
  const MAX_TILES = 200000;    // most tiles the "Tiles kept" slider allows
  const DEFAULT_KEPT = 30000;  // tiles kept on screen; older ones drop off the bottom
  const FOCUS = 14;            // most gap pairs land in cells 0–30, so aim the camera there

  const mode = {
    label: "Gap Staircase",
    controls: [
      { type: "range", id: "gs3-speed", label: "Tiles/frame", min: 1, max: 60, step: 1, default: 2 },
      { type: "range", id: "gs3-kept", label: "Tiles kept", min: 2000, max: MAX_TILES, step: 2000, default: DEFAULT_KEPT },
      { type: "select", id: "gs3-rise", label: "Rise per tile", default: "0.1",
        options: [
          { value: "1", label: "1 × thickness" },
          { value: "0.25", label: "1/4" },
          { value: "0.1", label: "1/10" },
          { value: "0.04", label: "1/25" },
          { value: "0.01", label: "1/100" }
        ]
      },
      { type: "select", id: "gs3-color", label: "Color", default: "height",
        options: [
          { value: "height", label: "By height" },
          { value: "gap", label: "By gap size" }
        ]
      }
    ],

    init(ctx, canvas) {
      this._speed = 2;
      this._colorBy = "height";
      this._idx = 0;        // next prime index to read a gap pair from
      this._step = 0;       // tiles placed
      this._rise = THICK * 0.1; // height added per tile
      this._height = 0;     // height of the newest tile's base
      this._last = null;    // {x, z, g1, g2, p}
      // Ring buffer over the InstancedMesh slots 0..kept-1
      this._kept = DEFAULT_KEPT;
      this._ringPos = 0;    // slot the next tile goes into
      this._count = 0;      // tiles currently in the ring
      this._dirtyFrom = -1; // first slot written this frame
      this._dirtyN = 0;
      this._canvas2d = canvas;
      this._savedZ = canvas.style.zIndex;
      this._savedPE = canvas.style.pointerEvents;
      // The 2D canvas stays on top for the text overlay but lets mouse input through
      canvas.style.zIndex = "2";
      canvas.style.pointerEvents = "none";

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.inset = "0";
      renderer.domElement.style.zIndex = "1";
      canvas.parentElement.appendChild(renderer.domElement);
      this._renderer = renderer;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a1a);
      scene.fog = new THREE.Fog(0x0a0a1a, 60, 190);
      this._scene = scene;

      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
      // Low, from the small-gap corner, so the climb reads as a staircase
      camera.position.set(FOCUS - 46, 26, FOCUS - 40);
      this._camera = camera;
      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.target.set(FOCUS, 0, FOCUS);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      this._controls = controls;

      scene.add(new THREE.AmbientLight(0x404060, 0.7));
      const light = new THREE.DirectionalLight(0xffffff, 0.8);
      light.position.set(GRID, 60, GRID * 0.3);
      light.target.position.set(GRID / 2, 0, GRID / 2);
      scene.add(light, light.target);
      this._light = light;

      // Tiles: one InstancedMesh used as a ring buffer
      const geo = new THREE.BoxGeometry(0.92, THICK, 0.92);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const tiles = new THREE.InstancedMesh(geo, mat, MAX_TILES);
      tiles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      tiles.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_TILES * 3), 3);
      tiles.instanceColor.setUsage(THREE.DynamicDrawUsage);
      tiles.count = 0;
      tiles.frustumCulled = false;
      scene.add(tiles);
      this._tiles = tiles;

      // Grid outline that rides at the top, so the grid coordinates stay readable
      const grid = new THREE.GridHelper(GRID, GRID / 5, 0x33335a, 0x1c1c36);
      grid.position.set(GRID / 2, 0, GRID / 2);
      scene.add(grid);
      this._grid = grid;

      // Marker on the newest tile
      const marker = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, THICK * 1.6, 1.15),
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
      );
      marker.visible = false;
      scene.add(marker);
      this._marker = marker;

      this._topY = 0;
      this._color = new THREE.Color();
    },

    onControl(id, value) {
      if (id === "gs3-speed") this._speed = value;
      if (id === "gs3-color") this._colorBy = value;
      if (id === "gs3-rise") this._rise = THICK * Number(value);
      if (id === "gs3-kept") this._setKept(value);
    },

    // Resize the ring, keeping the newest tiles (in order) in slots 0..n-1
    _setKept(kept) {
      const n = Math.min(this._count, kept);
      const m = this._tiles.instanceMatrix.array, col = this._tiles.instanceColor.array;
      const oldest = this._count < this._kept ? 0 : this._ringPos;
      const firstKept = (oldest + (this._count - n)) % this._kept;
      const tm = new Float32Array(n * 16), tc = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const s = (firstKept + i) % this._kept;
        tm.set(m.subarray(s * 16, s * 16 + 16), i * 16);
        tc.set(col.subarray(s * 3, s * 3 + 3), i * 3);
      }
      m.set(tm); col.set(tc);
      this._kept = kept;
      this._count = n;
      this._ringPos = n % kept;
      this._tiles.count = n;
      this._dirtyFrom = 0;
      this._dirtyN = MAX_TILES; // upload everything
    },

    // Height of the oldest tile still shown (for the fog)
    _bottomY() {
      if (this._count === 0) return 0;
      const oldest = this._count < this._kept ? 0 : this._ringPos;
      return this._tiles.instanceMatrix.array[oldest * 16 + 13];
    },

    _place(x, z, g1, g2) {
      const slot = this._ringPos;
      if (this._dirtyFrom < 0) this._dirtyFrom = slot;
      this._dirtyN++;
      this._ringPos = (slot + 1) % this._kept;
      if (this._step > 0) this._height += this._rise;
      const y = this._height + THICK / 2;
      const m = this._tiles.instanceMatrix.array, o = slot * 16;
      m[o] = 1; m[o + 1] = 0; m[o + 2] = 0; m[o + 3] = 0;
      m[o + 4] = 0; m[o + 5] = 1; m[o + 6] = 0; m[o + 7] = 0;
      m[o + 8] = 0; m[o + 9] = 0; m[o + 10] = 1; m[o + 11] = 0;
      m[o + 12] = x + 0.5; m[o + 13] = y; m[o + 14] = z + 0.5; m[o + 15] = 1;

      const c = this._color;
      if (this._colorBy === "gap") {
        // small gaps blue → large gaps red, like the heatmap
        const t = Math.min(1, (g1 + g2) / 80);
        c.setHSL((240 - t * 240) / 360, 0.85, 0.35 + t * 0.25);
      } else {
        // hue cycles every 400 tiles so the layers read as bands
        c.setHSL((this._step / 400) % 1, 0.7, 0.5);
      }
      const col = this._tiles.instanceColor.array, k = slot * 3;
      col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;

      this._step++;
      this._count = Math.min(this._count + 1, this._kept);
      this._tiles.count = this._count;
      this._marker.position.set(x + 0.5, y, z + 0.5);
      this._marker.visible = true;
    },

    update(primes, currentIndex) {
      let placed = 0;
      // Out-of-grid pairs (gaps >= 240) are skipped without using up the frame's budget
      while (placed < this._speed && this._idx + 2 < primes.length && this._idx < currentIndex) {
        const i = this._idx++;
        const g1 = primes[i + 1] - primes[i];
        const g2 = primes[i + 2] - primes[i + 1];
        const x = g1 <= 1 ? g1 : g1 / 2;
        const z = g2 <= 1 ? g2 : g2 / 2;
        if (x >= GRID || z >= GRID) continue;
        this._place(x, z, g1, g2);
        this._last = { x, z, g1, g2, p: primes[i] };
        placed++;
      }
      if (this._dirtyN > 0) {
        // Upload only the slots written this frame (everything if the ring wrapped)
        const from = this._dirtyFrom, n = this._dirtyN;
        const mAttr = this._tiles.instanceMatrix, cAttr = this._tiles.instanceColor;
        if (from + n <= this._kept) {
          mAttr.updateRange.offset = from * 16; mAttr.updateRange.count = n * 16;
          cAttr.updateRange.offset = from * 3;  cAttr.updateRange.count = n * 3;
        } else {
          mAttr.updateRange.offset = 0; mAttr.updateRange.count = -1;
          cAttr.updateRange.offset = 0; cAttr.updateRange.count = -1;
        }
        mAttr.needsUpdate = true;
        cAttr.needsUpdate = true;
        this._dirtyFrom = -1;
        this._dirtyN = 0;
      }
    },

    draw(ctx, w, h) {
      if (!this._renderer) return;
      // Ride up with the newest tile: move the camera and its target together
      const top = this._height;
      const dy = (top - this._topY) * 0.15;
      this._topY += dy;
      this._camera.position.y += dy;
      this._controls.target.y += dy;
      this._grid.position.y = this._topY + 0.02;
      this._light.position.y = this._topY + 60;
      this._light.target.position.y = this._topY;
      this._marker.rotation.y += 0.03;
      this._controls.update();

      // Fog fades the tower gradually all the way down to its oldest tile
      const cam = this._camera, tgt = this._controls.target;
      const dTop = cam.position.distanceTo(tgt);
      const bottomY = this._bottomY();
      const dx = cam.position.x - tgt.x, dz = cam.position.z - tgt.z, dyB = cam.position.y - bottomY;
      const dBottom = Math.sqrt(dx * dx + dz * dz + dyB * dyB);
      this._scene.fog.near = dTop * 0.6;
      this._scene.fog.far = Math.max(dTop + 80, dBottom * 1.05 + 20);
      const far = this._scene.fog.far + 100;
      if (Math.abs(cam.far - far) > 1) { cam.far = far; cam.updateProjectionMatrix(); }
      this._renderer.render(this._scene, this._camera);

      // Text overlay on the (transparent) 2D canvas
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#888";
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`Gap staircase: ${this._step.toLocaleString()} tiles stacked`, w / 2, 18);
      const L = this._last;
      if (L) {
        ctx.font = "11px monospace";
        ctx.textAlign = "left";
        ctx.fillStyle = "#aaa";
        ctx.fillText(`newest: after prime ${L.p.toLocaleString()}`, 12, 38);
        ctx.fillText(`gaps ${L.g1}, ${L.g2}  →  cell (${L.x}, ${L.z})`, 12, 53);
        ctx.fillStyle = "#666";
        ctx.fillText("each tile sits one step above the last; drag to orbit", 12, h - 10);
      }
    },

    resize(w, h) {
      if (!this._renderer || !w || !h) return;
      this._renderer.setSize(w, h);
      this._camera.aspect = w / h;
      this._camera.updateProjectionMatrix();
    },

    cleanup() {
      if (!this._renderer) return;
      this._controls.dispose();
      this._scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      this._renderer.dispose();
      this._renderer.domElement.remove();
      this._renderer = null;
      this._canvas2d.style.zIndex = this._savedZ;
      this._canvas2d.style.pointerEvents = this._savedPE;
    }
  };
  window.PRIME_MODES["gap-staircase"] = mode;
})();
