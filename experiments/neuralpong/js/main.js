import { GAME, TRAINING } from './config.js';
import { PongGame } from './game/pong.js';
import { InputHandler } from './game/input.js';
import { Population } from './neat/population.js';
import { Genome } from './neat/genome.js';
import { Species } from './neat/species.js';
import { NeatAgent, heuristicAction } from './ai/agent.js';
import { Trainer } from './ai/trainer.js';
import { Dashboard } from './viz/dashboard.js';
import { saveState, loadState, clearState } from './persistence/storage.js';

// --- State ---
let mode = 'human'; // 'human' or 'turbo'
let population;
let trainer;
let dashboard;
let gameCanvas, gameCtx;
let input;
let turboSpeed = TRAINING.TURBO_TICKS_PER_FRAME;
let running = true;

// Human vs AI mode state
let humanGame;
let aiAgent;
let humanGameResetting = false;

// Auto-save timer
let lastSave = 0;

function init() {
  gameCanvas = document.getElementById('game-canvas');
  gameCtx = gameCanvas.getContext('2d');
  input = new InputHandler(gameCanvas);
  dashboard = new Dashboard();

  // Try loading saved state
  const saved = loadState();
  if (saved && saved.population) {
    try {
      population = Population.fromJSON(saved.population);
      console.log(`Loaded: Gen ${population.generation}, best fitness ${population.bestFitnessEver.toFixed(1)}`);
    } catch (e) {
      console.warn('Failed to restore population, starting fresh:', e);
      population = new Population();
      population.initialize();
    }
  } else {
    population = new Population();
    population.initialize();
  }

  trainer = new Trainer(population);

  // Restore heatmap if available
  if (saved && saved.heatmap) {
    for (let r = 0; r < saved.heatmap.length && r < TRAINING.HEATMAP_ROWS; r++) {
      trainer.heatmapData[r] = saved.heatmap[r];
    }
  }

  // Start in human mode with a game
  setupHumanMode();
  setupControls();

  requestAnimationFrame(loop);
}

function setupHumanMode() {
  humanGame = new PongGame();
  humanGameResetting = false;
  const bestGenome = population.getBestGenome();
  aiAgent = bestGenome ? new NeatAgent(bestGenome.clone()) : null;
}

function setupControls() {
  const btnHuman = document.getElementById('btn-human');
  const btnAI = document.getElementById('btn-ai');
  const speedSlider = document.getElementById('speed-slider');
  const speedLabel = document.getElementById('speed-label');
  const btnReset = document.getElementById('btn-reset');

  btnHuman.addEventListener('click', () => {
    mode = 'human';
    btnHuman.classList.add('active');
    btnAI.classList.remove('active');
    setupHumanMode();
  });

  btnAI.addEventListener('click', () => {
    mode = 'turbo';
    btnAI.classList.add('active');
    btnHuman.classList.remove('active');
    if (!trainer.evaluating) {
      trainer.startEvaluation();
    }
  });

  speedSlider.addEventListener('input', () => {
    turboSpeed = parseInt(speedSlider.value, 10);
    speedLabel.textContent = `${turboSpeed}x`;
  });

  btnReset.addEventListener('click', () => {
    if (!confirm('Reset all training progress?')) return;
    clearState();
    Genome.resetIdCounter();
    Species.resetIdCounter();
    population = new Population();
    population.initialize();
    trainer = new Trainer(population);
    setupHumanMode();
    console.log('Training reset');
  });

  // Auto-save on unload
  window.addEventListener('beforeunload', () => {
    saveState(population, trainer.heatmapData);
  });
}

function loop(timestamp) {
  if (!running) return;

  if (mode === 'human') {
    updateHumanMode();
  } else {
    updateTurboMode();
  }

  // Auto-save
  if (timestamp - lastSave > TRAINING.AUTO_SAVE_INTERVAL) {
    saveState(population, trainer.heatmapData);
    lastSave = timestamp;
  }

  requestAnimationFrame(loop);
}

function updateHumanMode() {
  // Player controls left paddle
  const leftAction = input.getAction(humanGame.leftPaddle.y);

  // AI controls right paddle
  let rightAction = 0;
  if (aiAgent) {
    const state = humanGame.getState();
    rightAction = aiAgent.getAction(state, 'right');
  }

  humanGame.tick(leftAction, rightAction);

  // Reset game if over (with delay, guarded against multiple triggers)
  if (humanGame.over && !humanGameResetting) {
    humanGameResetting = true;
    setTimeout(() => {
      humanGame.reset();
      humanGameResetting = false;
      // Refresh AI agent with latest best genome
      const bestGenome = population.getBestGenome();
      if (bestGenome) {
        aiAgent = new NeatAgent(bestGenome.clone());
      }
    }, 1000);
  }

  // Draw game
  humanGame.draw(gameCtx);

  // Draw mode label
  gameCtx.fillStyle = '#444';
  gameCtx.font = '12px monospace';
  gameCtx.textAlign = 'left';
  gameCtx.fillText('HUMAN', 10, GAME.HEIGHT - 10);
  gameCtx.textAlign = 'right';
  gameCtx.fillText('AI', GAME.WIDTH - 10, GAME.HEIGHT - 10);

  // Update dashboard with AI agent data
  const vizData = {
    genome: aiAgent ? aiAgent.genome : null,
    inputs: aiAgent ? aiAgent.lastInputs : [],
    outputs: aiAgent ? aiAgent.lastOutputs : [],
    heatmap: trainer.heatmapData,
  };
  dashboard.update(vizData, population);
  dashboard.updateStats(population, 0);
}

function updateTurboMode() {
  // Ensure evaluation is running
  if (!trainer.evaluating) {
    trainer.startEvaluation();
  }

  // Run multiple ticks per frame
  for (let i = 0; i < turboSpeed; i++) {
    const result = trainer.tickEval();

    if (result.generationDone) {
      // Start next generation evaluation
      trainer.startEvaluation();
    }
  }

  // Draw the current evaluation game
  const vizData = trainer.getVizData();
  if (vizData.game) {
    vizData.game.draw(gameCtx);

    // Draw mode label
    gameCtx.fillStyle = '#444';
    gameCtx.font = '12px monospace';
    gameCtx.textAlign = 'left';
    gameCtx.fillText('HEURISTIC', 10, GAME.HEIGHT - 10);
    gameCtx.textAlign = 'right';
    gameCtx.fillText(`AI (Gen ${population.generation})`, GAME.WIDTH - 10, GAME.HEIGHT - 10);
  }

  // Update dashboard
  dashboard.update(vizData, population);
  dashboard.updateStats(population, vizData.genomeIndex);
}

// --- Start ---
init();
