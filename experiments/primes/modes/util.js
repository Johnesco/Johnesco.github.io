// Shared helpers for the statistics modes (window.PrimeUtil)
(function() {
  const U = {};

  U.CATCH_UP = 250000; // gaps processed per frame while catching up on a long run
  U.BG = "#0a0a1a";

  // 1k, 2.5M, 10M, 1B
  U.fmt = (n) => {
    const short = (v, u) => (v >= 10 || v % 1 === 0 ? Math.round(v) : v.toFixed(1)) + u;
    if (n >= 1e9) return short(n / 1e9, "B");
    if (n >= 1e6) return short(n / 1e6, "M");
    if (n >= 1e3) return short(n / 1e3, "k");
    return String(Math.round(n));
  };

  // 1, 2 or 5 × a power of ten
  U.niceStep = (raw) => {
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / mag;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * mag;
  };

  // Call fn(i) for each gap index not yet processed (at most CATCH_UP per frame).
  // `ahead` = how many primes past i the callback reads (primes[i + ahead] must exist).
  U.scan = (state, primes, currentIndex, fn, ahead = 1) => {
    const end = Math.min(currentIndex, primes.length - 1 - ahead);
    const limit = Math.min(end, state.idx + U.CATCH_UP);
    for (let i = state.idx; i < limit; i++) fn(i);
    state.idx = Math.max(state.idx, limit);
    state.caughtUp = state.idx >= end;
  };

  U.clear = (ctx, w, h) => {
    ctx.fillStyle = U.BG;
    ctx.fillRect(0, 0, w, h);
  };

  U.title = (ctx, text, x, y = 18, color = "#888") => {
    ctx.fillStyle = color;
    ctx.font = "13px monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
  };

  // items: [{ color, text }]
  U.legend = (ctx, x, y, items) => {
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    items.forEach((it, k) => {
      ctx.fillStyle = it.color;
      ctx.fillText(it.text, x, y + k * 13);
    });
  };

  U.scanning = (ctx, w, h, state) => {
    if (state.caughtUp) return;
    ctx.fillStyle = "#555";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`scanning ${state.idx.toLocaleString()} gaps…`, w / 2, h - 4);
  };

  // Plot area from padding; returns null if too small
  U.area = (w, h, pad) => {
    const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    return pw < 60 || ph < 60 ? null : { x: pad.l, y: pad.t, w: pw, h: ph };
  };

  // Horizontal grid + labels for a linear or log y axis. Returns value → pixel y.
  U.yAxis = (ctx, A, lo, hi, opts = {}) => {
    const log = !!opts.log;
    const f = opts.format || ((v) => String(+v.toPrecision(3)));
    const t = (v) => log ? (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)) : (v - lo) / (hi - lo);
    const py = (v) => A.y + A.h * (1 - t(v));
    ctx.strokeStyle = "#1a1a33";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#555";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    const ticks = [];
    if (log) {
      for (let e = Math.ceil(Math.log10(lo)); e <= Math.floor(Math.log10(hi)); e++) ticks.push(Math.pow(10, e));
    } else {
      const step = U.niceStep((hi - lo) / 5);
      for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(+v.toPrecision(12));
    }
    for (const v of ticks) {
      const y = py(v);
      ctx.beginPath(); ctx.moveTo(A.x, y); ctx.lineTo(A.x + A.w, y); ctx.stroke();
      ctx.fillText(f(v), A.x - 6, y + 3);
    }
    if (opts.label) {
      ctx.save();
      ctx.translate(12, A.y + A.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText(opts.label, 0, 0);
      ctx.restore();
    }
    return py;
  };

  // Vertical grid + labels for x = log10(p) from lx0 to lx1 (decade ticks). Returns p → pixel x.
  U.logPrimeAxis = (ctx, A, lx0, lx1, label = "prime p (log scale)") => {
    const px = (p) => A.x + (Math.log10(p) - lx0) / (lx1 - lx0) * A.w;
    ctx.strokeStyle = "#1a1a33";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#555";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    for (let d = Math.ceil(lx0); d <= Math.floor(lx1); d++) {
      const x = px(Math.pow(10, d));
      ctx.beginPath(); ctx.moveTo(x, A.y); ctx.lineTo(x, A.y + A.h); ctx.stroke();
      ctx.fillText(U.fmt(Math.pow(10, d)), x, A.y + A.h + 14);
    }
    ctx.fillText(label, A.x + A.w / 2, A.y + A.h + 30);
    return px;
  };

  // Mouse position over a canvas, in CSS pixels, tracked while a mode is active
  U.trackMouse = (canvas) => {
    const m = { x: -1, y: -1, inside: false };
    const move = (e) => {
      const r = canvas.getBoundingClientRect();
      m.x = e.clientX - r.left; m.y = e.clientY - r.top; m.inside = true;
    };
    const leave = () => { m.inside = false; };
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseleave", leave);
    m.stop = () => {
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseleave", leave);
    };
    return m;
  };

  window.PrimeUtil = U;
})();
