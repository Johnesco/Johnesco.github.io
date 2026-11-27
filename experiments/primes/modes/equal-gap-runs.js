// Equal-Gap Runs — stretches of consecutive primes that are evenly spaced.
//
// A run of k equal gaps is k+1 consecutive primes in arithmetic progression,
// e.g. 251, 257, 263, 269 (three gaps of 6). Longer runs are rarer and appear later:
// five equal gaps first happen at 121,174,811 (gaps of 30). The chart places each run
// of 3+ equal gaps at its starting prime; the table counts every run length.
(function() {
  const U = window.PrimeUtil;
  const MAX_LEN = 12;
  const MAX_DOTS = 60000;       // stored dots for the chart (counts keep going after)
  const GAP_COLORS = { 2: "#9be7ff", 4: "#7aa7ff", 6: "#ff8c42", 12: "#ff5a7a", 18: "#e070ff", 30: "#ffd700" };

  const mode = {
    label: "Equal-Gap Runs",
    controls: [],

    init() {
      this._s = { idx: 1, caughtUp: false }; // from 3 onward (skip the gap of 1)
      this._prevGap = -1;
      this._runLen = 0;       // equal gaps in the current run
      this._runStart = 0;     // prime the current run starts at
      this._counts = new Float64Array(MAX_LEN + 1);
      this._first = [];       // run length → { p, gap }
      this._dots = [];        // { p, len, gap } for runs of 3+
      this._dots3 = 0;
      this._frontier = 3;
    },

    _close() {
      const L = this._runLen;
      if (L < 2) return;
      const k = Math.min(L, MAX_LEN);
      this._counts[k]++;
      if (!this._first[k]) this._first[k] = { p: this._runStart, gap: this._prevGap };
      // Runs of 4+ are rare enough to keep them all; runs of 3 are capped
      if (L >= 4 || (L === 3 && this._dots3++ < MAX_DOTS)) this._dots.push({ p: this._runStart, len: L, gap: this._prevGap });
    },

    update(primes, currentIndex) {
      U.scan(this._s, primes, currentIndex, (i) => {
        const g = primes[i + 1] - primes[i];
        if (g === this._prevGap) {
          this._runLen++;
        } else {
          this._close();
          this._runLen = 1;
          this._runStart = primes[i];
          this._prevGap = g;
        }
      });
      if (this._s.idx > 0) this._frontier = primes[this._s.idx];
    },

    draw(ctx, w, h) {
      U.clear(ctx, w, h);
      const tableW = w > 760 ? 300 : 0;
      const A = U.area(w, h, { l: 56, r: 20 + tableW, t: 34, b: 42 });
      if (!A) return;

      let maxLen = 3;
      for (let k = 3; k <= MAX_LEN; k++) if (this._counts[k] || (k === this._runLen && k >= 3)) maxLen = k;
      const lx0 = 2, lx1 = Math.max(3, Math.ceil(Math.log10(this._frontier) + 0.2));
      const px = U.logPrimeAxis(ctx, A, lx0, lx1, "starting prime (log scale)");
      const yHi = maxLen + 1;
      const py = (L) => A.y + A.h * (1 - (L - 2) / (yHi - 2));
      ctx.fillStyle = "#555";
      ctx.textAlign = "right";
      ctx.strokeStyle = "#1a1a33";
      for (let L = 3; L <= maxLen; L++) {
        ctx.beginPath(); ctx.moveTo(A.x, py(L)); ctx.lineTo(A.x + A.w, py(L)); ctx.stroke();
        ctx.fillText(String(L), A.x - 6, py(L) + 3);
      }
      ctx.save();
      ctx.translate(12, A.y + A.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("equal gaps in a row", 0, 0);
      ctx.restore();

      // Dots: jitter vertically a little so dense rows read as density
      for (let j = 0; j < this._dots.length; j++) {
        const d = this._dots[j];
        ctx.fillStyle = GAP_COLORS[d.gap] || "#aaa";
        const jit = (((j * 2654435761) >>> 0) % 1000 / 1000 - 0.5) * 0.5;
        const r = d.len >= 4 ? 3.5 : 1.2;
        ctx.beginPath();
        ctx.arc(px(d.p), py(d.len + jit), r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Gap colour key
      const keys = Object.entries(GAP_COLORS).map(([g, c]) => ({ color: c, text: `● gap ${g}` }));
      keys.push({ color: "#aaa", text: "● other gaps" });
      U.legend(ctx, A.x + 8, A.y + 12, keys);

      // Table: run length, primes in AP, count, first occurrence
      if (tableW) {
        const x0 = w - tableW + 8;
        ctx.font = "11px monospace";
        ctx.textAlign = "left";
        ctx.fillStyle = "#888";
        ctx.fillText("gaps primes      count  first at", x0, A.y + 4);
        let row = 0;
        for (let k = 2; k <= MAX_LEN; k++) {
          const c = this._counts[k];
          if (!c) continue;
          const f = this._first[k];
          ctx.fillStyle = k >= 4 ? "#ffd700" : "#aaa";
          ctx.fillText(`${String(k).padStart(3)}  ${String(k + 1).padStart(5)}  ${U.fmt(c).padStart(8)}  ${f.p.toLocaleString()} (+${f.gap})`, x0, A.y + 22 + row * 15);
          row++;
        }
        ctx.fillStyle = "#666";
        ctx.fillText("\"first at\": starting prime (+gap)", x0, A.y + 30 + row * 15 + 6);
      }

      let longest = 2;
      for (let k = MAX_LEN; k >= 2; k--) if (this._counts[k]) { longest = k; break; }
      U.title(ctx, `Equal-gap runs: longest so far ${longest} equal gaps (${longest + 1} evenly spaced primes)`, A.x + A.w / 2);
      U.scanning(ctx, w, h, this._s);
    },
    resize() {},
    cleanup() { this._dots = []; }
  };
  window.PRIME_MODES["equal-gap-runs"] = mode;
})();
