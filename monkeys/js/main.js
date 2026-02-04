import { SPEED_LEVELS, SIMULATION } from './config.js';
import { Simulation } from './simulation.js';
import { Renderer } from './renderer.js';
import { ParticleSystem } from './effects.js';
import { StatsDisplay } from './stats.js';
import { HistoryTracker } from './history.js';

let simulation, renderer, particles, stats, history;
let running = false;
let speedLevel = 0;
let loopTimer = null;

const els = {};

function init() {
  els.targetInput = document.getElementById('target-input');
  els.speedSlider = document.getElementById('speed-slider');
  els.speedLabel = document.getElementById('speed-label');
  els.btnStart = document.getElementById('btn-start');
  els.btnPause = document.getElementById('btn-pause');
  els.btnReset = document.getElementById('btn-reset');
  els.stage = document.getElementById('stage');

  simulation = new Simulation(els.targetInput.value);
  renderer = new Renderer();
  particles = new ParticleSystem(document.getElementById('particle-canvas'));
  stats = new StatsDisplay();
  history = new HistoryTracker();

  renderer.buildTargetDisplay(simulation.target);
  stats.updateProbability(simulation);

  setupControls();
  setMonkeyState('idle');
}

function setupControls() {
  els.btnStart.addEventListener('click', start);
  els.btnPause.addEventListener('click', pause);
  els.btnReset.addEventListener('click', reset);

  els.speedSlider.addEventListener('input', () => {
    speedLevel = parseInt(els.speedSlider.value);
    els.speedLabel.textContent = SPEED_LEVELS[speedLevel].label;
  });

  els.targetInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      reset();
      start();
    }
  });

  els.targetInput.addEventListener('input', () => {
    const raw = els.targetInput.value;
    const filtered = raw.replace(/[^a-zA-Z]/g, '');
    if (filtered !== raw) {
      els.targetInput.value = filtered;
    }
  });
}

function start() {
  if (simulation.completed) return;

  const target = els.targetInput.value.trim();
  if (!target) return;

  if (target.toLowerCase() !== simulation.target) {
    simulation.reset(target);
    history.clear();
    renderer.buildTargetDisplay(simulation.target);
    stats.updateProbability(simulation);
  }

  running = true;
  els.btnStart.disabled = true;
  els.btnPause.disabled = false;
  els.targetInput.disabled = true;
  setMonkeyState('typing');
  loop();
}

function pause() {
  running = false;
  if (loopTimer) {
    clearTimeout(loopTimer);
    loopTimer = null;
  }
  els.btnStart.disabled = false;
  els.btnPause.disabled = true;
  setMonkeyState('idle');
}

function reset() {
  pause();
  const target = els.targetInput.value.trim() || SIMULATION.DEFAULT_TARGET;
  if (!els.targetInput.value.trim()) {
    els.targetInput.value = SIMULATION.DEFAULT_TARGET;
  }
  simulation.reset(target);
  history.clear();
  renderer.buildTargetDisplay(simulation.target);
  renderer.clearAttempt();
  renderer.clearKey();
  renderer.removeCompletion();
  stats.update(simulation);
  stats.updateProbability(simulation);
  renderer.updateBestAttempt([]);
  particles.clear();
  els.targetInput.disabled = false;
  els.btnStart.disabled = false;
}

function fanfare(position, charEl) {
  const progress = position / simulation.target.length;

  if (charEl) {
    particles.emitMatch(charEl, progress);
    const scale = 1.3 + progress * 0.7;
    charEl.animate([
      { transform: `scale(${scale})` },
      { transform: 'scale(1)' }
    ], { duration: 300 + progress * 200, easing: 'ease-out' });
  }

  const happyDuration = Math.round(200 + progress * 600);
  setMonkeyState('happy');
  setTimeout(() => { if (running) setMonkeyState('typing'); }, happyDuration);

  return Math.round(SIMULATION.MILESTONE_DELAY_MIN +
    progress * (SIMULATION.MILESTONE_DELAY_MAX - SIMULATION.MILESTONE_DELAY_MIN));
}

function loop() {
  if (!running) return;

  const speed = SPEED_LEVELS[speedLevel];
  let milestoneHit = false;
  let milestoneDelay = 0;

  if (speed.charsPerFrame === 1) {
    const result = simulation.step();
    if (!result) return;

    renderer.showKeypress(result);
    renderer.updateTarget(simulation.position, simulation.target);

    if (result.matched && !result.completed) {
      renderer.updateAttempt(simulation.target.slice(0, simulation.position));
      const charEl = renderer.getCharElement(simulation.position - 1);
      fanfare(simulation.position, charEl);
    }

    if (result.reset) {
      renderer.clearAttempt();
      if (result.streakLength > 0) {
        history.addAttempt(result);
        renderer.updateBestAttempt(history.getMilestones());
        shakeStage(result.streakLength);
      }
    }

    if (result.completed) {
      handleCompletion();
      return;
    }
  } else {
    const results = simulation.stepN(speed.charsPerFrame);

    renderer.updateTarget(simulation.position, simulation.target);
    renderer.updateAttempt(simulation.target.slice(0, simulation.position));
    renderer.batchUpdateKey(simulation.lastChar, simulation.lastWasMatch);

    if (results.resetEvents.length > 0) {
      history.addAttempts(results.resetEvents);
      renderer.updateBestAttempt(history.getMilestones());
    }

    if (results.milestone) {
      milestoneHit = true;
      renderer.showKeypress({ char: results.milestone.char, matched: true });
      const charEl = renderer.getCharElement(results.milestone.position - 1);
      milestoneDelay = fanfare(results.milestone.position, charEl);
    }

    if (results.newRecord) {
      renderer.showRecordBadge();
    }

    if (results.completed) {
      handleCompletion();
      return;
    }
  }

  stats.update(simulation);

  let frameDelay;
  if (milestoneHit) {
    frameDelay = milestoneDelay;
  } else if (speed.charsPerFrame === 1 && simulation.position > 0) {
    const streakBonus = Math.min(simulation.position * 50, 400);
    frameDelay = speed.frameDelay + streakBonus;
  } else {
    frameDelay = speed.frameDelay;
  }
  loopTimer = setTimeout(() => requestAnimationFrame(loop), frameDelay);
}

function handleCompletion() {
  running = false;
  els.btnStart.disabled = true;
  els.btnPause.disabled = true;
  setMonkeyState('celebrate');
  renderer.showCompletion(simulation);
  particles.emitCelebration();
  stats.update(simulation);

  renderer.updateTarget(simulation.position, simulation.target);
  renderer.triggerWave();
}

function shakeStage(streakLength) {
  els.stage.classList.remove('shake-light', 'shake-medium');
  void els.stage.offsetWidth;
  if (streakLength >= 3) {
    els.stage.classList.add('shake-medium');
  } else if (streakLength >= 1) {
    els.stage.classList.add('shake-light');
  }
  setTimeout(() => {
    els.stage.classList.remove('shake-light', 'shake-medium');
  }, 350);
}

function setMonkeyState(state) {
  const monkey = document.getElementById('monkey');
  monkey.classList.remove('idle', 'typing', 'happy', 'celebrate');
  monkey.classList.add(state);
}

init();
