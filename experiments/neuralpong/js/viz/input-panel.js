export class InputPanel {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.labels = ['Ball X', 'Ball Y', 'Vel X', 'Vel Y', 'Own Y', 'Opp Y', 'Dist'];
  }

  draw(inputs) {
    const { canvas, ctx } = this;
    const panel = canvas.parentElement;
    const title = panel.querySelector('.panel-title');
    const titleH = title ? title.offsetHeight + 8 : 0;
    canvas.width = panel.clientWidth - 20;
    canvas.height = panel.clientHeight - 20 - titleH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!inputs || inputs.length === 0) return;

    const barHeight = Math.min(16, (canvas.height - 10) / inputs.length - 4);
    const labelWidth = 46;
    const maxBarWidth = canvas.width - labelWidth - 40;
    const startY = 6;

    for (let i = 0; i < inputs.length; i++) {
      const y = startY + i * (barHeight + 4);
      const val = inputs[i];
      const absVal = Math.min(Math.abs(val), 1);

      // Label
      ctx.fillStyle = '#888';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(this.labels[i] || `In ${i}`, labelWidth, y + barHeight * 0.75);

      // Bar background
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(labelWidth + 6, y, maxBarWidth, barHeight);

      // Bar
      const barWidth = absVal * maxBarWidth;
      const hue = val >= 0 ? 140 : 0;
      const lightness = 40 + absVal * 20;
      ctx.fillStyle = `hsl(${hue}, 70%, ${lightness}%)`;
      ctx.fillRect(labelWidth + 6, y, barWidth, barHeight);

      // Value text
      ctx.fillStyle = '#aaa';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(val.toFixed(2), labelWidth + maxBarWidth + 8, y + barHeight * 0.75);
    }
  }
}
