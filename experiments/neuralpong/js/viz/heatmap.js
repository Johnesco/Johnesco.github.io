import { TRAINING } from '../config.js';

export class Heatmap {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(heatmapData) {
    const { canvas, ctx } = this;
    const panel = canvas.parentElement;
    const title = panel.querySelector('.panel-title');
    const titleH = title ? title.offsetHeight + 8 : 0;
    canvas.width = panel.clientWidth - 20;
    canvas.height = panel.clientHeight - 20 - titleH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!heatmapData) return;

    const rows = TRAINING.HEATMAP_ROWS;
    const cols = TRAINING.HEATMAP_COLS;
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    // Find max for normalization
    let maxVal = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (heatmapData[r][c] > maxVal) maxVal = heatmapData[r][c];
      }
    }
    if (maxVal === 0) maxVal = 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = heatmapData[r][c] / maxVal;
        const color = this._heatColor(val);
        ctx.fillStyle = color;
        ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
      }
    }
  }

  _heatColor(t) {
    // cold (dark blue) -> hot (red/yellow)
    if (t <= 0) return '#0a0a1a';

    let r, g, b;
    if (t < 0.25) {
      const s = t / 0.25;
      r = 0;
      g = 0;
      b = Math.floor(40 + s * 180);
    } else if (t < 0.5) {
      const s = (t - 0.25) / 0.25;
      r = 0;
      g = Math.floor(s * 200);
      b = Math.floor(220 - s * 100);
    } else if (t < 0.75) {
      const s = (t - 0.5) / 0.25;
      r = Math.floor(s * 255);
      g = Math.floor(200 + s * 55);
      b = Math.floor(120 - s * 120);
    } else {
      const s = (t - 0.75) / 0.25;
      r = 255;
      g = Math.floor(255 - s * 100);
      b = Math.floor(s * 50);
    }

    return `rgb(${r},${g},${b})`;
  }
}
