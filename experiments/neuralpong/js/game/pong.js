import { GAME } from '../config.js';
import { Ball } from './ball.js';
import { Paddle } from './paddle.js';

export class PongGame {
  constructor() {
    this.ball = new Ball();
    this.leftPaddle = new Paddle(
      GAME.PADDLE_MARGIN + GAME.PADDLE_WIDTH / 2,
      GAME.LEFT_PADDLE_COLOR
    );
    this.rightPaddle = new Paddle(
      GAME.WIDTH - GAME.PADDLE_MARGIN - GAME.PADDLE_WIDTH / 2,
      GAME.RIGHT_PADDLE_COLOR
    );
    this.leftScore = 0;
    this.rightScore = 0;
    this.leftHits = 0;
    this.rightHits = 0;
    this.ticks = 0;
    this.over = false;
    this.lastScorer = null;
  }

  reset() {
    this.ball.reset();
    this.leftPaddle.reset();
    this.rightPaddle.reset();
    this.leftScore = 0;
    this.rightScore = 0;
    this.leftHits = 0;
    this.rightHits = 0;
    this.ticks = 0;
    this.over = false;
    this.lastScorer = null;
  }

  // Pure game logic tick. leftAction/rightAction: -1, 0, or 1
  tick(leftAction, rightAction) {
    if (this.over) return;

    this.ticks++;
    this.leftPaddle.move(leftAction);
    this.rightPaddle.move(rightAction);
    this.ball.update();

    // Left paddle collision
    if (this.ball.vx < 0 && this.leftPaddle.collidesWith(this.ball)) {
      this.ball.x = this.leftPaddle.x + GAME.PADDLE_WIDTH / 2 + GAME.BALL_RADIUS;
      this.ball.bounceOffPaddle(this.leftPaddle);
      this.leftHits++;
    }

    // Right paddle collision
    if (this.ball.vx > 0 && this.rightPaddle.collidesWith(this.ball)) {
      this.ball.x = this.rightPaddle.x - GAME.PADDLE_WIDTH / 2 - GAME.BALL_RADIUS;
      this.ball.bounceOffPaddle(this.rightPaddle);
      this.rightHits++;
    }

    // Scoring
    if (this.ball.x - GAME.BALL_RADIUS <= 0) {
      this.rightScore++;
      this.lastScorer = 'right';
      this._afterScore();
    } else if (this.ball.x + GAME.BALL_RADIUS >= GAME.WIDTH) {
      this.leftScore++;
      this.lastScorer = 'left';
      this._afterScore();
    }
  }

  _afterScore() {
    if (this.leftScore >= GAME.MAX_SCORE || this.rightScore >= GAME.MAX_SCORE) {
      this.over = true;
    } else {
      this.ball.reset();
    }
  }

  getState() {
    return {
      ballX: this.ball.x / GAME.WIDTH,
      ballY: this.ball.y / GAME.HEIGHT,
      ballVX: this.ball.vx / GAME.BALL_MAX_SPEED,
      ballVY: this.ball.vy / GAME.BALL_MAX_SPEED,
      leftPaddleY: this.leftPaddle.y / GAME.HEIGHT,
      rightPaddleY: this.rightPaddle.y / GAME.HEIGHT,
      leftScore: this.leftScore,
      rightScore: this.rightScore,
      leftHits: this.leftHits,
      rightHits: this.rightHits,
      ticks: this.ticks,
      over: this.over,
    };
  }

  draw(ctx) {
    // Background
    ctx.fillStyle = GAME.BG_COLOR;
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // Center line
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = GAME.LINE_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(GAME.WIDTH / 2, 0);
    ctx.lineTo(GAME.WIDTH / 2, GAME.HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Score
    ctx.fillStyle = GAME.TEXT_COLOR;
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.3;
    ctx.fillText(this.leftScore, GAME.WIDTH / 2 - 60, 60);
    ctx.fillText(this.rightScore, GAME.WIDTH / 2 + 60, 60);
    ctx.globalAlpha = 1.0;

    // Entities
    this.leftPaddle.draw(ctx);
    this.rightPaddle.draw(ctx);
    this.ball.draw(ctx);
  }
}
