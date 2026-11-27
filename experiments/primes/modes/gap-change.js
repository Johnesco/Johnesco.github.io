// Gap Change — how much each gap differs from the one before it (g(n+1) − g(n)).
//
// The histogram is symmetric around 0: gaps don't drift up or down from one to the
// next. Changes that are multiples of 6 stand out, the same mod-6 bias seen in the
// gaps themselves. The bar at 0 counts a gap repeating exactly.
(function() {
  const U = window.PrimeUtil;
  const RANGE = 240;            // track changes in −240..240
  const SIZE = 2 * RANGE + 1;

  const mode = {
    label: "Gap Change",
    controls: [
      { type: "select", id: "gc-range", label: "Range ±", default: "60",
        options: [{ value: "30", label: "30" }, { value: "60", label: "60" }, { value: "120", label: "120" }, { value: "240", label: "240" }] },
      { type: "select", id: "gc-y", label: "Y scale", default: "linear",
        options: [{ value: "linear", label: "Linear" }, { value: "log", label: "Log" }] }
    ],

    init() {
      this._s = { idx: 1, caughtUp: false }; // from 3, 5, 7 onward (skip the gap of 1)
      this._c = new Float64Array(SIZE);
      this._n = 0;
      this._sum = 0;
      this._range = 60;
      this._y = "linear";
    },
    onControl(id, v) {
      if (id === "gc-range") this._range = Number(v);
      if (id === "gc-y") this._y = v;
    },

    update(primes, currentIndex) {
      const C = this._c;
      U.scan(this._s, primes, currentIndex, (i) => {
        const d = (primes[i + 2] - primes[i + 1]) - (primes[i + 1] - primes[i]);
        this._n++;
        this._sum += d;
        if (d >= -RANGE && d <= RANGE) C[d + RANGE]++;
      }, 2);
    },

    draw(ctx, w, h) {
      U.clear(ctx, w, h);
      const A = U.area(w, h, { l: 60, r: 20, t: 34, b: 42 });
      if (!A || this._n < 10) { U.scanning(ctx, w, h, this._s); return; }
      const R = this._range, C = this._c, n = this._n;
      const share = (d) => C[d + RANGE] / n;

      let maxS = 0, minS = Infinity;
      for (let d = -R; d <= R; d++) {
        const s = share(d);
        if (s > maxS) maxS = s;
        if (s > 0 && s < minS) minS = s;
      }
      const log = this._y === "log";
      const lo = log ? Math.pow(10, Math.floor(Math.log10(minS))) : 0;
      const hi = log ? maxS * 2 : maxS * 1.12;
      const pct = (v) => (v * 100 < 0.01 ? (v * 100).toExponential(0) : +(v * 100).toPrecision(2)) + "%";
      const py = U.yAxis(ctx, A, lo, hi, { log, label: "share of all gap changes", format: pct });
      const px = (d) => A.x + (d + R + 0.5) / (2 * R + 1) * A.w;
      const bw = A.w / (2 * R + 1);

      // Bars: multiples of 6 in orange, other changes in blue
      for (let d = -R; d <= R; d++) {
        const s = share(d);
        if (s <= lo) continue;
        ctx.fillStyle = d === 0 ? "#ffffff" : d % 6 === 0 ? "#ff8c42" : "#4f7fd0";
        const y = py(s);
        ctx.fillRect(px(d) - bw * 0.4, y, Math.max(1, bw * 0.8), A.y + A.h - y);
      }

      // x labels
      ctx.fillStyle = "#555";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      const step = U.niceStep(R / 5) < 6 ? 6 : Math.round(U.niceStep(R / 5) / 6) * 6;
      for (let d = -Math.floor(R / step) * step; d <= R; d += step) ctx.fillText(String(d), px(d), A.y + A.h + 14);
      ctx.fillText("next gap − this gap", A.x + A.w / 2, A.y + A.h + 30);

      let m6 = 0;
      for (let d = -RANGE; d <= RANGE; d++) if (d !== 0 && d % 6 === 0) m6 += C[d + RANGE];
      U.title(ctx, `Gap change: ${n.toLocaleString()} consecutive gap pairs, mean change ${(this._sum / n).toFixed(4)}`, A.x + A.w / 2);
      U.legend(ctx, A.x + 8, A.y + 12, [
        { color: "#fff", text: `■ 0: gap repeats exactly (${(share(0) * 100).toFixed(1)}%)` },
        { color: "#ff8c42", text: `■ non-zero multiple of 6 (${(m6 / n * 100).toFixed(1)}% of all changes)` },
        { color: "#4f7fd0", text: "■ other changes" }
      ]);
      U.scanning(ctx, w, h, this._s);
    },
    resize() {},
    cleanup() { this._c = null; }
  };
  window.PRIME_MODES["gap-change"] = mode;
})();
