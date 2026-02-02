import { GAME } from '../config.js';

export class Paddle {
  constructor(x, color) {
    this.x = x;
    this.y = GAME.HEIGHT / 2;
    this.width = GAME.PADDLE_WIDTH;
    this.height = GAME.PADDLE_HEIGHT;
    this.color = color;
  }

  reset() {
    this.y = GAME.HEIGHT / 2;
  }

  // action: -1 = up, 0 = stay, 1 = down
  move(action) {
    this.y += action * GAME.PADDLE_SPEED;
    this.y = Math.max(this.height / 2, Math.min(GAME.HEIGHT - this.height / 2, this.y));
  }

  // Check if ball collides with this paddle
  collidesWith(ball) {
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    const r = GAME.BALL_RADIUS;

    return (
      ball.x + r > this.x - halfW &&
      ball.x - r < this.x + halfW &&
      ball.y + r > this.y - halfH &&
      ball.y - r < this.y + halfH
    );
  }

  draw(ctx) {
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.fillRect(this.x - halfW, this.y - halfH, this.width, this.height);
    ctx.shadowBlur = 0;
  }
}
