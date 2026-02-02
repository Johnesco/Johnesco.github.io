import { FITNESS } from '../config.js';

export function calculateFitness(stats) {
  const {
    aiScore = 0,
    opponentScore = 0,
    aiHits = 0,
    ticksSurvived = 0,
    idleTicks = 0,
  } = stats;

  let fitness =
    (aiScore * FITNESS.SCORE_WEIGHT) -
    (opponentScore * FITNESS.OPPONENT_SCORE_PENALTY) +
    (aiHits * FITNESS.HIT_WEIGHT) +
    (ticksSurvived * FITNESS.SURVIVAL_WEIGHT) -
    (idleTicks * FITNESS.IDLE_PENALTY);

  // Keep fitness non-negative for NEAT fitness sharing
  return Math.max(0, fitness);
}
