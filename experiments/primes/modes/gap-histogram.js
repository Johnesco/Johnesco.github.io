// Gap Histogram — bar chart of gap size frequencies
(function() {
  const MAX_GAP = 120;
  const CATCH_UP_PER_FRAME = 20000;

  const mode = {
    label: "Gap Histogram",
    controls: [
      { type: "select", id: "hist-yscale", label: "Y Scale", default: "log",
        options: [
          { value: "log", label: "Logarithmic" },
          { value: "linear", label: "Linear" }
        ]
      }
    ],
    _gapCounts: null,
    _yScale: "log",
    _processedIdx: 0,

    init(ctx, canvas, primes) {
      this._gapCounts = new Uint32Array(MAX_GAP + 1);
      this._processedIdx = 0;
      this._yScale = "log";
    },
    onControl(id, value) {
      if (id === "hist-yscale") this._yScale = value;
    },
    update(primes, currentIndex) {
      const end = Math.min(currentIndex, primes.length - 1);
      const limit = Math.min(end, this._processedIdx + CATCH_UP_PER_FRAME);
      while (this._processedIdx < limit) {
        const gap = primes[this._processedIdx + 1] - primes[this._processedIdx];
        if (gap <= MAX_GAP) this._gapCounts[gap]++;
        this._processedIdx++;
      }
    },
    draw(ctx, w, h) {
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, w, h);

      const gc = this._gapCounts;
      const pad = { l: 60, r: 20, t: 30, b: 40 };
      const plotW = w - pad.l - pad.r;
      const plotH = h - pad.t - pad.b;

      // Find max count
      let maxCount = 1;
      for (let g = 0; g <= MAX_GAP; g += 2) {
        if (gc[g] > maxCount) maxCount = gc[g];
      }

      const numBars = Math.floor(MAX_GAP / 2) + 1;
      const barW = Math.max(1, plotW / numBars - 1);

      const scaleY = (val) => {
        if (val <= 0) return 0;
        if (this._yScale === "log") return Math.log(val + 1) / Math.log(maxCount + 1);
        return val / maxCount;
      };

      // Bars
      for (let i = 0; i < numBars; i++) {
        const gap = i * 2;
        const count = gc[gap];
        if (count === 0) continue;
        const t = scaleY(count);
        const barH = t * plotH;
        const x = pad.l + i * (plotW / numBars);
        const y = pad.t + plotH - barH;
        const hue = 240 - (gap / MAX_GAP) * 180;
        ctx.fillStyle = `hsl(${hue}, 75%, ${30 + t * 30}%)`;
        ctx.fillRect(x, y, barW, barH);
      }

      // X axis labels
      ctx.fillStyle = "#666";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      const labelStep = Math.max(1, Math.floor(numBars / 20));
      for (let i = 0; i < numBars; i += labelStep) {
        const x = pad.l + i * (plotW / numBars) + barW / 2;
        ctx.fillText(String(i * 2), x, h - pad.b + 14);
      }

      // Y axis
      ctx.textAlign = "right";
      for (let i = 0; i <= 5; i++) {
        const t = i / 5;
        const y = pad.t + plotH * (1 - t);
        let val;
        if (this._yScale === "log") val = Math.round(Math.pow(maxCount + 1, t) - 1);
        else val = Math.round(maxCount * t);
        ctx.fillStyle = "#555";
        ctx.fillText(val.toLocaleString(), pad.l - 6, y + 4);
        ctx.strokeStyle = "#1a1a3a";
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(w - pad.r, y);
        ctx.stroke();
      }

      // Title
      ctx.fillStyle = "#888";
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Gap Size Distribution", w / 2, 18);
      ctx.fillStyle = "#555";
      ctx.font = "10px monospace";
      ctx.fillText(`${this._processedIdx.toLocaleString()} gaps · gap size \u2192`, w / 2, h - 4);
    },
    resize(w, h) {},
    cleanup() { this._gapCounts = null; this._processedIdx = 0; }
  };
  window.PRIME_MODES["gap-histogram"] = mode;
})();
