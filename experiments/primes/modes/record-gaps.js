// Record Gaps — "how big can prime gaps get?"
//
// A record (maximal) gap is a gap larger than every gap before it. This plots every
// record found in the run against the prime where it starts (log scale), next to:
//   (ln p)²  — Cramér's conjecture: record gaps stay close to this curve
//   ln p     — the average gap near p (prime number theorem)
(function() {
  const CATCH_UP_PER_FRAME = 250000;
  const FLASH_FRAMES = 90;

  // Known maximal prime gaps below 2^32 (OEIS A002386 / A005250), used only to
  // say where the next record is waiting. Each entry: [gap, starting prime].
  const KNOWN_RECORDS = [
    [1, 2], [2, 3], [4, 7], [6, 23], [8, 89], [14, 113], [18, 523], [20, 887],
    [22, 1129], [34, 1327], [36, 9551], [44, 15683], [52, 19609], [72, 31397],
    [86, 155921], [96, 360653], [112, 370261], [114, 492113], [118, 1349533],
    [132, 1357201], [148, 2010733], [154, 4652353], [180, 17051707],
    [210, 20831323], [220, 47326693], [222, 122164747], [234, 189695659],
    [248, 191912783], [250, 387096133], [282, 436273009], [288, 1294268491],
    [292, 1453168141], [320, 2300942549], [336, 3842610773]
  ];

  function fmt(n) { // 1k, 2.5M, 10M, 1B
    const short = (v, u) => (v >= 10 || v % 1 === 0 ? Math.round(v) : v.toFixed(1)) + u;
    if (n >= 1e9) return short(n / 1e9, "B");
    if (n >= 1e6) return short(n / 1e6, "M");
    if (n >= 1e3) return short(n / 1e3, "k");
    return String(Math.round(n));
  }


  const mode = {
    label: "Record Gaps",
    controls: [],
    _records: [],       // {p, gap}
    _maxGap: 0,
    _processedIdx: 0,
    _frontier: 2,       // largest prime processed so far
    _flash: 0,
    _caughtUp: false,

    init(ctx, canvas, primes) {
      this._records = [];
      this._maxGap = 0;
      this._processedIdx = 0;
      this._frontier = 2;
      this._flash = 0;
      this._caughtUp = false;
    },
    update(primes, currentIndex) {
      const end = Math.min(currentIndex, primes.length - 1);
      const limit = Math.min(end, this._processedIdx + CATCH_UP_PER_FRAME);
      let i = this._processedIdx;
      let maxGap = this._maxGap;
      for (; i < limit; i++) {
        const gap = primes[i + 1] - primes[i];
        if (gap > maxGap) {
          maxGap = gap;
          this._records.push({ p: primes[i], gap });
          if (this._caughtUp) this._flash = FLASH_FRAMES; // only celebrate live finds
        }
      }
      this._processedIdx = i;
      this._maxGap = maxGap;
      if (i > 0) this._frontier = primes[i];
      if (i >= end) this._caughtUp = true;
      if (this._flash > 0) this._flash--;
    },
    draw(ctx, w, h) {
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, w, h);
      const recs = this._records;
      if (recs.length === 0) return;

      const listW = w > 700 ? 210 : 0;
      const pad = { l: 50, r: 20 + listW, t: 34, b: 40 };
      const plotW = w - pad.l - pad.r;
      const plotH = h - pad.t - pad.b;
      if (plotW < 60 || plotH < 60) return;

      // x: log10(p) from 1 to one decade past the frontier
      const lx0 = 0;
      const lx1 = Math.max(2, Math.ceil(Math.log10(this._frontier) + 0.3));
      const xMaxP = Math.pow(10, lx1);
      const lnMax = Math.log(xMaxP);
      const yMax = Math.max(this._maxGap * 1.15, Math.min(lnMax * lnMax, this._maxGap * 2.2), 10);
      const px = (p) => pad.l + (Math.log10(p) - lx0) / (lx1 - lx0) * plotW;
      const py = (g) => pad.t + plotH * (1 - g / yMax);

      // Grid: decades on x, round gap sizes on y
      ctx.strokeStyle = "#1a1a33";
      ctx.lineWidth = 1;
      ctx.fillStyle = "#555";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      for (let d = lx0; d <= lx1; d++) {
        const x = px(Math.pow(10, d));
        ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t + plotH); ctx.stroke();
        ctx.fillText(fmt(Math.pow(10, d)), x, pad.t + plotH + 14);
      }
      ctx.fillText("starting prime p (log scale)", pad.l + plotW / 2, pad.t + plotH + 30);
      const yStep = yMax > 200 ? 50 : yMax > 80 ? 20 : 10;
      ctx.textAlign = "right";
      for (let g = 0; g <= yMax; g += yStep) {
        const y = py(g);
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + plotW, y); ctx.stroke();
        ctx.fillText(String(g), pad.l - 6, y + 3);
      }
      ctx.save();
      ctx.translate(14, pad.t + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("gap size", 0, 0);
      ctx.restore();

      // Clip curves to the plot
      ctx.save();
      ctx.beginPath(); ctx.rect(pad.l, pad.t, plotW, plotH); ctx.clip();

      // Reference curves
      const curve = (f, color, dash) => {
        ctx.strokeStyle = color;
        ctx.setLineDash(dash);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i <= 200; i++) {
          const p = Math.pow(10, lx0 + (lx1 - lx0) * i / 200);
          if (p < 2) continue;
          const x = px(p), y = py(f(Math.log(p)));
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      };
      curve(L => L * L, "rgba(255,120,90,0.7)", [6, 4]);
      curve(L => L, "rgba(90,160,255,0.6)", [2, 4]);

      // Unexplored region past the frontier
      const fx = px(this._frontier);
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      ctx.fillRect(fx, pad.t, pad.l + plotW - fx, plotH);

      // Record staircase: each record holds until the next one
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < recs.length; i++) {
        const x = px(recs[i].p), y = py(recs[i].gap);
        const nextX = i + 1 < recs.length ? px(recs[i + 1].p) : fx;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        ctx.lineTo(nextX, y);
      }
      ctx.stroke();

      // Record dots
      ctx.fillStyle = "#ffd700";
      for (const r of recs) {
        ctx.beginPath();
        ctx.arc(px(r.p), py(r.gap), 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Next known record, waiting ahead
      const next = KNOWN_RECORDS.find(([g]) => g > this._maxGap);
      if (next) {
        const nx = px(next[1]), ny = py(next[0]);
        ctx.strokeStyle = "rgba(255,215,0,0.5)";
        ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.arc(nx, ny, 5, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();

      // Frontier marker
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath(); ctx.moveTo(fx, pad.t); ctx.lineTo(fx, pad.t + plotH); ctx.stroke();
      ctx.fillStyle = "#aaa";
      ctx.textAlign = fx > pad.l + plotW - 60 ? "right" : "left";
      ctx.fillText(`now: ${this._frontier.toLocaleString()}`, fx + (ctx.textAlign === "left" ? 4 : -4), pad.t + 10);

      // New-record flash
      const last = recs[recs.length - 1];
      if (this._flash > 0) {
        const a = this._flash / FLASH_FRAMES;
        ctx.strokeStyle = `rgba(255,215,0,${a.toFixed(3)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px(last.p), py(last.gap), 6 + (1 - a) * 30, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Title + legend
      ctx.fillStyle = "#888";
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      const title = this._flash > 0
        ? `New record gap: ${last.gap} after ${last.p.toLocaleString()}`
        : `Record prime gaps: ${recs.length} records, largest ${this._maxGap}`;
      ctx.fillStyle = this._flash > 0 ? "#ffd700" : "#888";
      ctx.fillText(title, pad.l + plotW / 2, 18);
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      const lx = pad.l + 8;
      ctx.fillStyle = "#ffd700"; ctx.fillText("● record gaps", lx, pad.t + 12);
      ctx.fillStyle = "rgba(255,120,90,0.9)"; ctx.fillText("- - (ln p)²  Cramér's conjecture", lx, pad.t + 25);
      ctx.fillStyle = "rgba(90,160,255,0.9)"; ctx.fillText("··· ln p  average gap", lx, pad.t + 38);

      // Side list: latest records + next known
      if (listW) {
        const x0 = w - listW + 4;
        ctx.fillStyle = "#888";
        ctx.font = "11px monospace";
        ctx.fillText("gap   after prime", x0, pad.t + 4);
        const rows = Math.min(recs.length, Math.floor((plotH - 60) / 15));
        for (let i = 0; i < rows; i++) {
          const r = recs[recs.length - 1 - i];
          ctx.fillStyle = i === 0 ? "#ffd700" : "#777";
          ctx.fillText(`${String(r.gap).padStart(3)}   ${r.p.toLocaleString()}`, x0, pad.t + 22 + i * 15);
        }
        if (next) {
          const y = pad.t + 22 + rows * 15 + 14;
          ctx.fillStyle = "#666";
          ctx.fillText("next known record:", x0, y);
          ctx.fillStyle = "rgba(255,215,0,0.6)";
          ctx.fillText(`${String(next[0]).padStart(3)}   ${next[1].toLocaleString()}`, x0, y + 15);
        }
      }

      if (!this._caughtUp) {
        ctx.fillStyle = "#555";
        ctx.textAlign = "center";
        ctx.fillText(`scanning ${this._processedIdx.toLocaleString()} gaps…`, w / 2, h - 4);
      }
    },
    resize(w, h) {},
    cleanup() { this._records = []; this._processedIdx = 0; }
  };
  window.PRIME_MODES["record-gaps"] = mode;
})();
