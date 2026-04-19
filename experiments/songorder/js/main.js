import { SIM, PHASE, BOARD, VENUE_SIZES, DEFAULT_VENUE_SIZE } from './config.js';
import { Simulation } from './simulation.js';
import { Renderer } from './renderer.js';
import { Analytics } from './analytics.js';

// DOM refs
const canvas = document.getElementById('sim-canvas');
const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const btnStep = document.getElementById('btn-step');
const btnReset = document.getElementById('btn-reset');
const btnNextNight = document.getElementById('btn-next-night');
const pauseNightsCheck = document.getElementById('pause-nights');
const speedSlider = document.getElementById('speed');
const speedLabel = document.getElementById('speed-label');
const seedInput = document.getElementById('seed');
const venueSizeSlider = document.getElementById('venue-size');
const venueSizeLabel = document.getElementById('venue-size-label');
const queueSidebar = document.querySelector('.queue-sidebar');

// Rule checkboxes
const ruleFirstTimer = document.getElementById('rule-first-timer');
const ruleFairRotation = document.getElementById('rule-fair-rotation');
const ruleMustSing = document.getElementById('rule-must-sing');
const ruleAllowResignup = document.getElementById('rule-allow-resignup');

const statNightWrap = document.getElementById('stat-night-wrap');
const statNight = document.getElementById('stat-night');
const statTime = document.getElementById('stat-time');
const statPhase = document.getElementById('stat-phase');
const statPatrons = document.getElementById('stat-patrons');
const statSeats = document.getElementById('stat-seats');
const statQueue = document.getElementById('stat-queue');
const statSinging = document.getElementById('stat-singing');
const statAvgWait = document.getElementById('stat-avg-wait');
const statUtil = document.getElementById('stat-utilization');

const queueListEl = document.getElementById('queue-list');
const statsDetailEl = document.getElementById('stats-detail');
const fairnessCanvas = document.getElementById('fairness-canvas');
const timelineCanvas = document.getElementById('timeline-canvas');

const PHASE_LABELS = {
  [PHASE.OPEN]: '',
  [PHASE.LAST_CALL]: 'LAST CALL',
  [PHASE.CLOSING]: 'CLOSING',
  [PHASE.ENDED]: 'NIGHT OVER',
};

const PHASE_CLASSES = {
  [PHASE.OPEN]: '',
  [PHASE.LAST_CALL]: 'last-call',
  [PHASE.CLOSING]: 'closing',
  [PHASE.ENDED]: 'ended',
};

