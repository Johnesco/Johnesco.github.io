// Sacks Spiral — primes in polar coords (angle=2π√n, r=√n)
(function() {
  const CATCH_UP_PER_FRAME = 20000;

  const mode = {
    label: "Sacks Spiral",
    controls: [
      { type: "range", id: "sacks-zoom", label: "Zoom", min: 1, max: 30, default: 5, step: 1 }
    ],
    _primeList: [],
    _maxProcessed: 0,
    _zoom: 5,
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

    init(ctx, canvas, primes) {
      this._primeList = [];
      this._maxProcessed = 0;
      this._panX = 0;
      this._panY = 0;
      this._dragging = false;
      this._dirty = true;
      this._canvas = canvas;

      const self = this;
      this._boundMouseDown = (e) => {
        self._dragging = true;
        self._dragStart = { x: e.clientX, y: e.clientY };
        self._panStart = { x: self._panX, y: self._panY };
      };
      this._boundMouseMove = (e) => {
        if (!self._dragging) return;
        self._panX = self._panStart.x + (e.clientX - self._dragStart.x);
        self._panY = self._panStart.y + (e.clientY - self._dragStart.y);
        self._dirty = true;
      };
      this._boundMouseUp = () => { self._dragging = false; };
      this._boundWheel = (e) => {
        e.preventDefault();
        const oldZoom = self._zoom;
        self._zoom = Math.max(1, Math.min(30, self._zoom + (e.deltaY > 0 ? -1 : 1)));
        if (self._zoom !== oldZoom) self._dirty = true;
      };

      canvas.addEventListener("mousedown", this._boundMouseDown);
      canvas.addEventListener("mousemove", this._boundMouseMove);
      canvas.addEventListener("mouseup", this._boundMouseUp);
      canvas.addEventListener("mouseleave", this._boundMouseUp);
      canvas.addEventListener("wheel", this._boundWheel, { passive: false });
    },
    onControl(id, value) {
      if (id === "sacks-zoom") { this._zoom = value; this._dirty = true; }
    },
    update(primes, currentIndex) {
      const end = Math.min(currentIndex, primes.length);
      const limit = Math.min(end, this._maxProcessed + CATCH_UP_PER_FRAME);
      if (limit > this._maxProcessed) {
        for (let i = this._maxProcessed; i < limit; i++) {
          this._primeList.push(primes[i]);
        }
        this._maxProcessed = limit;
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
      const cx = pw / 2 + this._panX * dpr;
      const cy = ph / 2 + this._panY * dpr;
      const TWO_PI = 2 * Math.PI;
      const list = this._primeList;

      for (let i = 0; i < list.length; i++) {
        const n = list[i];
        const sqrtN = Math.sqrt(n);
        const angle = TWO_PI * sqrtN;
        const r = sqrtN * zoom * dpr;
        const px = Math.round(cx + Math.cos(angle) * r);
        const py = Math.round(cy - Math.sin(angle) * r);

        if (px < 0 || px >= pw || py < 0 || py >= ph) continue;

        const dotSize = Math.max(1, Math.floor(zoom * dpr * 0.3));
        for (let dy = 0; dy < dotSize; dy++) {
          for (let dx = 0; dx < dotSize; dx++) {
            const ix = px + dx;
            const iy = py + dy;
            if (ix < 0 || ix >= pw || iy < 0 || iy >= ph) continue;
            const idx = (iy * pw + ix) * 4;
            const hue = ((angle * 180 / Math.PI) % 360 + 360) % 360;
            const t = hue / 360;
            data[idx] = 80 + 175 * t;
            data[idx + 1] = 160 + 80 * (1 - t);
            data[idx + 2] = 200 + 55 * t;
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
      ctx.fillText(`Sacks Spiral (zoom: ${this._zoom}x, drag to pan)`, w / 2, 18);
      ctx.fillStyle = "#555";
      ctx.font = "10px monospace";
      ctx.fillText(`${this._primeList.length.toLocaleString()} primes plotted`, w / 2, h - 8);
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
      this._primeList = [];
      this._imgData = null;
    }
  };
  window.PRIME_MODES["sacks-spiral"] = mode;
})();
