export class FitnessChart {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(history) {
    const { canvas, ctx } = this;
    const panel = canvas.parentElement;
    const title = panel.querySelector('.panel-title');
    const titleH = title ? title.offsetHeight + 8 : 0;
    canvas.width = panel.clientWidth - 20;
    canvas.height = panel.clientHeight - 20 - titleH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { best = [], avg = [] } = history;
    if (best.length === 0) {
      ctx.fillStyle = '#444';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', canvas.width / 2, canvas.height / 2);
      return;
    }

    const padding = { top: 10, right: 10, bottom: 20, left: 40 };
    const w = canvas.width - padding.left - padding.right;
    const h = canvas.height - padding.top - padding.bottom;

    // Visible window (last 100 generations)
    const maxVisible = 100;
    const startIdx = Math.max(0, best.length - maxVisible);
    const visibleBest = best.slice(startIdx);
    const visibleAvg = avg.slice(startIdx);

    const maxVal = Math.max(1, ...visibleBest, ...visibleAvg);
    const minVal = Math.min(0, ...visibleBest, ...visibleAvg);
    const range = maxVal - minVal || 1;

    const toX = (i) => padding.left + (i / Math.max(visibleBest.length - 1, 1)) * w;
    const toY = (v) => padding.top + h - ((v - minVal) / range) * h;

    // Grid
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (i / 4) * h;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + w, y);
      ctx.stroke();

      const val = maxVal - (i / 4) * range;
      ctx.fillStyle = '#555';
      ctx.font = '8px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(0), padding.left - 4, y + 3);
    }

    // Average line
    this._drawLine(ctx, visibleAvg, toX, toY, 'rgba(100, 100, 255, 0.6)', 1.5);

    // Best line
    this._drawLine(ctx, visibleBest, toX, toY, 'rgba(0, 255, 136, 0.9)', 2);

    // Legend
    ctx.font = '9px monospace';
    ctx.fillStyle = '#00ff88';
    ctx.textAlign = 'left';
    ctx.fillText('Best', padding.left + 4, padding.top + 10);
    ctx.fillStyle = 'rgba(100, 100, 255, 0.9)';
    ctx.fillText('Avg', padding.left + 40, padding.top + 10);

    // Generation label
    ctx.fillStyle = '#555';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Gen ${startIdx}`, padding.left, canvas.height - 4);
    ctx.fillText(`Gen ${best.length - 1}`, canvas.width - padding.right, canvas.height - 4);
  }

  _drawLine(ctx, data, toX, toY, color, width) {
    if (data.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(data[0]));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(toX(i), toY(data[i]));
    }
    ctx.stroke();
  }
}
