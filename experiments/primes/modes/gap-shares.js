// Gap Shares — which gap is most common, and how that changes along the run.
//
// Each column is a stretch of consecutive primes (log scale); each line is the share
// of gaps in that stretch with a given size. Gaps of 2 and 4 lead at first, then 6
// takes over and holds the lead through every range anyone has checked. 30 is
// predicted to overtake 6 only around 10³⁵ ("jumping champions").
(function() {
  const U = window.PrimeUtil;
  const PER_OCTAVE = 12;
  const FIRST_COL = 64;
  const COLS = 23 * PER_OCTAVE;
  const colEnd = (c) => Math.floor(FIRST_COL * Math.pow(2, c / PER_OCTAVE));
  const TRACK = [2, 4, 6, 8, 10, 12, 18, 30];
  const COLORS = { 2: "#9be7ff", 4: "#7aa7ff", 6: "#ff8c42", 8: "#8a8eaa", 10: "#5aa0ff", 12: "#ff5a7a", 18: "#e070ff", 30: "#ffd700" };
  const SLOT = new Int8Array(64).fill(-1);
  TRACK.forEach((g, k) => { SLOT[g] = k; });

  const mode = {
    label: "Gap Shares",
    controls: [],

    init() {
      this._s = { idx: 1, caughtUp: false };
      this._cnt = new Float64Array(COLS * TRACK.length);
      this._tot = new Float64Array(COLS);
      this._startP = new Float64Array(COLS);
      this._col = 0;
      this._colEnd = colEnd(1);
    },

    update(primes, currentIndex) {
      U.scan(this._s, primes, currentIndex, (i) => {
        let c = this._col;
        while (i >= this._colEnd && c < COLS - 1) { c = ++this._col; this._colEnd = colEnd(c + 1); }
        if (this._tot[c] === 0) this._startP[c] = primes[i];
        const g = primes[i + 1] - primes[i];
        this._tot[c]++;
        if (g < 64 && SLOT[g] >= 0) this._cnt[c * TRACK.length + SLOT[g]]++;
      });
    },

    draw(ctx, w, h) {
      U.clear(ctx, w, h);
      const A = U.area(w, h, { l: 56, r: 130, t: 34, b: 42 });
      const used = this._tot[this._col] > 0 ? this._col + 1 : this._col;
      if (!A || used < 2) { U.scanning(ctx, w, h, this._s); return; }

      let maxShare = 0;
      for (let c = 0; c < used; c++) {
        for (let k = 0; k < TRACK.length; k++) maxShare = Math.max(maxShare, this._cnt[c * TRACK.length + k] / this._tot[c]);
      }
      const py = U.yAxis(ctx, A, 0, Math.min(1, maxShare * 1.1), { label: "share of gaps", format: (v) => Math.round(v * 100) + "%" });
      const px = (c) => A.x + (c + 0.5) / used * A.w;

      // x axis: starting primes of a few columns
      ctx.fillStyle = "#555";
      ctx.textAlign = "center";
      const ticks = Math.min(6, used - 1);
      for (let t = 0; t <= ticks; t++) {
        const c = Math.round(t / ticks * (used - 1));
        ctx.fillText(U.fmt(this._startP[c]), px(c), A.y + A.h + 14);
      }
      ctx.fillText("primes, in order (log scale)", A.x + A.w / 2, A.y + A.h + 30);

      // One line per tracked gap; the latest leader drawn thicker
      const last = used - 1;
      let leader = 0;
      for (let k = 1; k < TRACK.length; k++) if (this._cnt[last * TRACK.length + k] > this._cnt[last * TRACK.length + leader]) leader = k;
      for (let k = 0; k < TRACK.length; k++) {
        ctx.strokeStyle = COLORS[TRACK[k]];
        ctx.lineWidth = k === leader ? 3 : 1.5;
        ctx.beginPath();
        for (let c = 0; c < used; c++) {
          const y = py(this._cnt[c * TRACK.length + k] / this._tot[c]);
          if (c === 0) ctx.moveTo(px(c), y); else ctx.lineTo(px(c), y);
        }
        ctx.stroke();
      }

      // Labels at the right end, pushed apart so they don't overlap
      const labels = TRACK.map((g, k) => {
        const share = this._cnt[last * TRACK.length + k] / this._tot[last];
        return { k, share, y: py(share) + 4 };
      }).sort((p, q) => p.y - q.y);
      for (let i = 1; i < labels.length; i++) labels[i].y = Math.max(labels[i].y, labels[i - 1].y + 13);
      const over = labels[labels.length - 1].y - (A.y + A.h);
      if (over > 0) for (const l of labels) l.y -= over;
      for (let i = labels.length - 2; i >= 0; i--) labels[i].y = Math.min(labels[i].y, labels[i + 1].y - 13);
      ctx.textAlign = "left";
      for (const l of labels) {
        ctx.fillStyle = COLORS[TRACK[l.k]];
        ctx.font = (l.k === leader ? "bold " : "") + "11px monospace";
        ctx.fillText(`gap ${TRACK[l.k]}: ${(l.share * 100).toFixed(1)}%`, A.x + A.w + 8, l.y);
      }

      U.title(ctx, `Gap shares: most common gap now is ${TRACK[leader]}`, A.x + A.w / 2);
      U.scanning(ctx, w, h, this._s);
    },
    resize() {},
    cleanup() { this._cnt = null; }
  };
  window.PRIME_MODES["gap-shares"] = mode;
})();
