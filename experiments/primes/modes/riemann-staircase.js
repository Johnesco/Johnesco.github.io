// Riemann's Staircase — rebuild the prime-counting function π(x) from zeta zeros.
//
// Riemann's explicit formula:
//   π(x) ≈ R(x) − Σ_ρ R(x^ρ) − 1/ln x + arctan(π/ln x)/π
// where ρ = ½ + iγ runs over the nontrivial zeros of ζ(s). Each conjugate pair of
// zeros adds one wave, −2·Re li(x^ρ), to the smooth curve R(x). With enough waves
// the smooth curve sharpens into the true staircase, a step at every prime.
//
// The zeros are computed here with the Riemann–Siegel formula (sign changes of
// Hardy's Z(t), refined by bisection). That every zero found sits on the line
// Re(s) = ½ is the Riemann Hypothesis: checked for trillions of zeros, still unproven.
(function() {
  const ZERO_COUNT = 1000;
  const SAMPLES_PER_PX = 2;
  const TWO_PI = 2 * Math.PI;

  // ─── Hardy Z(t) via Riemann–Siegel ─────────────────────────
  function theta(t) {
    return t / 2 * Math.log(t / TWO_PI) - t / 2 - Math.PI / 8 + 1 / (48 * t) + 7 / (5760 * t * t * t);
  }
  function hardyZ(t) {
    const a = Math.sqrt(t / TWO_PI);
    const N = Math.floor(a);
    let p = a - N;
    const th = theta(t);
    let sum = 0;
    for (let n = 1; n <= N; n++) sum += Math.cos(th - t * Math.log(n)) / Math.sqrt(n);
    sum *= 2;
    // Leading correction term C0(p); it has removable singularities at p = ¼, ¾
    let d = Math.cos(TWO_PI * p);
    if (Math.abs(d) < 1e-9) { p += 1e-7; d = Math.cos(TWO_PI * p); }
    const c0 = Math.cos(TWO_PI * (p * p - p - 1 / 16)) / d;
    const sign = (N - 1) % 2 === 0 ? 1 : -1;
    return sum + sign * Math.pow(TWO_PI / t, 0.25) * c0;
  }

  let cachedZeros = null;
  function computeZeros(count) {
    if (cachedZeros) return cachedZeros;
    const zeros = new Float64Array(count);
    const step = 0.02;
    let found = 0;
    let t0 = 10, z0 = hardyZ(t0);
    while (found < count) {
      const t1 = t0 + step, z1 = hardyZ(t1);
      if ((z0 < 0) !== (z1 < 0)) {
        let lo = t0, hi = t1, zlo = z0;
        for (let i = 0; i < 40; i++) {
          const mid = (lo + hi) / 2, zm = hardyZ(mid);
          if ((zm < 0) === (zlo < 0)) { lo = mid; zlo = zm; } else hi = mid;
        }
        zeros[found++] = (lo + hi) / 2;
      }
      t0 = t1; z0 = z1;
    }
    cachedZeros = zeros;
    return zeros;
  }

  // ─── Riemann's R(x) via the Gram series ─────────────────────
  const zetaCache = [];
  function zetaReal(s) { // s >= 2, Euler–Maclaurin tail
    if (zetaCache[s] !== undefined) return zetaCache[s];
    const N = 30;
    let sum = 0;
    for (let n = 1; n < N; n++) sum += Math.pow(n, -s);
    sum += Math.pow(N, 1 - s) / (s - 1) + Math.pow(N, -s) / 2 + s * Math.pow(N, -s - 1) / 12;
    zetaCache[s] = sum;
    return sum;
  }
  function riemannR(x) {
    const L = Math.log(x);
    let sum = 1, term = 1; // term = L^k / k!
    for (let k = 1; k < 200; k++) {
      term *= L / k;
      const add = term / (k * zetaReal(k + 1));
      sum += add;
      if (Math.abs(add) < 1e-12 * Math.abs(sum)) break;
    }
    return sum;
  }

  // −2·Re li(x^ρ) for ρ = ½ + iγ, with li(x^ρ) = Ei(ρ ln x) from its asymptotic
  // series e^z/z·Σ k!/z^k (|z| ≥ 14·ln 2, so a few terms suffice).
  function zeroWave(gamma, L, sqrtX) {
    const zr = 0.5 * L, zi = gamma * L;
    const zz = zr * zr + zi * zi;
    const ir = zr / zz, ii = -zi / zz; // 1/z
    let sr = 1, si = 0, tr = 1, ti = 0;
    for (let k = 1; k < 30; k++) {
      // term *= k / z
      const nr = (tr * ir - ti * ii) * k, ni = (tr * ii + ti * ir) * k;
      if (nr * nr + ni * ni > tr * tr + ti * ti) break; // series started diverging
      tr = nr; ti = ni;
      sr += tr; si += ti;
      if (tr * tr + ti * ti < 1e-20) break;
    }
    // e^z / z = sqrtX·(cos zi + i sin zi) · (ir + i ii)
    const er = sqrtX * Math.cos(zi), ei = sqrtX * Math.sin(zi);
    const qr = er * ir - ei * ii, qi = er * ii + ei * ir;
    return -2 * (qr * sr - qi * si);
  }

  function niceStep(raw) { // 1, 2 or 5 × a power of ten
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / mag;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * mag;
  }

  const mode = {
    label: "Riemann's Staircase",
    controls: [
      { type: "select", id: "rs-xmax", label: "x up to", default: "100",
        options: [
          { value: "50", label: "50" },
          { value: "100", label: "100" },
          { value: "200", label: "200" },
          { value: "500", label: "500" },
          { value: "1000", label: "1,000" }
        ]
      },
      { type: "range", id: "rs-zeros", label: "Zeros", min: 0, max: ZERO_COUNT, step: 1, default: 100 }
    ],
    _zeros: null,
    _xMax: 100,
    _target: 100,
    _used: 0,
    _xs: null, _base: null, _sum: null, _L: null, _sqrtX: null,
    _primes: [],
    _w: 0,

    init(ctx, canvas, primes) {
      this._zeros = computeZeros(ZERO_COUNT);
      this._xMax = 100;
      this._target = 100;
      this._xs = null;
      this._primeSrc = primes;
    },
    onControl(id, value) {
      if (id === "rs-xmax") { this._xMax = Number(value); this._xs = null; }
      if (id === "rs-zeros") this._target = value;
    },
    update(primes, currentIndex) {
      this._primeSrc = primes;
    },

    _rebuild(plotW) {
      const n = Math.max(2, Math.floor(plotW * SAMPLES_PER_PX));
      const xs = new Float64Array(n), base = new Float64Array(n), sum = new Float64Array(n);
      const L = new Float64Array(n), sq = new Float64Array(n);
      const x0 = 2;
      for (let i = 0; i < n; i++) {
        const x = x0 + (this._xMax - x0) * i / (n - 1);
        xs[i] = x; L[i] = Math.log(x); sq[i] = Math.sqrt(x);
        base[i] = riemannR(x) - 1 / L[i] + Math.atan(Math.PI / L[i]) / Math.PI;
      }
      this._xs = xs; this._base = base; this._sum = sum; this._L = L; this._sqrtX = sq;
      this._used = 0;
      this._acc = 0;
      this._w = plotW;
      // True primes up to xMax, from the engine's sieve
      const src = this._primeSrc;
      const ps = [];
      for (let i = 0; i < src.length && src[i] <= this._xMax; i++) ps.push(src[i]);
      this._primes = ps;
    },
    _applyZero(k, sign) {
      const g = this._zeros[k], sum = this._sum, L = this._L, sq = this._sqrtX;
      for (let i = 0; i < sum.length; i++) sum[i] += sign * zeroWave(g, L[i], sq[i]);
    },
    _stepTowardTarget() {
      // Slow at first so each early wave is visible, then accelerating:
      // ~10 zeros in 0.6 s, 100 in 2 s, 1000 in 3.5 s at 60 fps.
      this._acc += 0.15 + this._used / 40;
      const step = Math.floor(this._acc);
      this._acc -= step;
      if (this._used < this._target) {
        const end = Math.min(this._target, this._used + step);
        while (this._used < end) this._applyZero(this._used++, 1);
      } else if (this._used > this._target) {
        const end = Math.max(this._target, this._used - Math.max(step, 5));
        while (this._used > end) this._applyZero(--this._used, -1);
      }
    },

    draw(ctx, w, h) {
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, w, h);
      if (!this._zeros || !this._primeSrc) return;

      const pad = { l: 56, r: 20, t: 34, b: 70 };
      const plotW = w - pad.l - pad.r;
      const plotH = h - pad.t - pad.b;
      if (plotW < 50 || plotH < 50) return;
      if (!this._xs || this._w !== plotW) this._rebuild(plotW);
      this._stepTowardTarget();

      const xMax = this._xMax, x0 = 2;
      const yMax = this._primes.length * 1.12 + 1;
      const px = (x) => pad.l + (x - x0) / (xMax - x0) * plotW;
      const py = (y) => pad.t + plotH * (1 - y / yMax);

      // Grid + axes labels
      ctx.strokeStyle = "#1a1a33";
      ctx.lineWidth = 1;
      ctx.fillStyle = "#555";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      const yStep = niceStep(yMax / 5);
      for (let v = 0; v <= yMax; v += yStep) {
        const y = py(v);
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + plotW, y); ctx.stroke();
        ctx.fillText(String(v), pad.l - 6, y + 3);
      }
      ctx.textAlign = "center";
      const xStep = niceStep(xMax / 5);
      for (let v = xStep; v <= xMax; v += xStep) {
        ctx.fillText(v.toLocaleString(), px(v), pad.t + plotH + 14);
      }

      // Prime ticks along the x axis
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath();
      for (const p of this._primes) {
        const x = px(p);
        ctx.moveTo(x, pad.t + plotH); ctx.lineTo(x, pad.t + plotH - 4);
      }
      ctx.stroke();

      // Smooth R(x) (dashed)
      const xs = this._xs, base = this._base, sum = this._sum;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#4477aa";
      ctx.beginPath();
      for (let i = 0; i < xs.length; i++) {
        const X = px(xs[i]), Y = py(base[i]);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // True staircase π(x)
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px(x0), py(0));
      let count = 0;
      for (const p of this._primes) {
        ctx.lineTo(px(p), py(count));
        count++;
        ctx.lineTo(px(p), py(count));
      }
      ctx.lineTo(px(xMax), py(count));
      ctx.stroke();

      // Reconstruction from zeros
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < xs.length; i++) {
        const X = px(xs[i]), Y = py(base[i] + sum[i]);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke();

      // Zero strip: each used zero γ as a tick on the critical line
      const stripY = h - 26;
      const gMax = this._zeros[ZERO_COUNT - 1];
      ctx.fillStyle = "#555";
      ctx.textAlign = "left";
      ctx.fillText("zeros ½+iγ:", 6, stripY + 3);
      ctx.strokeStyle = "#2a2a44";
      ctx.beginPath(); ctx.moveTo(pad.l + 30, stripY); ctx.lineTo(pad.l + plotW, stripY); ctx.stroke();
      ctx.strokeStyle = "#ffd700";
      ctx.beginPath();
      const stripW = plotW - 30;
      for (let k = 0; k < this._used; k++) {
        const x = pad.l + 30 + this._zeros[k] / gMax * stripW;
        ctx.moveTo(x, stripY - 5); ctx.lineTo(x, stripY + 5);
      }
      ctx.stroke();
      ctx.textAlign = "right";
      ctx.fillText(`γ up to ${gMax.toFixed(1)}`, pad.l + plotW, stripY + 18);

      // Title + legend
      ctx.textAlign = "center";
      ctx.fillStyle = "#888";
      ctx.font = "13px monospace";
      const lastG = this._used > 0 ? `, last γ = ${this._zeros[this._used - 1].toFixed(3)}` : "";
      ctx.fillText(`π(x) rebuilt from ${this._used} zeta zero${this._used === 1 ? "" : "s"}${lastG}`, w / 2, 18);
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      const ly = pad.t + 10;
      ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillText("— true π(x)", pad.l + 8, ly);
      ctx.fillStyle = "#4477aa"; ctx.fillText("- - smooth R(x)", pad.l + 8, ly + 13);
      ctx.fillStyle = "#ffd700"; ctx.fillText("— R(x) + zero waves", pad.l + 8, ly + 26);
    },
    resize(w, h) { this._xs = null; },
    cleanup() { this._xs = null; this._primes = []; }
  };
  window.PRIME_MODES["riemann-staircase"] = mode;
})();
