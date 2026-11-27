// Cramér Ratio — how close do the biggest gaps come to (ln p)²?
//
// Cramér's conjecture says gaps are at most about (ln p)². Dividing a gap by (ln p)²
// gives its Cramér ratio. Gold dots are the record gaps; the faint bars are the
// largest ratio found in each slice of the number line (records or not). The largest
// ratio known anywhere is about 0.92, for the gap of 1132 after 1,693,182,318,746,371.
(function() {
  const U = window.PrimeUtil;
  const START_P = 11;          // below this, (ln p)² is tiny and ratios are meaningless
  const BINS_PER_DECADE = 20;

  const mode = {
    label: "Cramér Ratio",
    controls: [],

    init() {
      this._s = { idx: 0, caughtUp: false };
      this._records = [];      // { p, gap, r }
      this._maxGap = 0;
      this._binMax = new Float64Array(10 * BINS_PER_DECADE);
      this._frontier = 2;
    },

    update(primes, currentIndex) {
      U.scan(this._s, primes, currentIndex, (i) => {
        const p = primes[i];
        const g = primes[i + 1] - p;
        if (p < START_P) { if (g > this._maxGap) this._maxGap = g; return; }
        const L = Math.log(p);
        const r = g / (L * L);
        const b = Math.floor(Math.log10(p) * BINS_PER_DECADE);
        if (r > this._binMax[b]) this._binMax[b] = r;
        if (g > this._maxGap) {
          this._maxGap = g;
          this._records.push({ p, gap: g, r });
        }
      });
      if (this._s.idx > 0) this._frontier = primes[this._s.idx];
    },

    draw(ctx, w, h) {
      U.clear(ctx, w, h);
      const listW = w > 760 ? 230 : 0;
      const A = U.area(w, h, { l: 56, r: 20 + listW, t: 34, b: 42 });
      if (!A || !this._records.length) { U.scanning(ctx, w, h, this._s); return; }

      const lx0 = 1, lx1 = Math.max(2, Math.ceil(Math.log10(this._frontier) + 0.2));
      const px = U.logPrimeAxis(ctx, A, lx0, lx1, "starting prime p (log scale)");
      const py = U.yAxis(ctx, A, 0, 1.1, { label: "gap ÷ (ln p)²" });

      // Per-slice maximum ratio
      ctx.fillStyle = "rgba(90,140,230,0.35)";
      const bw = A.w / ((lx1 - lx0) * BINS_PER_DECADE);
      for (let b = lx0 * BINS_PER_DECADE; b < lx1 * BINS_PER_DECADE; b++) {
        const r = this._binMax[b];
        if (!r) continue;
        const x = px(Math.pow(10, b / BINS_PER_DECADE));
        const y = py(Math.min(1.1, r));
        ctx.fillRect(x, y, Math.max(1, bw - 1), A.y + A.h - y);
      }

      // Cramér line at 1, and the best known ratio
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "rgba(255,120,90,0.8)";
      ctx.beginPath(); ctx.moveTo(A.x, py(1)); ctx.lineTo(A.x + A.w, py(1)); ctx.stroke();
      ctx.strokeStyle = "rgba(255,215,0,0.35)";
      ctx.beginPath(); ctx.moveTo(A.x, py(0.9206)); ctx.lineTo(A.x + A.w, py(0.9206)); ctx.stroke();
      ctx.setLineDash([]);

      // Records
      ctx.fillStyle = "#ffd700";
      for (const rec of this._records) {
        ctx.beginPath();
        ctx.arc(px(rec.p), py(Math.min(1.1, rec.r)), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      const last = this._records[this._records.length - 1];
      U.title(ctx, `Cramér ratio of record gaps: latest ${last.gap} → ${last.r.toFixed(3)}`, A.x + A.w / 2);
      U.legend(ctx, A.x + 8, A.y + 12, [
        { color: "#ffd700", text: "● record gaps" },
        { color: "rgba(120,170,255,0.9)", text: "■ largest ratio in each slice" },
        { color: "rgba(255,120,90,0.9)", text: "- - 1: Cramér's bound" },
        { color: "rgba(255,215,0,0.7)", text: "- - 0.9206: largest ratio known (p ≈ 1.7×10¹⁵)" }
      ]);

      if (listW) {
        const x0 = w - listW + 6;
        ctx.font = "11px monospace";
        ctx.textAlign = "left";
        ctx.fillStyle = "#888";
        ctx.fillText("gap   ratio  after prime", x0, A.y + 4);
        const rows = Math.min(this._records.length, Math.floor((A.h - 20) / 15));
        for (let k = 0; k < rows; k++) {
          const r = this._records[this._records.length - 1 - k];
          ctx.fillStyle = k === 0 ? "#ffd700" : "#777";
          ctx.fillText(`${String(r.gap).padStart(3)}   ${r.r.toFixed(3)}  ${r.p.toLocaleString()}`, x0, A.y + 22 + k * 15);
        }
      }
      U.scanning(ctx, w, h, this._s);
    },
    resize() {},
    cleanup() { this._records = []; }
  };
  window.PRIME_MODES["cramer-ratio"] = mode;
})();
