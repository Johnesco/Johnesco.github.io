// Normalized Gaps — is the gap sequence random?
//
// Each gap is divided by ln p, its expected size near p (prime number theorem), so
// gaps from every part of the run can share one histogram. If primes were scattered
// at random with density 1/ln p (Cramér's model), these normalized gaps would follow
// the exponential density e^(−x): a straight line on a log scale.
(function() {
  const U = window.PrimeUtil;
  const BIN = 0.05;
  const MAX_X = 8;
  const NB = Math.round(MAX_X / BIN);

  const mode = {
    label: "Normalized Gaps",
    controls: [
      { type: "select", id: "ng-y", label: "Y scale", default: "log",
        options: [{ value: "log", label: "Log" }, { value: "linear", label: "Linear" }] }
    ],

    init() {
      this._s = { idx: 1, caughtUp: false }; // start at 3 (skip the gap of 1 after 2)
      this._hist = new Float64Array(NB);
      this._n = 0;
      this._sum = 0;
      this._y = "log";
    },
    onControl(id, v) { if (id === "ng-y") this._y = v; },

    update(primes, currentIndex) {
      const H = this._hist;
      U.scan(this._s, primes, currentIndex, (i) => {
        const p = primes[i], g = primes[i + 1] - p;
        const L = Math.log(p);
        this._n++;
        this._sum += g / L;
        // Gaps are even, so a gap g stands for the span [g−1, g+1]; spreading it over
        // that span avoids a comb pattern where bin edges and gap steps line up.
        const a = (g - 1) / L, b = (g + 1) / L;
        if (a >= MAX_X) return;
        const w = 1 / (b - a);
        const k0 = Math.floor(a / BIN), k1 = Math.min(NB - 1, Math.floor(b / BIN));
        for (let k = k0; k <= k1; k++) {
          const ov = Math.min(b, (k + 1) * BIN) - Math.max(a, k * BIN);
          if (ov > 0) H[k] += ov * w;
        }
      });
    },

    draw(ctx, w, h) {
      U.clear(ctx, w, h);
      const A = U.area(w, h, { l: 56, r: 20, t: 34, b: 42 });
      if (!A || this._n < 100) { U.scanning(ctx, w, h, this._s); return; }

      const dens = new Float64Array(NB);
      let maxD = 0, minD = Infinity;
      for (let k = 0; k < NB; k++) {
        dens[k] = this._hist[k] / (this._n * BIN);
        if (dens[k] > maxD) maxD = dens[k];
        if (dens[k] > 0 && dens[k] < minD) minD = dens[k];
      }
      const log = this._y === "log";
      const lo = log ? Math.max(1e-6, Math.pow(10, Math.floor(Math.log10(minD)))) : 0;
      const hi = log ? Math.max(1.5, maxD * 1.5) : Math.max(1, maxD) * 1.1;
      const py = U.yAxis(ctx, A, lo, hi, { log, label: "density", format: (v) => log && v < 0.01 ? v.toExponential(0) : String(+v.toFixed(2)) });
      const px = (x) => A.x + x / MAX_X * A.w;

      // x axis
      ctx.fillStyle = "#555";
      ctx.textAlign = "center";
      for (let x = 0; x <= MAX_X; x++) ctx.fillText(String(x), px(x), A.y + A.h + 14);
      ctx.fillText("gap ÷ ln p  (1 = an average gap)", A.x + A.w / 2, A.y + A.h + 30);

      // Observed histogram
      ctx.fillStyle = "rgba(120,170,255,0.75)";
      const bw = A.w / NB;
      for (let k = 0; k < NB; k++) {
        if (dens[k] <= lo) continue;
        const y = py(Math.min(hi, dens[k]));
        ctx.fillRect(A.x + k * bw, y, Math.max(1, bw - 0.5), A.y + A.h - y);
      }

      // Random model e^(−x)
      ctx.strokeStyle = "#ffb347";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= 200; i++) {
        const x = i / 200 * MAX_X, d = Math.exp(-x);
        if (d < lo) break;
        const X = px(x), Y = py(Math.min(hi, d));
        if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      U.title(ctx, `Normalized gaps: ${this._n.toLocaleString()} gaps, mean gap ÷ ln p = ${(this._sum / this._n).toFixed(3)}`, A.x + A.w / 2);
      U.legend(ctx, A.x + A.w - 280, A.y + 12, [
        { color: "rgba(140,190,255,1)", text: "■ observed gaps" },
        { color: "#ffb347", text: "- - e^(−x): primes placed at random" },
        { color: "#777", text: "ripples = gaps that are multiples of 6 are favoured" }
      ]);
      U.scanning(ctx, w, h, this._s);
    },
    resize() {},
    cleanup() { this._hist = null; }
  };
  window.PRIME_MODES["normalized-gaps"] = mode;
})();
