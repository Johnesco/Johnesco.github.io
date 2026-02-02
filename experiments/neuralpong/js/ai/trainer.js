import { TRAINING } from '../config.js';
import { PongGame } from '../game/pong.js';
import { NeatAgent, heuristicAction } from './agent.js';
import { calculateFitness } from './fitness.js';

export class Trainer {
  constructor(population) {
    this.population = population;
    this.currentGenomeIndex = 0;
    this.game = new PongGame();
    this.agent = null;
    this.tickCount = 0;
    this.idleTicks = 0;
    this.lastPaddleY = 0;
    this.evaluating = false;
    this.heatmapData = this._createHeatmap();
  }

  _createHeatmap() {
    const data = [];
    for (let r = 0; r < TRAINING.HEATMAP_ROWS; r++) {
      data.push(new Float32Array(TRAINING.HEATMAP_COLS));
    }
    return data;
  }

  resetHeatmap() {
    for (let r = 0; r < TRAINING.HEATMAP_ROWS; r++) {
      this.heatmapData[r].fill(0);
    }
  }

  decayHeatmap() {
    for (let r = 0; r < TRAINING.HEATMAP_ROWS; r++) {
      for (let c = 0; c < TRAINING.HEATMAP_COLS; c++) {
        this.heatmapData[r][c] *= TRAINING.HEATMAP_DECAY;
      }
    }
  }

  recordBallPosition(state) {
    const col = Math.floor(state.ballX * (TRAINING.HEATMAP_COLS - 1));
    const row = Math.floor(state.ballY * (TRAINING.HEATMAP_ROWS - 1));
    if (row >= 0 && row < TRAINING.HEATMAP_ROWS && col >= 0 && col < TRAINING.HEATMAP_COLS) {
      this.heatmapData[row][col] += 1;
    }
  }

  startEvaluation() {
    this.currentGenomeIndex = 0;
    this.evaluating = true;
    this._startGenomeEval();
  }

  _startGenomeEval() {
    if (this.currentGenomeIndex >= this.population.genomes.length) {
      this._finishGeneration();
      return;
    }

    this.game.reset();
    const genome = this.population.genomes[this.currentGenomeIndex];
    this.agent = new NeatAgent(genome);
    this.tickCount = 0;
    this.idleTicks = 0;
    this.lastPaddleY = 0.5;
  }

  // Run one tick of the current genome evaluation
  // Returns: { done: false } during eval, { done: true, generationDone: bool } at end
  tickEval() {
    if (!this.evaluating) return { done: true, generationDone: false };

    const genome = this.population.genomes[this.currentGenomeIndex];
    if (!genome) return { done: true, generationDone: false };

    const state = this.game.getState();

    // AI plays right paddle
    const aiAction = this.agent.getAction(state, 'right');

    // Heuristic plays left paddle
    const leftAction = heuristicAction(state, 'left');

    this.game.tick(leftAction, aiAction);
    this.tickCount++;

    // Track idle (paddle didn't move)
    if (Math.abs(state.rightPaddleY - this.lastPaddleY) < 0.001) {
      this.idleTicks++;
    }
    this.lastPaddleY = state.rightPaddleY;

    // Record heatmap
    this.recordBallPosition(this.game.getState());

    // Check if evaluation is done
    if (this.game.over || this.tickCount >= TRAINING.TICKS_PER_EVAL) {
      const finalState = this.game.getState();
      genome.fitness = calculateFitness({
        aiScore: finalState.rightScore,
        opponentScore: finalState.leftScore,
        aiHits: finalState.rightHits,
        ticksSurvived: this.tickCount,
        idleTicks: this.idleTicks,
      });

      this.currentGenomeIndex++;
      if (this.currentGenomeIndex >= this.population.genomes.length) {
        this._finishGeneration();
        return { done: true, generationDone: true };
      }
      this._startGenomeEval();
      return { done: true, generationDone: false };
    }

    return { done: false, generationDone: false };
  }

  _finishGeneration() {
    this.decayHeatmap();
    this.population.evolve();
    this.evaluating = false;
  }

  // Get current state for visualization
  getVizData() {
    return {
      genome: this.agent ? this.agent.genome : null,
      inputs: this.agent ? this.agent.lastInputs : [],
      outputs: this.agent ? this.agent.lastOutputs : [],
      game: this.game,
      genomeIndex: this.currentGenomeIndex,
      generation: this.population.generation,
      heatmap: this.heatmapData,
    };
  }
}
