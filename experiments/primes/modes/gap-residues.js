// Gap Residues — how much more common is each gap size than a smooth curve predicts?
//
// Near a given p, gap counts fall off roughly exponentially with size. Dividing that
// smooth trend out leaves a factor per gap size. The trend is fitted separately for
// each doubling of the run (where ln p barely changes), then the factors are averaged. Hardy–Littlewood predicts the factor (the "singular
// series"): S(g) = product over odd primes q dividing g of (q−1)/(q−2). So multiples of
// 6 come out about 2×, of 10 about 1.33×, of 30 about 2.67×, of 14 about 1.2×.
// Bars = measured factor, dots = predicted factor.
(function() {
  const U = window.PrimeUtil;
  const MAX_GAP = 300;
  const MIN_COUNT = 200;   // only fit and show gap sizes with enough data
  const FIRST_OCT = 10;    // octaves start at prime index 2^10; earlier gaps are skipped
  const OCTS = 22;
  const WIN = 12;          // half-width (in gap size) of the local trend fit

  function singular(g) {
    let s = 1, m = g;
    while (m % 2 === 0) m /= 2;
    for (let q = 3; q * q <= m; q += 2) {
      if (m % q === 0) {
        s *= (q - 1) / (q - 2);
        while (m % q === 0) m /= q;
      }
    }
    if (m > 1) s *= (m - 1) / (m - 2);
    return s;
  }
  const S = new Float64Array(MAX_GAP + 1);
  for (let g = 2; g <= MAX_GAP; g += 2) S[g] = singular(g);

  function colorFor(g) {
    if (g % 30 === 0) return "#ffd700";
    if (g % 6 === 0) return "#ff7a45";
    if (g % 10 === 0) return "#5aa0ff";
    if (g % 14 === 0) return "#7fdc8a";
    return "#666a88";
  }

  const mode = {
    label: "Gap Residues",
    controls: [
      { type: "select", id: "gr-range", label: "Gaps up to", default: "90",
        options: [{ value: "60", label: "60" }, { value: "90", label: "90" }, { value: "150", label: "150" }] }
    ],

    init() {
      this._s = { idx: 1, caughtUp: false }; // skip the gap of 1
      this._c = new Float64Array(OCTS * (MAX_GAP + 1)); // counts per octave of the run
      this._n = 0;
      this._cache = null;
      this._range = 90;
    },
    onControl(id, v) { if (id === "gr-range") this._range = Number(v); },

    update(primes, currentIndex) {
      const C = this._c;
      U.scan(this._s, primes, currentIndex, (i) => {
        if (i < (1 << FIRST_OCT)) return;
        const o = Math.min(OCTS - 1, 31 - Math.clz32(i) - FIRST_OCT);
        const g = primes[i + 1] - primes[i];
        if (g <= MAX_GAP) C[o * (MAX_GAP + 1) + g]++;
        this._n++;
      });
      this._cache = null;
    },

    // Per octave: least-squares line through ln(count / S) against g (the smooth
    // exponential trend), then factor = count / trend. Factors are averaged over
    // octaves, weighted by each octave's count for that gap.
    _factors() {
      if (this._cache) return this._cache;
      const F = new Float64Array(MAX_GAP + 1), W = new Float64Array(MAX_GAP + 1);
      const C = this._c;
      for (let o = 0; o < OCTS; o++) {
        const base = o * (MAX_GAP + 1);
        let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
        for (let g = 2; g <= MAX_GAP; g += 2) {
          if (C[base + g] < MIN_COUNT) continue;
          const y = Math.log(C[base + g] / S[g]);
          n++; sx += g; sy += y; sxx += g * g; sxy += g * y;
        }
        if (n < 5) continue;
        // The log trend curves, so fit it locally: a line through the usable gaps
        // within ±WIN of g, weighted by count.
        for (let g = 2; g <= MAX_GAP; g += 2) {
          const c = C[base + g];
          if (c < MIN_COUNT) continue;
          let w = 0, mx = 0, my = 0, vxx = 0, vxy = 0;
          for (let h = Math.max(2, g - WIN); h <= Math.min(MAX_GAP, g + WIN); h += 2) {
            const ch = C[base + h];
            if (ch < MIN_COUNT) continue;
            const y = Math.log(ch / S[h]);
            w += ch; mx += ch * h; my += ch * y; vxx += ch * h * h; vxy += ch * h * y;
          }
          mx /= w; my /= w;
          const vx = vxx / w - mx * mx;
          const slope = vx > 0 ? (vxy / w - mx * my) / vx : 0;
          const trend = my + slope * (g - mx);
          F[g] += c * (c / Math.exp(trend));
          W[g] += c;
        }
      }
      let any = false;
      for (let g = 2; g <= MAX_GAP; g += 2) if (W[g] > 0) { F[g] /= W[g]; any = true; }
      this._cache = any ? { F, W } : null;
      return this._cache;
    },

    draw(ctx, w, h) {
      U.clear(ctx, w, h);
      const A = U.area(w, h, { l: 56, r: 20, t: 34, b: 42 });
      const fac = this._factors();
      if (!A || !fac) { U.scanning(ctx, w, h, this._s); return; }

      const R = this._range;
      const py = U.yAxis(ctx, A, 0, 3.2, { label: "frequency ÷ smooth trend", format: (v) => v.toFixed(1) + "×" });
      const slots = R / 2;
      const px = (g) => A.x + (g / 2 - 0.5) / slots * A.w;
      const bw = A.w / slots;

      // Baseline at 1×
      ctx.strokeStyle = "#444";
      ctx.beginPath(); ctx.moveTo(A.x, py(1)); ctx.lineTo(A.x + A.w, py(1)); ctx.stroke();

      for (let g = 2; g <= R; g += 2) {
        if (!fac.W[g]) continue;
        const f = fac.F[g];
        const y = py(Math.min(3.2, f));
        ctx.fillStyle = colorFor(g);
        ctx.fillRect(px(g) - bw * 0.35, y, Math.max(1, bw * 0.7), A.y + A.h - y);
        // Predicted factor
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(px(g), py(S[g]), Math.max(2, Math.min(4, bw * 0.2)), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#555";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      const step = R <= 60 ? 6 : R <= 90 ? 6 : 30;
      for (let g = step; g <= R; g += step) ctx.fillText(String(g), px(g), A.y + A.h + 14);
      ctx.fillText("gap size", A.x + A.w / 2, A.y + A.h + 30);

      U.title(ctx, `Gap residues: measured vs Hardy–Littlewood, ${this._n.toLocaleString()} gaps`, A.x + A.w / 2);
      U.legend(ctx, A.x + A.w - 300, A.y + 12, [
        { color: "#fff", text: "● predicted factor S(g)" },
        { color: "#ffd700", text: "■ multiple of 30   (predicted 2.67×)" },
        { color: "#ff7a45", text: "■ multiple of 6    (2×)" },
        { color: "#5aa0ff", text: "■ multiple of 10   (1.33×)" },
        { color: "#7fdc8a", text: "■ multiple of 14   (1.2×)" },
        { color: "#8a8eaa", text: "■ other gaps" }
      ]);
      U.scanning(ctx, w, h, this._s);
    },
    resize() {},
    cleanup() { this._c = null; }
  };
  window.PRIME_MODES["gap-residues"] = mode;
})();
