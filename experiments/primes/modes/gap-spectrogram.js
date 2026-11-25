// Gap Spectrogram — how common each gap size is, across the whole run.
//
// Each column is a stretch of consecutive primes, on a log scale (24 columns per
// doubling of the prime count) so the early primes, where gaps change fastest,
// aren't squeezed into one pixel. Each row is a gap size; brightness is
// how common that size is within the column. Two things to look for:
//   • bright rows at 6, 12, 18, 30 — gaps that are multiples of 6 are favoured,
//     because primes > 3 sit at 6k ± 1;
//   • the cloud slowly rising — the average gap near p is about ln p (white line =
//     measured average, dashed = ln p).
(function() {
  const PER_OCTAVE = 24;        // columns per doubling of the prime index
  const FIRST_COL = 64;         // column 0 holds the first 64 gaps
  const COLS = 23 * PER_OCTAVE; // 64·2^23 ≈ 537M gaps, past the 2^32 prime limit
  const BUCKETS = 160;          // row k = gap 2k (gap 1 shares row 0), so gaps up to 318
  const colEnd = (c) => Math.floor(FIRST_COL * Math.pow(2, c / PER_OCTAVE)); // first index past column c
  const CATCH_UP_PER_FRAME = 250000;

  // Color ramp: dark blue → violet → orange → pale yellow
  const LUT = new Uint8Array(256 * 3);
  (function buildLut() {
    const stops = [[0, 10, 10, 26], [0.25, 40, 30, 110], [0.5, 140, 50, 150], [0.75, 240, 120, 70], [1, 255, 240, 180]];
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      let s = 0;
      while (s < stops.length - 2 && t > stops[s + 1][0]) s++;
      const [t0, r0, g0, b0] = stops[s], [t1, r1, g1, b1] = stops[s + 1];
      const f = (t - t0) / (t1 - t0);
      LUT[i * 3] = r0 + (r1 - r0) * f;
      LUT[i * 3 + 1] = g0 + (g1 - g0) * f;
      LUT[i * 3 + 2] = b0 + (b1 - b0) * f;
    }
  })();

  function fmt(n) { // 1k, 2.5M, 10M, 1B
    const short = (v, u) => (v >= 10 || v % 1 === 0 ? Math.round(v) : v.toFixed(1)) + u;
    if (n >= 1e9) return short(n / 1e9, "B");
    if (n >= 1e6) return short(n / 1e6, "M");
    if (n >= 1e3) return short(n / 1e3, "k");
    return String(Math.round(n));
  }


  const mode = {
    label: "Gap Spectrogram",
    controls: [
      { type: "select", id: "gs-range", label: "Gaps up to", default: "100",
        options: [
          { value: "60", label: "60" },
          { value: "100", label: "100" },
          { value: "160", label: "160" },
          { value: "300", label: "300" }
        ]
      }
    ],

    init(ctx, canvas, primes) {
      this._hist = new Uint32Array(COLS * BUCKETS);
      this._count = new Uint32Array(COLS);    // gaps in each column
      this._gapSum = new Float64Array(COLS);  // for the average-gap line
      this._startP = new Float64Array(COLS);  // first prime of each column
      this._endP = new Float64Array(COLS);
      this._col = 0;
      this._colEnd = colEnd(1);
      this._processedIdx = 0;
      this._caughtUp = false;
      this._range = 100;
      this._off = document.createElement("canvas");
      this._off.width = COLS;
      this._off.height = BUCKETS;
      this._offCtx = this._off.getContext("2d");
      this._img = this._offCtx.createImageData(COLS, BUCKETS);
    },
    onControl(id, value) {
      if (id === "gs-range") this._range = Number(value);
    },

    update(primes, currentIndex) {
      const end = Math.min(currentIndex, primes.length - 1);
      const limit = Math.min(end, this._processedIdx + CATCH_UP_PER_FRAME);
      const H = this._hist;
      for (let i = this._processedIdx; i < limit; i++) {
        let c = this._col;
        while (i >= this._colEnd && c < COLS - 1) {
          c = ++this._col;
          this._colEnd = colEnd(c + 1);
        }
        if (this._count[c] === 0) this._startP[c] = primes[i];
        const gap = primes[i + 1] - primes[i];
        H[c * BUCKETS + Math.min(BUCKETS - 1, gap >> 1)]++;
        this._count[c]++;
        this._gapSum[c] += gap;
        this._endP[c] = primes[i + 1];
      }
      this._processedIdx = Math.max(this._processedIdx, limit);
      if (this._processedIdx >= end) this._caughtUp = true;
    },

    draw(ctx, w, h) {
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, w, h);
      const used = this._count[this._col] > 0 ? this._col + 1 : this._col;
      if (used < 1) return;

      const pad = { l: 50, r: 20, t: 34, b: 42 };
      const plotW = w - pad.l - pad.r;
      const plotH = h - pad.t - pad.b;
      if (plotW < 60 || plotH < 60) return;

      const rows = Math.min(BUCKETS, Math.floor(this._range / 2) + 1);

      // Paint the histogram: one pixel per (column, gap row), brightness scaled
      // within each column so the shape stays visible as the run grows.
      const px = this._img.data;
      px.fill(0);
      const H = this._hist;
      for (let c = 0; c < used; c++) {
        let colMax = 0;
        for (let k = 0; k < rows; k++) colMax = Math.max(colMax, H[c * BUCKETS + k]);
        if (colMax === 0) continue;
        for (let k = 0; k < rows; k++) {
          const v = H[c * BUCKETS + k];
          const t = Math.sqrt(v / colMax);
          const li = Math.min(255, (t * 255) | 0) * 3;
          const o = ((rows - 1 - k) * COLS + c) * 4;
          px[o] = LUT[li]; px[o + 1] = LUT[li + 1]; px[o + 2] = LUT[li + 2]; px[o + 3] = 255;
        }
      }
      this._offCtx.putImageData(this._img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this._off, 0, 0, used, rows, pad.l, pad.t, plotW, plotH);

      const colX = (c) => pad.l + (c + 0.5) / used * plotW;
      const gapY = (g) => pad.t + plotH * (1 - (g / 2 + 0.5) / rows);

      // Average gap per column (white) and ln p (dashed)
      ctx.save();
      ctx.beginPath(); ctx.rect(pad.l, pad.t, plotW, plotH); ctx.clip();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      for (let c = 0; c < used; c++) {
        if (!this._count[c]) continue;
        const y = gapY(this._gapSum[c] / this._count[c]);
        if (c === 0) ctx.moveTo(colX(c), y); else ctx.lineTo(colX(c), y);
      }
      ctx.stroke();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = "rgba(90,200,255,0.9)";
      ctx.beginPath();
      for (let c = 0; c < used; c++) {
        const mid = (this._startP[c] + this._endP[c]) / 2;
        const y = gapY(Math.log(Math.max(2, mid)));
        if (c === 0) ctx.moveTo(colX(c), y); else ctx.lineTo(colX(c), y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Y axis: gap sizes, multiples of 6 highlighted
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      const yStep = this._range > 160 ? 30 : this._range > 60 ? 12 : 6;
      for (let g = yStep; g <= this._range; g += yStep) {
        const y = gapY(g);
        ctx.fillStyle = g % 6 === 0 ? "#888" : "#555";
        ctx.fillText(String(g), pad.l - 6, y + 3);
      }
      ctx.save();
      ctx.translate(14, pad.t + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillStyle = "#555";
      ctx.fillText("gap size", 0, 0);
      ctx.restore();

      // X axis: primes at column boundaries
      ctx.textAlign = "center";
      ctx.fillStyle = "#555";
      const ticks = Math.min(6, used);
      for (let i = 0; i <= ticks; i++) {
        const c = Math.min(used - 1, Math.round(i / ticks * (used - 1)));
        const p = i === ticks ? this._endP[c] : this._startP[c];
        const x = pad.l + (i === ticks ? used : c) / used * plotW;
        ctx.fillText(fmt(p), x, pad.t + plotH + 14);
      }
      ctx.fillText("primes, in order (log scale)", pad.l + plotW / 2, pad.t + plotH + 30);

      // Title + legend
      ctx.fillStyle = "#888";
      ctx.font = "13px monospace";
      ctx.fillText(`Gap spectrogram: ${this._processedIdx.toLocaleString()} gaps`, pad.l + plotW / 2, 18);
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillText("— average gap", pad.l + 8, pad.t + 12);
      ctx.fillStyle = "rgba(90,200,255,0.9)"; ctx.fillText("- - ln p (prime number theorem)", pad.l + 8, pad.t + 25);
      ctx.fillStyle = "#aaa"; ctx.fillText("brightness = how common that gap is", pad.l + 8, pad.t + 38);

      if (!this._caughtUp) {
        ctx.fillStyle = "#555";
        ctx.textAlign = "center";
        ctx.fillText("scanning…", w / 2, h - 4);
      }
    },
    resize(w, h) {},
    cleanup() { this._hist = null; this._processedIdx = 0; }
  };
  window.PRIME_MODES["gap-spectrogram"] = mode;
})();
