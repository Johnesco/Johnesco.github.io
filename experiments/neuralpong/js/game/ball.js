import { GAME } from '../config.js';

export class Ball {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = GAME.WIDTH / 2;
    this.y = GAME.HEIGHT / 2;
    const angle = (Math.random() * 0.5 - 0.25) * Math.PI;
    const dir = Math.random() < 0.5 ? 1 : -1;
    this.vx = Math.cos(angle) * GAME.BALL_SPEED * dir;
    this.vy = Math.sin(angle) * GAME.BALL_SPEED;
    this.speed = GAME.BALL_SPEED;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Top/bottom wall bounce
    if (this.y - GAME.BALL_RADIUS <= 0) {
      this.y = GAME.BALL_RADIUS;
      this.vy = Math.abs(this.vy);
    } else if (this.y + GAME.BALL_RADIUS >= GAME.HEIGHT) {
      this.y = GAME.HEIGHT - GAME.BALL_RADIUS;
      this.vy = -Math.abs(this.vy);
    }
  }

  bounceOffPaddle(paddle) {
    const relativeY = (this.y - paddle.y) / (GAME.PADDLE_HEIGHT / 2);
    const clampedRel = Math.max(-1, Math.min(1, relativeY));
    const bounceAngle = clampedRel * (Math.PI / 4);

    this.speed = Math.min(this.speed + GAME.BALL_SPEED_INCREMENT, GAME.BALL_MAX_SPEED);
    const dir = this.vx > 0 ? -1 : 1;
    this.vx = Math.cos(bounceAngle) * this.speed * dir;
    this.vy = Math.sin(bounceAngle) * this.speed;
  }

  draw(ctx) {
    ctx.fillStyle = GAME.BALL_COLOR;
    ctx.shadowColor = GAME.BALL_COLOR;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.x, this.y, GAME.BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
