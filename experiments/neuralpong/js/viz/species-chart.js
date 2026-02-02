export class SpeciesChart {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    // Persistent color map for species IDs
    this.colorMap = new Map();
    this.colorIndex = 0;
  }

  _getColor(speciesId) {
    if (!this.colorMap.has(speciesId)) {
      const hue = (this.colorIndex * 47 + 15) % 360;
      this.colorMap.set(speciesId, `hsl(${hue}, 65%, 50%)`);
      this.colorIndex++;
    }
    return this.colorMap.get(speciesId);
  }

  draw(speciesCounts) {
    const { canvas, ctx } = this;
    const panel = canvas.parentElement;
    const title = panel.querySelector('.panel-title');
    const titleH = title ? title.offsetHeight + 8 : 0;
    canvas.width = panel.clientWidth - 20;
    canvas.height = panel.clientHeight - 20 - titleH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!speciesCounts || speciesCounts.length === 0) {
      ctx.fillStyle = '#444';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', canvas.width / 2, canvas.height / 2);
      return;
    }

    const padding = { top: 10, right: 10, bottom: 16, left: 10 };
    const w = canvas.width - padding.left - padding.right;
    const h = canvas.height - padding.top - padding.bottom;

    // Last 100 generations
    const maxVisible = 100;
    const startIdx = Math.max(0, speciesCounts.length - maxVisible);
    const visible = speciesCounts.slice(startIdx);
    const numGens = visible.length;
    if (numGens === 0) return;

    // Collect all species IDs
    const allIds = new Set();
    for (const gen of visible) {
      for (const sp of gen) allIds.add(sp.id);
    }
    const speciesIds = [...allIds];

    // Compute totals for normalization
    const totals = visible.map(gen => gen.reduce((s, sp) => s + sp.count, 0));

    const barWidth = w / numGens;

    // Draw stacked bars
    for (let gi = 0; gi < numGens; gi++) {
      const gen = visible[gi];
      const total = totals[gi] || 1;
      const x = padding.left + gi * barWidth;
      let yOffset = 0;

      for (const sp of gen) {
        const proportion = sp.count / total;
        const barH = proportion * h;
        const color = this._getColor(sp.id);

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(x, padding.top + yOffset, Math.max(barWidth - 0.5, 1), barH);
        yOffset += barH;
      }
    }
    ctx.globalAlpha = 1.0;

    // Generation labels
    ctx.fillStyle = '#555';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Gen ${startIdx}`, padding.left + 20, canvas.height - 2);
    ctx.fillText(
      `Gen ${startIdx + numGens - 1}`,
      canvas.width - padding.right - 20,
      canvas.height - 2
    );
  }
}
