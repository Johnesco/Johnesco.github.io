// Gap Landscape — scrolling mountain silhouette of gap sizes
(function() {
  const MAX_VISIBLE = 2000;  // ring buffer size — only keep last N gaps
  const CATCH_UP_PER_FRAME = 20000;

  const mode = {
    label: "Gap Landscape",
    controls: [
      { type: "range", id: "gl-exag", label: "Height", min: 1, max: 10, default: 3, step: 1 }
    ],
    _buf: null,        // Float32Array ring buffer
    _head: 0,          // write position in ring
    _count: 0,         // total entries written (min(count, MAX_VISIBLE) = readable)
    _processedIdx: 0,
    _maxGap: 2,
    _exag: 3,

    init(ctx, canvas, primes) {
      this._buf = new Float32Array(MAX_VISIBLE);
      this._head = 0;
      this._count = 0;
      this._processedIdx = 0;
      this._maxGap = 2;
      this._exag = 3;
    },
    onControl(id, value) {
      if (id === "gl-exag") this._exag = value;
    },
    update(primes, currentIndex) {
      const end = Math.min(currentIndex, primes.length - 1);
      const limit = Math.min(end, this._processedIdx + CATCH_UP_PER_FRAME);
      while (this._processedIdx < limit) {
        const gap = primes[this._processedIdx + 1] - primes[this._processedIdx];
        this._buf[this._head] = gap;
        this._head = (this._head + 1) % MAX_VISIBLE;
        this._count++;
        if (gap > this._maxGap) this._maxGap = gap;
        this._processedIdx++;
      }
    },
    draw(ctx, w, h) {
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, w, h);

      const readable = Math.min(this._count, MAX_VISIBLE);
      if (readable < 2) return;

      const pad = { l: 10, r: 10, t: 30, b: 10 };
      const plotW = w - pad.l - pad.r;
      const plotH = h - pad.t - pad.b;
      const baseY = pad.t + plotH;

      const visible = Math.min(readable, Math.floor(plotW));
      const xStep = plotW / visible;
      const maxH = this._maxGap;

      // Read from ring buffer (oldest visible → newest)
      const startRing = (this._head - visible + MAX_VISIBLE) % MAX_VISIBLE;

      // Gradient
      const grad = ctx.createLinearGradient(0, pad.t, 0, baseY);
      grad.addColorStop(0, "#ff6b4a");
      grad.addColorStop(0.3, "#cc4466");
      grad.addColorStop(0.6, "#6644aa");
      grad.addColorStop(1, "#1a1a3e");

      // Mountain silhouette
      ctx.beginPath();
      ctx.moveTo(pad.l, baseY);
      for (let i = 0; i < visible; i++) {
        const gap = this._buf[(startRing + i) % MAX_VISIBLE];
        const x = pad.l + i * xStep;
        const gapH = (gap / maxH) * plotH * this._exag;
        const y = baseY - Math.min(gapH, plotH);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(pad.l + visible * xStep, baseY);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Ridge outline
      ctx.strokeStyle = "#ff8866";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 0; i < visible; i++) {
        const gap = this._buf[(startRing + i) % MAX_VISIBLE];
        const x = pad.l + i * xStep;
        const gapH = (gap / maxH) * plotH * this._exag;
        const y = baseY - Math.min(gapH, plotH);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Stars
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      for (let i = 0; i < 80; i++) {
        const sx = ((i * 7919 + 42) % 1000) / 1000 * w;
        const sy = ((i * 6271 + 42) % 1000) / 1000 * (h * 0.5);
        ctx.fillRect(sx, sy, 1, 1);
      }

      // Title & status
      ctx.fillStyle = "#888";
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`Gap Landscape (max gap: ${this._maxGap})`, w / 2, 18);
      if (this._processedIdx < this._count + CATCH_UP_PER_FRAME) {
        ctx.fillStyle = "#555";
        ctx.font = "10px monospace";
        ctx.fillText(`${this._processedIdx.toLocaleString()} gaps processed`, w / 2, h - 4);
      }
    },
    resize(w, h) {},
    cleanup() { this._buf = null; this._count = 0; this._processedIdx = 0; }
  };
  window.PRIME_MODES["gap-landscape"] = mode;
})();
