// Ulam Spiral — primes plotted on a square spiral, with pan/zoom
(function() {
  const CATCH_UP_PER_FRAME = 20000;

  const mode = {
    label: "Ulam Spiral",
    controls: [
      { type: "range", id: "ulam-zoom", label: "Zoom", min: 1, max: 20, default: 3, step: 1 }
    ],
    _primeSet: null,
    _maxN: 0,
    _zoom: 3,
    _panX: 0,
    _panY: 0,
    _dragging: false,
    _dragStart: null,
    _panStart: null,
    _imgData: null,
    _canvas: null,
    _w: 0,
    _h: 0,
    _dirty: true,
    _boundMouseDown: null,
    _boundMouseMove: null,
    _boundMouseUp: null,
    _boundWheel: null,

    _spiralCoords(n) {
      if (n === 0) return [0, 0];
      const k = Math.ceil((Math.sqrt(n) - 1) / 2);
      const m = (2 * k - 1) * (2 * k - 1);
      const d = n - m;
      const side = 2 * k;
      if (d <= side) return [k, -k + d];
      if (d <= 2 * side) return [k - (d - side), k];
      if (d <= 3 * side) return [-k, k - (d - 2 * side)];
      return [-k + (d - 3 * side), -k];
    },

    init(ctx, canvas, primes) {
      this._primeSet = new Set();
      this._maxN = 0;
      this._panX = 0;
      this._panY = 0;
      this._dragging = false;
      this._dirty = true;
      this._canvas = canvas;
      this._w = 0;
      this._h = 0;

      const self = this;
      this._boundMouseDown = (e) => {
        self._dragging = true;
        self._dragStart = { x: e.clientX, y: e.clientY };
        self._panStart = { x: self._panX, y: self._panY };
      };
      this._boundMouseMove = (e) => {
        if (!self._dragging) return;
        self._panX = self._panStart.x + (e.clientX - self._dragStart.x) / self._zoom;
        self._panY = self._panStart.y + (e.clientY - self._dragStart.y) / self._zoom;
        self._dirty = true;
      };
      this._boundMouseUp = () => { self._dragging = false; };
      this._boundWheel = (e) => {
        e.preventDefault();
        const oldZoom = self._zoom;
        self._zoom = Math.max(1, Math.min(20, self._zoom + (e.deltaY > 0 ? -1 : 1)));
        if (self._zoom !== oldZoom) self._dirty = true;
      };

      canvas.addEventListener("mousedown", this._boundMouseDown);
      canvas.addEventListener("mousemove", this._boundMouseMove);
      canvas.addEventListener("mouseup", this._boundMouseUp);
      canvas.addEventListener("mouseleave", this._boundMouseUp);
      canvas.addEventListener("wheel", this._boundWheel, { passive: false });
    },
    onControl(id, value) {
      if (id === "ulam-zoom") { this._zoom = value; this._dirty = true; }
    },
    update(primes, currentIndex) {
      const end = Math.min(currentIndex, primes.length);
      const limit = Math.min(end, this._maxN + CATCH_UP_PER_FRAME);
      if (limit > this._maxN) {
        for (let i = this._maxN; i < limit; i++) {
          this._primeSet.add(primes[i]);
        }
        this._maxN = limit;
        this._dirty = true;
      }
    },
    draw(ctx, w, h) {
      if (w !== this._w || h !== this._h) {
        this._w = w;
        this._h = h;
        this._dirty = true;
      }
      if (!this._dirty && this._imgData) {
        ctx.putImageData(this._imgData, 0, 0);
        this._drawOverlay(ctx, w, h);
        return;
      }
      this._dirty = false;

      const dpr = window.devicePixelRatio || 1;
      const pw = Math.floor(w * dpr);
      const ph = Math.floor(h * dpr);

      if (!this._imgData || this._imgData.width !== pw || this._imgData.height !== ph) {
        this._imgData = ctx.createImageData(pw, ph);
      }
      const data = this._imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 10; data[i + 1] = 10; data[i + 2] = 26; data[i + 3] = 255;
      }

      const zoom = this._zoom;
      const cx = pw / 2 + this._panX * zoom * dpr;
      const cy = ph / 2 + this._panY * zoom * dpr;
      const primeSet = this._primeSet;

      // Determine visible range by bounding box
      const halfW = pw / 2 / (zoom * dpr) + Math.abs(this._panX);
      const halfH = ph / 2 / (zoom * dpr) + Math.abs(this._panY);
      const maxRing = Math.ceil(Math.max(halfW, halfH)) + 2;
      const maxN = Math.min((2 * maxRing + 1) * (2 * maxRing + 1), 500000);

      for (let n = 1; n <= maxN; n++) {
        if (!primeSet.has(n)) continue;
        const [sx, sy] = this._spiralCoords(n);
        const px = Math.round(cx + sx * zoom * dpr);
        const py = Math.round(cy + sy * zoom * dpr);

        const size = Math.max(1, Math.floor(zoom * dpr * 0.8));
        for (let dy = 0; dy < size; dy++) {
          for (let dx = 0; dx < size; dx++) {
            const ix = px + dx;
            const iy = py + dy;
            if (ix < 0 || ix >= pw || iy < 0 || iy >= ph) continue;
            const idx = (iy * pw + ix) * 4;
            const t = Math.min(1, n / 50000);
            data[idx] = 100 + 155 * (1 - t);
            data[idx + 1] = 140 + 115 * (1 - t);
            data[idx + 2] = 255;
          }
        }
      }

      ctx.putImageData(this._imgData, 0, 0);
      this._drawOverlay(ctx, w, h);
    },
    _drawOverlay(ctx, w, h) {
      const dp = window.devicePixelRatio || 1;
      ctx.save();
      ctx.setTransform(dp, 0, 0, dp, 0, 0);
      ctx.fillStyle = "#888";
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`Ulam Spiral (zoom: ${this._zoom}x, drag to pan)`, w / 2, 18);
      ctx.fillStyle = "#555";
      ctx.font = "10px monospace";
      ctx.fillText(`${this._primeSet.size.toLocaleString()} primes loaded`, w / 2, h - 8);
      ctx.restore();
    },
    resize(w, h) { this._dirty = true; },
    cleanup() {
      if (this._canvas) {
        this._canvas.removeEventListener("mousedown", this._boundMouseDown);
        this._canvas.removeEventListener("mousemove", this._boundMouseMove);
        this._canvas.removeEventListener("mouseup", this._boundMouseUp);
        this._canvas.removeEventListener("mouseleave", this._boundMouseUp);
        this._canvas.removeEventListener("wheel", this._boundWheel);
      }
      this._primeSet = null;
      this._imgData = null;
    }
  };
  window.PRIME_MODES["ulam-spiral"] = mode;
})();
