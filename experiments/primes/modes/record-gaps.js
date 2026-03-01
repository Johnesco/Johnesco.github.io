// Record Gap Tracker — line chart with high-water-mark stepped line
(function() {
  const MAX_VISIBLE = 2000;  // ring buffer for gap line
  const CATCH_UP_PER_FRAME = 20000;

  const mode = {
    label: "Record Gaps",
    controls: [
      { type: "select", id: "recgap-yscale", label: "Y Scale", default: "linear",
        options: [
          { value: "linear", label: "Linear" },
          { value: "log", label: "Logarithmic" }
        ]
      }
    ],
    _buf: null,           // ring buffer of recent gaps
    _head: 0,
    _count: 0,
    _records: [],         // {idx, gap} — record-breaking gaps (small array)
    _maxGap: 0,
    _runningMax: 0,
    _processedIdx: 0,
    _yScale: "linear",
    _flashTimer: 0,

    init(ctx, canvas, primes) {
      this._buf = new Float32Array(MAX_VISIBLE);
      this._head = 0;
      this._count = 0;
      this._records = [];
      this._maxGap = 0;
      this._runningMax = 0;
      this._processedIdx = 0;
      this._yScale = "linear";
      this._flashTimer = 0;
    },
    onControl(id, value) {
      if (id === "recgap-yscale") this._yScale = value;
    },
    update(primes, currentIndex) {
      const end = Math.min(currentIndex, primes.length - 1);
      const limit = Math.min(end, this._processedIdx + CATCH_UP_PER_FRAME);
      while (this._processedIdx < limit) {
        const gap = primes[this._processedIdx + 1] - primes[this._processedIdx];
        this._buf[this._head] = gap;
        this._head = (this._head + 1) % MAX_VISIBLE;
        this._count++;
        if (gap > this._maxGap) {
          this._maxGap = gap;
          this._records.push({ idx: this._processedIdx, gap });
          this._flashTimer = 30;
        }
        this._processedIdx++;
      }
      if (this._flashTimer > 0) this._flashTimer--;
    },
    draw(ctx, w, h) {
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, w, h);

      const readable = Math.min(this._count, MAX_VISIBLE);
      if (readable < 2) return;

      const pad = { l: 60, r: 20, t: 30, b: 30 };
      const plotW = w - pad.l - pad.r;
      const plotH = h - pad.t - pad.b;
      const maxY = this._maxGap || 1;

      const scaleY = (val) => {
        if (this._yScale === "log") return val > 0 ? Math.log(val + 1) / Math.log(maxY + 1) : 0;
        return val / maxY;
      };

      const visible = Math.min(readable, Math.floor(plotW));
      const startRing = (this._head - visible + MAX_VISIBLE) % MAX_VISIBLE;
      const xStep = plotW / visible;

      // Gap line (blue)
      ctx.strokeStyle = "#4477aa";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < visible; i++) {
        const gap = this._buf[(startRing + i) % MAX_VISIBLE];
        const x = pad.l + i * xStep;
        const y = pad.t + plotH * (1 - scaleY(gap));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // High-water-mark (gold stepped line)
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 2;
      ctx.beginPath();
      let runMax = 0;
      for (let i = 0; i < visible; i++) {
        const gap = this._buf[(startRing + i) % MAX_VISIBLE];
        if (gap > runMax) runMax = gap;
        const x = pad.l + i * xStep;
        const y = pad.t + plotH * (1 - scaleY(runMax));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Flash on new record
      if (this._flashTimer > 0 && this._records.length > 0) {
        const last = this._records[this._records.length - 1];
        const alpha = this._flashTimer / 30;
        ctx.fillStyle = `rgba(255, 215, 0, ${(alpha * 0.15).toFixed(3)})`;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha.toFixed(3)})`;
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`New record gap: ${last.gap}`, w / 2, pad.t - 6);
      }

      // Y axis
      ctx.fillStyle = "#555";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      for (let i = 0; i <= 5; i++) {
        const t = i / 5;
        const y = pad.t + plotH * (1 - t);
        let val;
        if (this._yScale === "log") val = Math.round(Math.pow(maxY + 1, t) - 1);
        else val = Math.round(maxY * t);
        ctx.fillText(String(val), pad.l - 6, y + 4);
      }

      // Title
      ctx.fillStyle = "#888";
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`Record Gaps (${this._records.length} records, max=${this._maxGap})`, w / 2, 18);
      ctx.fillStyle = "#555";
      ctx.font = "10px monospace";
      ctx.fillText(`${this._processedIdx.toLocaleString()} gaps processed`, w / 2, h - 4);
    },
    resize(w, h) {},
    cleanup() { this._buf = null; this._records = []; this._processedIdx = 0; }
  };
  window.PRIME_MODES["record-gaps"] = mode;
})();
