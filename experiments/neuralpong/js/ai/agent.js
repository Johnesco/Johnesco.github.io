import { GAME } from '../config.js';

export class NeatAgent {
  constructor(genome) {
    this.genome = genome;
    this.lastInputs = [];
    this.lastOutputs = [];
  }

  // Get action from the neural network
  // side: 'left' or 'right' (determines which paddle is "ours")
  getAction(gameState, side) {
    const isRight = side === 'right';

    const ownPaddleY = isRight ? gameState.rightPaddleY : gameState.leftPaddleY;
    const opponentPaddleY = isRight ? gameState.leftPaddleY : gameState.rightPaddleY;

    // Normalize ball position relative to our side
    const ballX = isRight ? (1 - gameState.ballX) : gameState.ballX;
    const ballVX = isRight ? -gameState.ballVX : gameState.ballVX;

    // Distance to ball (normalized)
    const dx = gameState.ballX - (isRight ?
      (GAME.WIDTH - GAME.PADDLE_MARGIN) / GAME.WIDTH :
      GAME.PADDLE_MARGIN / GAME.WIDTH);
    const dy = gameState.ballY - ownPaddleY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.lastInputs = [
      ballX,
      gameState.ballY,
      ballVX,
      gameState.ballVY,
      ownPaddleY,
      opponentPaddleY,
      dist,
    ];

    this.lastOutputs = this.genome.activate(this.lastInputs);

    // Argmax to select action
    const [up, down, stay] = this.lastOutputs;
    if (up > down && up > stay) return -1;
    if (down > up && down > stay) return 1;
    return 0;
  }
}

// Simple ball-tracking heuristic for the opponent in turbo mode
export function heuristicAction(gameState, side) {
  const isRight = side === 'right';
  const paddleY = isRight ? gameState.rightPaddleY : gameState.leftPaddleY;
  const diff = gameState.ballY - paddleY;
  const threshold = 0.02;

  if (diff > threshold) return 1;
  if (diff < -threshold) return -1;
  return 0;
}
