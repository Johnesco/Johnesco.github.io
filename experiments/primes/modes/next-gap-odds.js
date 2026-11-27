// Next-Gap Odds — does one gap influence the next?
//
// For every pair of consecutive gaps (a, then b), compare how often it happens with
// how often it would if consecutive gaps were independent. Red = more often, blue =
// less. Some pairs can never happen: if a and b leave the same nonzero remainder mod
// 3 (e.g. 4 then 4, or 2 then 8), one of p, p+a, p+a+b is divisible by 3. Those
// cells are shown dark, and the independence baseline is fitted only over pairs that
// can happen (iterative proportional fitting to the row and column totals). What is
// left is subtler structure from how three primes fit together (Hardy-Littlewood
// for triples); the last-digit "prime conspiracy" (Lemke Oliver & Soundararajan,
// 2016) is these same effects seen through the last digit.
(function() {
  const U = window.PrimeUtil;
  const MAX_GAP = 200;               // gaps 2..200 tracked
  const K = MAX_GAP / 2;             // class k ↔ gap 2(k+1)
  const MIN_EXPECTED = 25;           // grey out cells with too little data to judge
  const gapOf = (k) => 2 * (k + 1);
  // Mod-3 rule: a then b is impossible when a and b leave the same nonzero remainder mod 3
  const POSSIBLE = new Uint8Array(K * K);
  for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) {
    const ra = gapOf(a) % 3, rb = gapOf(b) % 3;
    POSSIBLE[a * K + b] = ra !== 0 && ra === rb ? 0 : 1;
  }
  const FIT_EVERY = 20;              // frames between refits of the baseline

  const mode = {
    label: "Next-Gap Odds",
    controls: [
      { type: "select", id: "ngo-range", label: "Gaps up to", default: "60",
        options: [{ value: "30", label: "30" }, { value: "60", label: "60" }, { value: "100", label: "100" }, { value: "200", label: "200" }] }
    ],

    init(ctx, canvas) {
      this._s = { idx: 1, caughtUp: false }; // from 3, 5, 7 (skip the gap of 1)
      this._c = new Float64Array(K * K);
      this._row = new Float64Array(K);
      this._col = new Float64Array(K);
      this._n = 0;
      this._range = 60;
      this._mouse = U.trackMouse(canvas);
      this._E = new Float64Array(K * K);
      this._frame = 0;
    },

    // Expected counts under independence, restricted to possible pairs: scale a
    // matrix (1 on possible cells, 0 elsewhere) until its row and column sums match
    // the observed ones.
    _fitExpected() {
      const E = this._E, R = this._row, Q = this._col;
      for (let i = 0; i < K * K; i++) E[i] = POSSIBLE[i];
      for (let it = 0; it < 30; it++) {
        for (let a = 0; a < K; a++) {
          let s = 0;
          for (let b = 0; b < K; b++) s += E[a * K + b];
          const f = s > 0 ? R[a] / s : 0;
          for (let b = 0; b < K; b++) E[a * K + b] *= f;
        }
        for (let b = 0; b < K; b++) {
          let s = 0;
          for (let a = 0; a < K; a++) s += E[a * K + b];
          const f = s > 0 ? Q[b] / s : 0;
          for (let a = 0; a < K; a++) E[a * K + b] *= f;
        }
      }
    },
    onControl(id, v) { if (id === "ngo-range") this._range = Number(v); },

    update(primes, currentIndex) {
      U.scan(this._s, primes, currentIndex, (i) => {
        const a = primes[i + 1] - primes[i], b = primes[i + 2] - primes[i + 1];
        if (a > MAX_GAP || b > MAX_GAP) return;
        const ka = a / 2 - 1, kb = b / 2 - 1;
        this._c[ka * K + kb]++;
        this._row[ka]++;
        this._col[kb]++;
        this._n++;
      }, 2);
    },

    draw(ctx, w, h) {
      U.clear(ctx, w, h);
      const A = U.area(w, h, { l: 70, r: 200, t: 34, b: 46 });
      if (!A || this._n < 100) { U.scanning(ctx, w, h, this._s); return; }
      const D = this._range / 2;
      const cell = Math.floor(Math.min(A.w, A.h) / D);
      const ox = A.x, oy = A.y;
      const n = this._n, C = this._c, EX = this._E;
      if (this._frame++ % FIT_EVERY === 0 || !this._s.caughtUp) this._fitExpected();

      // Cells: log2(observed / expected), clamped to ±1
      let hover = null;
      const m = this._mouse;
      for (let a = 0; a < D; a++) {
        for (let b = 0; b < D; b++) {
          const E = EX[a * K + b];
          const x = ox + a * cell, y = oy + b * cell;
          if (!POSSIBLE[a * K + b]) {
            ctx.fillStyle = "#050510";
          } else if (E < MIN_EXPECTED) {
            ctx.fillStyle = "#141428";
          } else {
            const r = Math.max(-1, Math.min(1, Math.log2((C[a * K + b] + 0.5) / E)));
            const t = Math.abs(r);
            ctx.fillStyle = r > 0
              ? `rgb(${40 + 215 * t | 0},${30 + 40 * t | 0},${50 + 10 * t | 0})`
              : `rgb(${40 - 10 * t | 0},${50 + 80 * t | 0},${60 + 195 * t | 0})`;
          }
          ctx.fillRect(x, y, cell - (cell > 4 ? 1 : 0), cell - (cell > 4 ? 1 : 0));
          if (!POSSIBLE[a * K + b] && cell > 6) {   // mark impossible cells with an ×
            ctx.strokeStyle = "#2a2a40";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 2, y + 2); ctx.lineTo(x + cell - 3, y + cell - 3);
            ctx.moveTo(x + cell - 3, y + 2); ctx.lineTo(x + 2, y + cell - 3);
            ctx.stroke();
          }
          if (m.inside && m.x >= x && m.x < x + cell && m.y >= y && m.y < y + cell) hover = { a, b, E };
        }
      }

      // Axes
      ctx.fillStyle = "#555";
      ctx.font = "10px monospace";
      const step = this._range <= 30 ? 2 : this._range <= 60 ? 6 : this._range <= 100 ? 10 : 30;
      ctx.textAlign = "center";
      for (let g = step; g <= this._range; g += step) ctx.fillText(String(g), ox + (g / 2 - 0.5) * cell, oy + D * cell + 13);
      ctx.fillText("this gap →", ox + D * cell / 2, oy + D * cell + 28);
      ctx.textAlign = "right";
      for (let g = step; g <= this._range; g += step) ctx.fillText(String(g), ox - 5, oy + (g / 2 - 0.5) * cell + 3);
      ctx.save();
      ctx.translate(14, oy + D * cell / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("next gap →", 0, 0);
      ctx.restore();

      // Diagonal summary over the repeats that can happen (gaps divisible by 6)
      let obsD = 0, expD = 0;
      for (let a = 0; a < K; a++) {
        const E = EX[a * K + a];
        if (POSSIBLE[a * K + a] && E >= MIN_EXPECTED) { obsD += C[a * K + a]; expD += E; }
      }
      const repeatPct = (1 - obsD / expD) * 100;

      // Side panel: color key, summary, hover detail
      const sx = ox + D * cell + 20;
      U.legend(ctx, sx, oy + 10, [
        { color: "#ff5a4a", text: "■ more often than" },
        { color: "#ff5a4a", text: "  independent (up to 2×)" },
        { color: "#5a8cff", text: "■ less often (down to ½×)" },
        { color: "#666", text: "■ too few to judge" },
        { color: "#555", text: "× impossible (mod 3)" }
      ]);
      ctx.fillStyle = "#ccc";
      ctx.font = "11px monospace";
      ctx.fillText("Repeated gaps", sx, oy + 92);
      ctx.fillText("(6 then 6, 12 then 12...)", sx, oy + 107);
      ctx.fillStyle = repeatPct >= 0 ? "#5a8cff" : "#ff5a4a";
      ctx.font = "bold 13px monospace";
      ctx.fillText(`${Math.abs(repeatPct).toFixed(1)}% ${repeatPct >= 0 ? "less" : "more"} often`, sx, oy + 125);
      ctx.fillStyle = "#ccc";
      ctx.font = "11px monospace";
      ctx.fillText("than if gaps were", sx, oy + 140);
      ctx.fillText("independent.", sx, oy + 155);
      if (hover) {
        const obs = C[hover.a * K + hover.b];
        const ga = gapOf(hover.a), gb = gapOf(hover.b);
        const lines = POSSIBLE[hover.a * K + hover.b] ? [
          `gap ${ga}, then ${gb}`,
          `seen:     ${obs.toLocaleString()}`,
          `expected: ${Math.round(hover.E).toLocaleString()}`,
          `ratio:    ${(obs / hover.E).toFixed(3)}×`
        ] : [`gap ${ga}, then ${gb}`, "impossible: one of", "p, p+a, p+a+b would", "be divisible by 3"];
        ctx.fillStyle = "#aaf";
        lines.forEach((t, k) => ctx.fillText(t, sx, oy + 195 + k * 15));
      } else {
        ctx.fillStyle = "#666";
        ctx.fillText("hover a cell", sx, oy + 195);
      }

      U.title(ctx, `Next-gap odds vs independence: ${n.toLocaleString()} gap pairs`, w / 2);
      U.scanning(ctx, w, h, this._s);
    },
    resize() {},
    cleanup() { if (this._mouse) this._mouse.stop(); this._c = null; }
  };
  window.PRIME_MODES["next-gap-odds"] = mode;
})();
