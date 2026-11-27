// Prime Pairs — twin (p, p+2), cousin (p, p+4) and sexy (p, p+6) primes counted
// against the Hardy–Littlewood conjecture.
//
// Hardy and Littlewood predicted how many pairs (p, p+h) with both prime lie below x:
//   π_h(x) ≈ 2·C₂·S(h)·∫₂ˣ dt/(ln t)²,   C₂ = 0.6601618… (twin prime constant)
// with S(2) = S(4) = 1 and S(6) = 2 (sexy pairs should be twice as common). It is
// unproven, even that infinitely many twins exist. Each line is actual ÷ predicted;
// all three should settle toward 1.
(function() {
  const U = window.PrimeUtil;
  const C2 = 0.6601618158468696;
  const HS = [2, 4, 6];
  const S = { 2: 1, 4: 1, 6: 2 };
  const COLORS = { 2: "#9be7ff", 4: "#7aa7ff", 6: "#ff8c42" };
  const CHECK_GROWTH = 1.015;  // a data point every 1.5% of growth in x

  const f = (t) => { const l = Math.log(t); return 1 / (l * l); };

  const mode = {
    label: "Prime Pairs",
    controls: [],

    init() {
      this._s = { idx: 0, caughtUp: false };
      this._count = { 2: 0, 4: 0, 6: 0 };
      this._li2 = 0;           // ∫₂ˣ dt/(ln t)² up to _lastX
      this._lastX = 2;
      this._nextCheck = 100;
      this._points = [];       // { x, r2, r4, r6 }
      this._x = 2;
    },

    // Advance the integral to x (Simpson's rule over small steps)
    _integrateTo(x) {
      let a = this._lastX;
      while (a < x) {
        const b = Math.min(x, a * 1.01 + 1);
        this._li2 += (b - a) / 6 * (f(a) + 4 * f((a + b) / 2) + f(b));
        a = b;
      }
      this._lastX = x;
    },

    _predicted(h) { return 2 * C2 * S[h] * this._li2; },

    update(primes, currentIndex) {
      const cnt = this._count;
      U.scan(this._s, primes, currentIndex, (i) => {
        const p = primes[i];
        // Is p + h prime? Look at the next few primes (at most 3 fit within p+6).
        for (let j = 1; j <= 3; j++) {
          const d = primes[i + j] - p;
          if (d > 6) break;
          if (d === 2 || d === 4 || d === 6) cnt[d]++;
        }
        if (p >= this._nextCheck) {
          this._integrateTo(p);
          this._points.push({ x: p, r2: cnt[2] / this._predicted(2), r4: cnt[4] / this._predicted(4), r6: cnt[6] / this._predicted(6) });
          this._nextCheck = p * CHECK_GROWTH;
        }
      }, 3);
      if (this._s.idx > 0) this._x = primes[this._s.idx];
    },

    draw(ctx, w, h) {
      U.clear(ctx, w, h);
      const panelW = w > 760 ? 260 : 0;
      const A = U.area(w, h, { l: 56, r: 20 + panelW, t: 34, b: 42 });
      const pts = this._points;
      if (!A || pts.length < 2) { U.scanning(ctx, w, h, this._s); return; }

      // y range: centred on 1, wide enough for the data after x = 1000
      let dev = 0.1;
      for (const p of pts) {
        if (p.x < 1000) continue;
        dev = Math.max(dev, Math.abs(p.r2 - 1), Math.abs(p.r4 - 1), Math.abs(p.r6 - 1));
      }
      dev = Math.min(0.6, dev * 1.15);
      const lx0 = 2, lx1 = Math.max(3, Math.ceil(Math.log10(this._x) + 0.1));
      const px = U.logPrimeAxis(ctx, A, lx0, lx1, "x (log scale)");
      const py = U.yAxis(ctx, A, 1 - dev, 1 + dev, { label: "actual ÷ predicted", format: (v) => v.toFixed(2) });

      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(A.x, py(1)); ctx.lineTo(A.x + A.w, py(1)); ctx.stroke();
      ctx.setLineDash([]);

      ctx.save();
      ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
      for (const hh of HS) {
        ctx.strokeStyle = COLORS[hh];
        ctx.lineWidth = 2;
        ctx.beginPath();
        pts.forEach((p, k) => {
          const y = py(p["r" + hh]);
          if (k === 0) ctx.moveTo(px(p.x), y); else ctx.lineTo(px(p.x), y);
        });
        ctx.stroke();
      }
      ctx.restore();

      U.legend(ctx, A.x + 8, A.y + 12, [
        { color: COLORS[2], text: "— twin primes (p, p+2)" },
        { color: COLORS[4], text: "— cousin primes (p, p+4)" },
        { color: COLORS[6], text: "— sexy primes (p, p+6), predicted 2×" },
        { color: "#aaa", text: "- - 1: exactly as predicted" }
      ]);

      if (panelW) {
        const x0 = w - panelW + 8;
        this._integrateTo(this._x);
        ctx.font = "11px monospace";
        ctx.textAlign = "left";
        ctx.fillStyle = "#888";
        ctx.fillText(`pairs with p ≤ ${U.fmt(this._x)}`, x0, A.y + 4);
        ctx.fillText("        actual  predicted", x0, A.y + 24);
        HS.forEach((hh, k) => {
          ctx.fillStyle = COLORS[hh];
          const name = { 2: "twin  ", 4: "cousin", 6: "sexy  " }[hh];
          ctx.fillText(`${name}  ${U.fmt(this._count[hh]).padStart(6)}  ${U.fmt(this._predicted(hh)).padStart(9)}`, x0, A.y + 42 + k * 16);
        });
        ctx.fillStyle = "#666";
        const notes = ["Hardy–Littlewood (1923):", "π_h(x) ≈ 2·C₂·S(h)·∫dt/ln²t", "C₂ = 0.66016…", "unproven: nobody knows", "if twins go on forever"];
        notes.forEach((t, k) => ctx.fillText(t, x0, A.y + 110 + k * 15));
      }

      U.title(ctx, "Prime pairs vs the Hardy–Littlewood prediction", A.x + A.w / 2);
      U.scanning(ctx, w, h, this._s);
    },
    resize() {},
    cleanup() { this._points = []; }
  };
  window.PRIME_MODES["prime-pairs"] = mode;
})();
