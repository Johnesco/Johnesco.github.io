import { GAME } from '../config.js';

export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouseY = GAME.HEIGHT / 2;
    this.keys = { up: false, down: false };
    this.mode = 'mouse'; // 'mouse' or 'keyboard'

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleY = GAME.HEIGHT / rect.height;
      this.mouseY = (e.clientY - rect.top) * scaleY;
      this.mode = 'mouse';
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') { this.keys.up = true; this.mode = 'keyboard'; }
      if (e.key === 'ArrowDown' || e.key === 's') { this.keys.down = true; this.mode = 'keyboard'; }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') this.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's') this.keys.down = false;
    });
  }

  // Returns action for left paddle: -1 (up), 0 (stay), 1 (down)
  getAction(paddleY) {
    if (this.mode === 'mouse') {
      const diff = this.mouseY - paddleY;
      if (Math.abs(diff) < GAME.PADDLE_SPEED) return 0;
      return diff > 0 ? 1 : -1;
    }
    // keyboard
    if (this.keys.up && !this.keys.down) return -1;
    if (this.keys.down && !this.keys.up) return 1;
    return 0;
  }
}