// Format ticks as duration (for wait times, not wall clock)
function fmtTime(ticks) {
  const totalSecs = ticks / SIM.TPS;
  if (totalSecs < 60) return `${Math.round(totalSecs)}s`;
  const m = Math.floor(totalSecs / 60);
  const s = Math.floor(totalSecs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// State
let sim = null;
let renderer = null;
let analytics = null;
let speed = 1;
let running = true;
let loopTimer = null;

function readRules() {
  return {
    firstTimerPriority: ruleFirstTimer.checked,
    fairRotation: ruleFairRotation.checked,
    mustSingFirst: ruleMustSing.checked,
    allowResignup: ruleAllowResignup.checked,
  };
}

function init() {
  const seed = parseInt(seedInput.value) || 42;
  const rules = readRules();
  const raw = parseInt(venueSizeSlider.value);
  const venueSize = isNaN(raw) ? DEFAULT_VENUE_SIZE : raw;
  venueSizeLabel.textContent = VENUE_SIZES[venueSize].label;

  sim = new Simulation(seed, rules, venueSize);
  renderer = new Renderer(canvas, sim.grid);
  analytics = new Analytics();
  speed = parseInt(speedSlider.value) || 1;

  // Match sidebar height to canvas
  queueSidebar.style.maxHeight = canvas.height + 'px';

  btnNextNight.classList.add('hidden');
  statNightWrap.classList.add('hidden');
  updateUI();
  renderer.draw(sim);
}

let lastUIUpdate = 0;
let lastDashUpdate = 0;

function loop() {
  if (!running) return;

  for (let i = 0; i < speed; i++) {
    sim.step();
    analytics.update(sim);

    // Check for night end
    if (sim.isNightOver()) {
      handleNightEnd();
      return;
    }
  }

  renderer.draw(sim);

  // Stats bar: update every ~100ms wall-clock (cheap DOM writes)
  const now = performance.now();
  if (now - lastUIUpdate > 100) {
    updateUI();
    lastUIUpdate = now;
  }

  // Dashboard charts: update every ~500ms wall-clock (canvas redraws)
  if (now - lastDashUpdate > 500) {
    updateDashboard();
    lastDashUpdate = now;
  }
}

function handleNightEnd() {
  // Record night boundary for timeline chart
  analytics.markNightEnd(sim.tick, sim.nightNumber);

  // Final render and UI update
  renderer.draw(sim);
  updateUI();
  updateDashboard();

  if (pauseNightsCheck.checked) {
    // Pause and show Next Night button
    running = false;
    stopLoop();
    btnPlay.classList.remove('active');
    btnPause.classList.add('active');
    btnNextNight.classList.remove('hidden');
  } else {
    // Auto-advance
    advanceToNextNight();
  }
}

function advanceToNextNight() {
  sim.advanceNight();
  btnNextNight.classList.add('hidden');
  // Show night counter once we're past night 1
  if (sim.nightNumber > 1) {
    statNightWrap.classList.remove('hidden');
  }
  updateUI();
}

function startLoop() {
  stopLoop();
  loopTimer = setInterval(loop, 16);
}

function stopLoop() {
  if (loopTimer) clearInterval(loopTimer);
  loopTimer = null;
}

function updateUI() {
  if (!sim) return;

  // Wall clock
  statTime.textContent = sim.getWallClock();

  // Phase indicator
  statPhase.textContent = PHASE_LABELS[sim.phase] || '';
  statPhase.className = 'value phase-indicator ' + (PHASE_CLASSES[sim.phase] || '');

  // Night counter
  if (sim.nightNumber > 1) {
    statNight.textContent = sim.nightNumber;
    statNightWrap.classList.remove('hidden');
  }

  statPatrons.textContent = sim.patrons.length;
  statSeats.textContent = `${sim.grid.occupiedChairs()}/${sim.grid.totalChairs()}`;
  statQueue.textContent = sim.queue.size();

  const singer = sim.currentSingerId !== null ? sim.getPatron(sim.currentSingerId) : null;
  statSinging.textContent = singer ? singer.name : '-';

  const waitStats = analytics.getWaitStats(sim);
  if (waitStats.count > 0) {
    statAvgWait.textContent = fmtTime(waitStats.avg);
  } else {
    statAvgWait.textContent = '-';
  }

  const util = sim.getStageUtilization();
  statUtil.textContent = `${(util * 100).toFixed(0)}%`;

  // Queue list — colored dot with position, name, meta
  const entries = sim.queue.getEntries();
  if (entries.length === 0) {
    queueListEl.innerHTML = '<div class="queue-empty">no songs queued</div>';
  } else {
    let html = '';
    const maxShow = BOARD.MAX_DISPLAY;
    entries.slice(0, maxShow).forEach((entry, i) => {
      const name = entry.patronName || '?';
      const songs = entry.songsSung || 0;
      const patron = sim.findPatron(entry.patronId);
      const color = patron ? patron.color : '#666';
      const isTop3 = i < BOARD.VISIBLE_SLOTS;
      const topClass = isTop3 ? ' top-3' : '';
      const metaTag = songs > 0
        ? `<span class="repeat">\u00d7${songs}</span>`
        : `<span class="tag">new</span>`;
      const waitTicks = sim.tick - entry.submittedAtTick;

      html += `<div class="queue-entry${topClass}">` +
        `<span class="dot" style="background:${color}">${i + 1}</span>` +
        `<span class="name">${name}</span>` +
        `<span class="meta">${metaTag} ${fmtTime(waitTicks)}</span>` +
        `</div>`;
    });
    if (entries.length > maxShow) {
      html += `<div class="queue-entry"><span class="dot" style="background:#333">+</span><span class="name">${entries.length - maxShow} more</span><span class="meta"></span></div>`;
    }
    queueListEl.innerHTML = html;
  }
}

function updateDashboard() {
  if (!sim) return;

  analytics.drawFairnessChart(fairnessCanvas, sim);
  analytics.drawTimelineChart(timelineCanvas, sim);

  // Detail stats table
  const waitStats = analytics.getWaitStats(sim);
  const gini = analytics.getGini(sim);
  const dropout = analytics.getDropoutRate(sim);
  const cohorts = analytics.getCohortStats(sim);

  const activeRules = [];
  if (sim.rules.firstTimerPriority) activeRules.push('First-timer priority');
  if (sim.rules.fairRotation) activeRules.push('Fair rotation');
  if (sim.rules.mustSingFirst) activeRules.push('Must sing first');
  if (sim.rules.allowResignup) activeRules.push('Allow re-signup');
  const rulesStr = activeRules.length > 0 ? activeRules.join(', ') : 'FIFO only';

  const venueLabel = VENUE_SIZES[sim.venueSize]?.label || 'Medium';

  let html = '<table>';
  html += '<tr><th>Metric</th><th>Value</th></tr>';
  html += `<tr><td>Venue</td><td class="num">${venueLabel} (${sim.grid.totalChairs()} seats)</td></tr>`;
  html += `<tr><td>Rules</td><td class="num">${rulesStr}</td></tr>`;
  if (sim.nightNumber > 1) {
    html += `<tr><td>Night</td><td class="num">${sim.nightNumber}</td></tr>`;
  }
  html += `<tr><td>Total spawned</td><td class="num">${sim.totalPatronsSpawned}</td></tr>`;
  html += `<tr><td>Departed</td><td class="num">${sim.departed.length}</td></tr>`;
  html += `<tr><td>Songs performed</td><td class="num">${waitStats.count}</td></tr>`;

  if (waitStats.count > 0) {
    html += `<tr><td>Avg wait</td><td class="num">${fmtTime(waitStats.avg)}</td></tr>`;
    html += `<tr><td>Median wait</td><td class="num">${fmtTime(waitStats.median)}</td></tr>`;
  }

  html += `<tr><td>Dropout rate</td><td class="num">${(dropout * 100).toFixed(1)}%</td></tr>`;
  html += `<tr><td>Gini (fairness)</td><td class="num">${gini.toFixed(3)}</td></tr>`;

  if (cohorts.length > 0) {
    html += '<tr><td colspan="2" style="padding-top:8px;color:#6a7280">By arrival quartile</td></tr>';
    for (const c of cohorts) {
      const wait = c.avgWait !== null ? fmtTime(c.avgWait) : '-';
      html += `<tr><td>${c.label} (n=${c.count})</td><td class="num">wait: ${wait}, songs: ${c.avgSongs.toFixed(1)}</td></tr>`;
    }
  }

  html += '</table>';
  statsDetailEl.innerHTML = html;
}

// Controls
btnPlay.addEventListener('click', () => {
  if (!running) {
    running = true;
    btnPlay.classList.add('active');
    btnPause.classList.remove('active');
    startLoop();
  }
});

btnPause.addEventListener('click', () => {
  running = false;
  btnPlay.classList.remove('active');
  btnPause.classList.add('active');
  stopLoop();
});

btnStep.addEventListener('click', () => {
  if (running) {
    running = false;
    btnPlay.classList.remove('active');
    btnPause.classList.add('active');
    stopLoop();
  }
  sim.step();
  analytics.update(sim);
  renderer.draw(sim);
  updateUI();
  updateDashboard();
});

speedSlider.addEventListener('input', () => {
  speed = parseInt(speedSlider.value);
  speedLabel.textContent = `${speed}x`;
});

venueSizeSlider.addEventListener('input', () => {
  venueSizeLabel.textContent = VENUE_SIZES[parseInt(venueSizeSlider.value)].label;
});

venueSizeSlider.addEventListener('change', onRuleChange);

// Changing any rule resets the simulation
function onRuleChange() {
  running = false;
  stopLoop();
  analytics.reset();
  init();
  running = true;
  btnPlay.classList.add('active');
  btnPause.classList.remove('active');
  startLoop();
}

ruleFirstTimer.addEventListener('change', onRuleChange);
ruleFairRotation.addEventListener('change', onRuleChange);
ruleMustSing.addEventListener('change', onRuleChange);
ruleAllowResignup.addEventListener('change', onRuleChange);

btnReset.addEventListener('click', () => {
  running = false;
  stopLoop();
  btnPlay.classList.remove('active');
  btnPause.classList.add('active');
  analytics.reset();
  init();
});

btnNextNight.addEventListener('click', () => {
  advanceToNextNight();
  running = true;
  btnPlay.classList.add('active');
  btnPause.classList.remove('active');
  startLoop();
});

// Init
init();
running = true;
btnPlay.classList.add('active');
startLoop();

// Expose for debugging
window._sim = () => sim;
window._renderer = () => renderer;
