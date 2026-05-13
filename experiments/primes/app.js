// ─── WASM Engine Import ──────────────────────────────────────
import init, { PrimeEngine } from './pkg/prime_engine.js';

const wasmModule = await init();
const engine = new PrimeEngine();

// ─── Frequency Grid ─────────────────────────────────────────
const GRID_SIZE = 60;
const GRID_CELLS = GRID_SIZE * GRID_SIZE;

// These get refreshed from WASM memory each frame
let freqArr = new Uint32Array(wasmModule.memory.buffer, engine.freq_ptr(), GRID_CELLS);
let discAtArr = new Int32Array(wasmModule.memory.buffer, engine.disc_at_ptr(), GRID_CELLS);
let lastSeenArr = new Int32Array(wasmModule.memory.buffer, engine.last_seen_ptr(), GRID_CELLS);
let discoveryHistory = new Uint32Array(wasmModule.memory.buffer, engine.discovery_history_ptr(), engine.discovery_history_len());
let ghKeys = new Uint32Array(wasmModule.memory.buffer, engine.gh_keys_ptr(), engine.gh_keys_len());
let ghIdxs = new Uint32Array(wasmModule.memory.buffer, engine.gh_idxs_ptr(), engine.gh_idxs_len());
let primes = new Uint32Array(wasmModule.memory.buffer, engine.primes_ptr(), engine.primes_len());

let currentIndex = 0;
let maxFreq = 1;
let uniquePairs = 0;

function refreshViews() {
  const buf = wasmModule.memory.buffer;
  freqArr = new Uint32Array(buf, engine.freq_ptr(), GRID_CELLS);
  discAtArr = new Int32Array(buf, engine.disc_at_ptr(), GRID_CELLS);
  lastSeenArr = new Int32Array(buf, engine.last_seen_ptr(), GRID_CELLS);
  discoveryHistory = new Uint32Array(buf, engine.discovery_history_ptr(), engine.discovery_history_len());
  ghKeys = new Uint32Array(buf, engine.gh_keys_ptr(), engine.gh_keys_len());
  ghIdxs = new Uint32Array(buf, engine.gh_idxs_ptr(), engine.gh_idxs_len());
  primes = new Uint32Array(buf, engine.primes_ptr(), engine.primes_len());
  currentIndex = engine.current_index();
  maxFreq = engine.max_freq();
  uniquePairs = engine.unique_pairs();
}

// Visualization constants
const HIGHLIGHT_WINDOW = 800;
const TRAIL_LENGTH = 60;
const RIPPLE_DURATION = 600;
const CONNECTION_COUNT = 80;
const RATE_WINDOW = 3000;
const FLASH_FRAMES = 10;
const FLASH_COOLDOWN = 24;

// Activity flash: frame-based with refractory cooldown
let actStartFrame = new Int32Array(GRID_CELLS);
actStartFrame.fill(-1000);

// ─── State ───────────────────────────────────────────────────
const PRIMES_PER_FRAME = 200;
let unitHeight = 1;

// ─── DOM refs ────────────────────────────────────────────────
const canvas = document.getElementById("heatmap-canvas");
const ctx = canvas.getContext("2d");
const threeContainer = document.getElementById("three-container");
const btn2d = document.getElementById("btn-2d");
const btn3d = document.getElementById("btn-3d");
const btnReset = document.getElementById("btn-reset");
const infoIndex = document.getElementById("info-index");
const infoPrime = document.getElementById("info-prime");
const infoPairs = document.getElementById("info-pairs");
const infoShown = document.getElementById("info-shown");
const infoDiscRate = document.getElementById("info-disc-rate");
const tooltipEl = document.getElementById("tooltip");
const discoveryLogEl = document.getElementById("discovery-log");
const logEntriesEl = document.getElementById("log-entries");
const btnLog = document.getElementById("btn-log");

let activeView = "2d";

// ─── Mode Registry ──────────────────────────────────────────
let currentMode = "gap-grid";
let currentModeObj = null;
const mainModeSelect = document.getElementById("main-mode");
const gridControlsEl = document.getElementById("grid-controls");
const modeControlsEl = document.getElementById("mode-controls");
const infoGridOnly = document.getElementById("info-grid-only");

function buildModeControls(container, mode) {
  container.innerHTML = "";
  if (!mode.controls || mode.controls.length === 0) return;
  for (const ctrl of mode.controls) {
    const grp = document.createElement("div");
    grp.className = "filter-group";
    const lbl = document.createTextNode(ctrl.label + ": ");
    grp.appendChild(lbl);
    if (ctrl.type === "select") {
      const sel = document.createElement("select");
      sel.id = ctrl.id;
      for (const opt of ctrl.options) {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        if (opt.value === String(ctrl.default)) o.selected = true;
        sel.appendChild(o);
      }
      sel.addEventListener("change", () => {
        if (mode.onControl) mode.onControl(ctrl.id, sel.value);
      });
      grp.appendChild(sel);
    } else if (ctrl.type === "range") {
      const inp = document.createElement("input");
      inp.type = "range";
      inp.id = ctrl.id;
      inp.min = ctrl.min; inp.max = ctrl.max; inp.step = ctrl.step || 1;
      inp.value = ctrl.default;
      inp.style.width = "80px";
      const valSpan = document.createElement("span");
      valSpan.textContent = ctrl.default;
      valSpan.style.marginLeft = "4px";
      inp.addEventListener("input", () => {
        valSpan.textContent = inp.value;
        if (mode.onControl) mode.onControl(ctrl.id, Number(inp.value));
      });
      grp.appendChild(inp);
      grp.appendChild(valSpan);
    }
    container.appendChild(grp);
  }
}

function switchMode(modeId) {
  if (currentModeObj && currentModeObj.cleanup) currentModeObj.cleanup();
  currentModeObj = null;
  currentMode = modeId;

  if (modeId === "gap-grid") {
    gridControlsEl.style.display = "";
    modeControlsEl.innerHTML = "";
    infoGridOnly.style.display = "";
    switchView(activeView);
  } else {
    gridControlsEl.style.display = "none";
    infoGridOnly.style.display = "none";
    canvas.style.display = "block";
    threeContainer.style.display = "none";

    const mode = window.PRIME_MODES[modeId];
    if (mode) {
      currentModeObj = mode;
      buildModeControls(modeControlsEl, mode);
      if (mode.init) mode.init(ctx, canvas, primes);
      if (mode.resize) mode.resize(cachedW, cachedH);
    }
  }
}

mainModeSelect.addEventListener("change", () => switchMode(mainModeSelect.value));

// ─── Replay ─────────────────────────────────────────────────
const btnReplay = document.getElementById("btn-replay");

let replayActive = false;
let replayPos = 0;
const REPLAY_SPEED = 500;

// Replay data (separate JS arrays, independent of WASM)
let rFreqArr = new Uint32Array(GRID_CELLS);
let rDiscAtArr = new Int32Array(GRID_CELLS);
rDiscAtArr.fill(-1);
let rLastSeenArr = new Int32Array(GRID_CELLS);
rLastSeenArr.fill(-1);
let rDiscoveryHistory = [];
let rMaxFreq = 1;
let rUniquePairs = 0;
let rIndex = 0;

// Live state refs (saved during swap)
let liveFreqArr, liveDiscAtArr, liveLastSeenArr, liveDiscoveryHistory, liveMaxFreq, liveUniquePairs, liveCurrentIndex;

function startReplay() {
  replayActive = true;
  replayPos = 0;
  rFreqArr = new Uint32Array(GRID_CELLS);
  rDiscAtArr = new Int32Array(GRID_CELLS);
  rDiscAtArr.fill(-1);
  rLastSeenArr = new Int32Array(GRID_CELLS);
  rLastSeenArr.fill(-1);
  actStartFrame.fill(-1000);
  rDiscoveryHistory = [];
  rMaxFreq = 1;
  rUniquePairs = 0;
  rIndex = 0;
  lastDiscoveryLen = 0;
  for (const rp of ripplePool) { rp.active = false; rp.mesh.visible = false; }
  ripplePoolIdx = 0;
  btnReplay.textContent = "Stop";
  btnReplay.classList.add("active");
}

function stopReplay() {
  replayActive = false;
  lastDiscoveryLen = discoveryHistory.length;
  btnReplay.textContent = "Replay";
  btnReplay.classList.remove("active");
}

btnReplay.addEventListener("click", () => {
  if (replayActive) stopReplay(); else startReplay();
});

function advanceReplay() {
  // Re-read ghKeys/ghIdxs from WASM (they may have been rebuilt)
  refreshViews();
  const ghLen = engine.gh_keys_len();
  const end = Math.min(replayPos + REPLAY_SPEED, ghLen);
  const buf = wasmModule.memory.buffer;
  const replayGhKeys = new Uint32Array(buf, engine.gh_keys_ptr(), ghLen);
  const replayGhIdxs = new Uint32Array(buf, engine.gh_idxs_ptr(), ghLen);
  for (let i = replayPos; i < end; i++) {
    const key = replayGhKeys[i];
    rIndex = replayGhIdxs[i];
    rLastSeenArr[key] = rIndex;
    if (frameCount - actStartFrame[key] >= FLASH_COOLDOWN) {
      actStartFrame[key] = frameCount;
    }
    const prev = rFreqArr[key];
    if (prev === 0) {
      rUniquePairs++;
      rDiscAtArr[key] = rIndex;
      rDiscoveryHistory.push(key);
    }
    const next = prev + 1;
    rFreqArr[key] = next;
    if (next > rMaxFreq) rMaxFreq = next;
  }
  replayPos = end;
  if (replayPos >= ghLen) stopReplay();
}

function swapToReplay() {
  liveFreqArr = freqArr; liveDiscAtArr = discAtArr; liveLastSeenArr = lastSeenArr;
  liveDiscoveryHistory = discoveryHistory;
  liveMaxFreq = maxFreq; liveUniquePairs = uniquePairs; liveCurrentIndex = currentIndex;
  freqArr = rFreqArr; discAtArr = rDiscAtArr; lastSeenArr = rLastSeenArr;
  discoveryHistory = rDiscoveryHistory;
  maxFreq = rMaxFreq; uniquePairs = rUniquePairs; currentIndex = rIndex;
}

function swapToLive() {
  freqArr = liveFreqArr; discAtArr = liveDiscAtArr; lastSeenArr = liveLastSeenArr;
  discoveryHistory = liveDiscoveryHistory;
  maxFreq = liveMaxFreq; uniquePairs = liveUniquePairs; currentIndex = liveCurrentIndex;
}

// ─── Filtering & Viz Mode ───────────────────────────────────
let filterMin = 1;
let filterMax = Infinity;
const filterMinInput = document.getElementById("filter-min");
const filterMaxInput = document.getElementById("filter-max");

let scaleMode = "log";
const scaleSelect = document.getElementById("scale-mode");
scaleSelect.addEventListener("change", () => { scaleMode = scaleSelect.value; });

const unitHeightInput = document.getElementById("unit-height");
unitHeightInput.addEventListener("input", () => {
  const v = parseFloat(unitHeightInput.value);
  if (v > 0) unitHeight = v;
});

let vizMode = "flash";
const vizSelect = document.getElementById("viz-mode");
vizSelect.addEventListener("change", () => {
  vizMode = vizSelect.value;
  connLine.visible = false;
  for (const rp of ripplePool) rp.mesh.visible = false;
});

filterMinInput.addEventListener("input", () => {
  const v = parseInt(filterMinInput.value, 10);
  filterMin = v >= 1 ? v : 1;
});
filterMaxInput.addEventListener("input", () => {
  const v = parseInt(filterMaxInput.value, 10);
  filterMax = v >= 1 ? v : Infinity;
});

btn2d.addEventListener("click", () => switchView("2d"));
btn3d.addEventListener("click", () => switchView("3d"));

function switchView(view) {
  activeView = view;
  btn2d.classList.toggle("active", view === "2d");
  btn3d.classList.toggle("active", view === "3d");
  canvas.style.display = view === "2d" ? "block" : "none";
  threeContainer.style.display = view === "3d" ? "block" : "none";
  if (view === "3d") onWindowResize();
}

// ─── Discovery Log Panel ─────────────────────────────────────
let discoveryLog = [];
let lastDiscoveryIdx = 0;
const DISCOVERY_LOG_MAX = 200;

function appendLogEntry(key, primeIdx, interval) {
  const x = key % GRID_SIZE;
  const y = (key / GRID_SIZE) | 0;
  const n = discoveryHistory.length;
  const line = document.createElement("div");
  line.textContent = `#${n}: (${x},${y}) at idx ${primeIdx.toLocaleString()} \u2014 gap ${interval.toLocaleString()} since last`;
  logEntriesEl.appendChild(line);
  while (logEntriesEl.children.length > DISCOVERY_LOG_MAX) {
    logEntriesEl.removeChild(logEntriesEl.firstChild);
  }
  discoveryLogEl.scrollTop = discoveryLogEl.scrollHeight;
}

btnLog.addEventListener("click", () => {
  const visible = discoveryLogEl.style.display !== "none" && discoveryLogEl.style.display !== "";
  discoveryLogEl.style.display = visible ? "none" : "block";
  btnLog.classList.toggle("active", !visible);
});

// ─── Tooltip Interaction ─────────────────────────────────────
canvas.addEventListener("mousemove", (e) => {
  if (activeView !== "2d" || currentMode !== "gap-grid") { tooltipEl.style.display = "none"; return; }
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const gx = Math.floor((mx - cachedOx) / cachedCell);
  const gy = Math.floor((my - cachedOy) / cachedCell);
  if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE || cachedCell <= 0) {
    tooltipEl.style.display = "none";
    return;
  }
  const key = gy * GRID_SIZE + gx;
  const freq = freqArr[key];
  if (freq === 0) {
    tooltipEl.style.display = "none";
    return;
  }
  const discAt = discAtArr[key];
  const discNum = discoveryHistory.indexOf(key) + 1;
  const lastSeen = lastSeenArr[key];
  let html = `<b>Cell (${gx}, ${gy})</b><br>`;
  html += `Frequency: ${freq.toLocaleString()}<br>`;
  html += `Discovered at: idx ${discAt >= 0 ? discAt.toLocaleString() : "\u2014"}<br>`;
  html += `Discovery #${discNum > 0 ? discNum : "\u2014"}<br>`;
  html += `Last seen at: idx ${lastSeen >= 0 ? lastSeen.toLocaleString() : "\u2014"}`;
  tooltipEl.innerHTML = html;
  tooltipEl.style.display = "block";
  const container = canvas.parentElement.getBoundingClientRect();
  let tx = e.clientX - container.left + 14;
  let ty = e.clientY - container.top + 14;
  if (tx + 200 > container.width) tx = e.clientX - container.left - 200;
  if (ty + 100 > container.height) ty = e.clientY - container.top - 100;
  tooltipEl.style.left = tx + "px";
  tooltipEl.style.top = ty + "px";
});

canvas.addEventListener("mouseleave", () => {
  tooltipEl.style.display = "none";
});

// ─── LocalStorage Persistence ───────────────────────────────
const STORAGE_KEY = "primeGapViz";

function saveState() {
  // Read live state from WASM views (not replay state)
  const liveFreq = new Uint32Array(wasmModule.memory.buffer, engine.freq_ptr(), GRID_CELLS);
  const liveDisc = new Int32Array(wasmModule.memory.buffer, engine.disc_at_ptr(), GRID_CELLS);
  const dhLen = engine.discovery_history_len();
  const liveDiscHistory = new Uint32Array(wasmModule.memory.buffer, engine.discovery_history_ptr(), dhLen);

  const fEntries = [];
  const dEntries = [];
  for (let i = 0; i < GRID_CELLS; i++) {
    if (liveFreq[i] > 0) fEntries.push([i, liveFreq[i]]);
    if (liveDisc[i] >= 0) dEntries.push([i, liveDisc[i]]);
  }
  const data = {
    v: 2,
    currentIndex: engine.current_index(),
    maxFreq: engine.max_freq(),
    uniquePairs: engine.unique_pairs(),
    freq: fEntries,
    discoveredAt: dEntries,
    discoveryHistory: Array.from(liveDiscHistory),
    primesLen: engine.primes_len(),
    unitHeight
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);

    // Write freq and disc_at directly into WASM memory
    const wFreq = new Uint32Array(wasmModule.memory.buffer, engine.freq_ptr(), GRID_CELLS);
    const wDisc = new Int32Array(wasmModule.memory.buffer, engine.disc_at_ptr(), GRID_CELLS);
    wFreq.fill(0);
    wDisc.fill(-1);

    if (data.v === 2 || data.v === 3) {
      for (const [k, v] of data.freq) wFreq[k] = v;
      for (const [k, v] of data.discoveredAt) wDisc[k] = v;
      engine.import_discovery_history(new Uint32Array(data.discoveryHistory));
    } else {
      // Migrate old string-key format ("x,y" → y*GRID_SIZE+x)
      for (const [k, v] of data.freq) {
        const ci = k.indexOf(",");
        wFreq[(+k.slice(ci + 1)) * GRID_SIZE + (+k.slice(0, ci))] = v;
      }
      for (const [k, v] of data.discoveredAt) {
        const ci = k.indexOf(",");
        wDisc[(+k.slice(ci + 1)) * GRID_SIZE + (+k.slice(0, ci))] = v;
      }
      const dh = [];
      for (const k of data.discoveryHistory) {
        const ci = k.indexOf(",");
        dh.push((+k.slice(ci + 1)) * GRID_SIZE + (+k.slice(0, ci)));
      }
      engine.import_discovery_history(new Uint32Array(dh));
    }

    engine.set_state(data.currentIndex, data.maxFreq, data.uniquePairs);

    // Regenerate primes via WASM sieve (fast — milliseconds)
    const needed = data.currentIndex + PRIMES_PER_FRAME + 10;
    engine.ensure_primes_count(needed);

    // Rebuild gap history for replay (fast in WASM)
    engine.rebuild_gap_history();

    refreshViews();

    if (data.unitHeight != null) unitHeight = data.unitHeight;
    unitHeightInput.value = unitHeight;
    return true;
  } catch (e) { return false; }
}

function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

btnReset.addEventListener("click", () => {
  if (confirm("Clear all saved data and start fresh?")) resetState();
});

// ─── Shared helpers ─────────────────────────────────────────
function scaleCount(count) {
  if (count <= 0) return 0;
  switch (scaleMode) {
    case "linear": return count;
    case "log":    return Math.log(count + 1);
    case "sqrt":   return Math.sqrt(count);
    case "cbrt":   return Math.cbrt(count);
    case "pow4":   return Math.pow(count, 0.25);
    default:       return count;
  }
}

let cachedScaleMax = 0;

function getT(count) {
  if (maxFreq <= 1) return count > 0 ? 1 : 0;
  return scaleCount(count) / cachedScaleMax;
}

function passesFilter(count) {
  return count >= filterMin && count <= filterMax;
}

// ─── Color LUTs (256-entry, precomputed) ────────────────────
function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

const LUT_SIZE = 256;
function buildLUT(fn) {
  const lut = new Uint8Array(LUT_SIZE * 3);
  for (let i = 0; i < LUT_SIZE; i++) {
    const t = i / (LUT_SIZE - 1);
    const [r, g, b] = fn(t);
    lut[i * 3] = r; lut[i * 3 + 1] = g; lut[i * 3 + 2] = b;
  }
  return lut;
}

const freqLUT      = buildLUT(t => hslToRgb(240 - t * 240, 90, 10 + t * 50));
const rippleDimLUT = buildLUT(t => hslToRgb(240 - t * 240, 70, 8 + t * 25));
const connDimLUT   = buildLUT(t => hslToRgb(240 - t * 240, 60, 6 + t * 18));
const discoveryLUT = buildLUT(t => hslToRgb(300 - t * 120, 80, 20 + t * 30));
const rateLUT      = buildLUT(t => hslToRgb(200 - t * 80, 80, 15 + t * 50));

function lutIndex(t) { return Math.min(255, (t * 255 + 0.5) | 0) * 3; }

// ─── 2D: Offscreen ImageData buffer (1px per cell) ─────────
const offCanvas = document.createElement("canvas");
offCanvas.width = GRID_SIZE;
offCanvas.height = GRID_SIZE;
const offCtx = offCanvas.getContext("2d");
const imgData = offCtx.createImageData(GRID_SIZE, GRID_SIZE);
const pixels = imgData.data;

const BG_R = 10, BG_G = 10, BG_B = 26;
const bgBuf = new Uint8Array(GRID_CELLS * 4);
for (let i = 0; i < bgBuf.length; i += 4) {
  bgBuf[i] = BG_R; bgBuf[i + 1] = BG_G; bgBuf[i + 2] = BG_B; bgBuf[i + 3] = 255;
}

function clearPixels() { pixels.set(bgBuf); }

// ─── 2D: Cached layout ─────────────────────────────────────
let cachedW = 0, cachedH = 0, cachedCell = 0, cachedOx = 0, cachedOy = 0, cachedGridPx = 0;

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cachedW = rect.width;
  cachedH = rect.height;
  cachedCell = Math.floor(Math.min(cachedW, cachedH) / GRID_SIZE);
  cachedGridPx = cachedCell * GRID_SIZE;
  cachedOx = Math.floor((cachedW - cachedGridPx) / 2);
  cachedOy = Math.floor((cachedH - cachedGridPx) / 2);
}
resizeCanvas();

function blitToMain() {
  offCtx.putImageData(imgData, 0, 0);
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, cachedW, cachedH);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(offCanvas, cachedOx, cachedOy, cachedGridPx, cachedGridPx);
}

// ─── 2D Drawing ─────────────────────────────────────────────
function drawHeatmap() {
  cachedScaleMax = scaleCount(maxFreq);

  let shownCount = 0;
  switch (vizMode) {
    case "normal":      shownCount = draw2dNormal(); break;
    case "flash":       shownCount = draw2dFlash(); break;
    case "trail":       shownCount = draw2dTrail(); break;
    case "discovery":   shownCount = draw2dDiscovery(); break;
    case "ripples":     shownCount = draw2dRipples(); break;
    case "connections": shownCount = draw2dConnections(); break;
    case "rate":        shownCount = draw2dRate(); break;
    case "activity":    shownCount = draw2dActivity(); break;
  }
  lastShownCount = shownCount;

  ctx.fillStyle = "#555";
  ctx.font = "11px monospace";
  ctx.fillText("gap(n)\u2192", cachedOx + 4, cachedOy + cachedGridPx - 6);
  ctx.save();
  ctx.translate(cachedOx + 12, cachedOy + cachedGridPx - 20);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("gap(n+1)\u2192", 0, 0);
  ctx.restore();
}

function draw2dNormal() {
  clearPixels();
  let n = 0;
  for (let i = 0; i < discoveryHistory.length; i++) {
    const key = discoveryHistory[i];
    const count = freqArr[key];
    if (!passesFilter(count)) continue;
    n++;
    const li = lutIndex(getT(count));
    const pi = key * 4;
    pixels[pi] = freqLUT[li]; pixels[pi + 1] = freqLUT[li + 1]; pixels[pi + 2] = freqLUT[li + 2];
  }
  blitToMain();
  return n;
}

function draw2dFlash() {
  clearPixels();
  let n = 0;
  for (let i = 0; i < discoveryHistory.length; i++) {
    const key = discoveryHistory[i];
    const count = freqArr[key];
    if (!passesFilter(count)) continue;
    n++;
    const li = lutIndex(getT(count));
    let r = freqLUT[li], g = freqLUT[li + 1], b = freqLUT[li + 2];
    const age = currentIndex - discAtArr[key];
    if (age < HIGHLIGHT_WINDOW) {
      const fade = (1 - age / HIGHLIGHT_WINDOW) * 0.85;
      r = r + (180 - r) * fade;
      g = g + (220 - g) * fade;
      b = b + (255 - b) * fade;
    }
    const pi = key * 4;
    pixels[pi] = r; pixels[pi + 1] = g; pixels[pi + 2] = b;
  }
  blitToMain();
  return n;
}

function draw2dTrail() {
  clearPixels();
  const start = Math.max(0, discoveryHistory.length - TRAIL_LENGTH);
  const len = discoveryHistory.length - start;
  let n = 0;
  for (let i = start; i < discoveryHistory.length; i++) {
    const key = discoveryHistory[i];
    const count = freqArr[key];
    if (!passesFilter(count)) continue;
    n++;
    const recency = (i - start + 1) / len;
    const a = 0.3 + 0.7 * recency;
    const r = 80 + 175 * recency;
    const g = 100 + 155 * recency;
    const b = 160 + 95 * recency;
    const pi = key * 4;
    pixels[pi]     = BG_R + (r - BG_R) * a;
    pixels[pi + 1] = BG_G + (g - BG_G) * a;
    pixels[pi + 2] = BG_B + (b - BG_B) * a;
  }
  blitToMain();
  return n;
}

function draw2dDiscovery() {
  clearPixels();
  let n = 0;
  const invIdx = currentIndex > 0 ? 1 / currentIndex : 0;
  for (let i = 0; i < discoveryHistory.length; i++) {
    const key = discoveryHistory[i];
    const count = freqArr[key];
    if (!passesFilter(count)) continue;
    n++;
    const t = discAtArr[key] * invIdx;
    const li = lutIndex(t);
    const pi = key * 4;
    pixels[pi] = discoveryLUT[li]; pixels[pi + 1] = discoveryLUT[li + 1]; pixels[pi + 2] = discoveryLUT[li + 2];
  }
  blitToMain();
  return n;
}

function draw2dRipples() {
  clearPixels();
  let n = 0;
  for (let i = 0; i < discoveryHistory.length; i++) {
    const key = discoveryHistory[i];
    const count = freqArr[key];
    if (!passesFilter(count)) continue;
    n++;
    const li = lutIndex(getT(count));
    const pi = key * 4;
    pixels[pi] = rippleDimLUT[li]; pixels[pi + 1] = rippleDimLUT[li + 1]; pixels[pi + 2] = rippleDimLUT[li + 2];
  }
  blitToMain();
  const c = cachedCell;
  for (let i = discoveryHistory.length - 1; i >= 0; i--) {
    const key = discoveryHistory[i];
    const age = currentIndex - discAtArr[key];
    if (age >= RIPPLE_DURATION) break;
    const gx = key % GRID_SIZE;
    const gy = (key / GRID_SIZE) | 0;
    const progress = age / RIPPLE_DURATION;
    const radius = progress * c * 8;
    const fade = 1 - progress;
    ctx.beginPath();
    ctx.arc(cachedOx + (gx + 0.5) * c, cachedOy + (gy + 0.5) * c, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(180,220,255,${(fade * 0.6).toFixed(3)})`;
    ctx.lineWidth = Math.max(1, 2 * fade);
    ctx.stroke();
  }
  return n;
}

function draw2dConnections() {
  clearPixels();
  let n = 0;
  for (let i = 0; i < discoveryHistory.length; i++) {
    const key = discoveryHistory[i];
    const count = freqArr[key];
    if (!passesFilter(count)) continue;
    n++;
    const li = lutIndex(getT(count));
    const pi = key * 4;
    pixels[pi] = connDimLUT[li]; pixels[pi + 1] = connDimLUT[li + 1]; pixels[pi + 2] = connDimLUT[li + 2];
  }
  blitToMain();
  const c = cachedCell;
  const ox = cachedOx, oy = cachedOy;
  const start = Math.max(0, discoveryHistory.length - CONNECTION_COUNT);
  const len = discoveryHistory.length - start;
  for (let i = start; i < discoveryHistory.length - 1; i++) {
    const k1 = discoveryHistory[i], k2 = discoveryHistory[i + 1];
    const x1 = k1 % GRID_SIZE, y1 = (k1 / GRID_SIZE) | 0;
    const x2 = k2 % GRID_SIZE, y2 = (k2 / GRID_SIZE) | 0;
    const recency = (i - start + 1) / len;
    ctx.beginPath();
    ctx.moveTo(ox + (x1 + 0.5) * c, oy + (y1 + 0.5) * c);
    ctx.lineTo(ox + (x2 + 0.5) * c, oy + (y2 + 0.5) * c);
    ctx.strokeStyle = `rgba(140,180,255,${(0.15 + 0.85 * recency).toFixed(3)})`;
    ctx.lineWidth = 0.5 + 2 * recency;
    ctx.stroke();
  }
  if (len > 0) {
    const nk = discoveryHistory[discoveryHistory.length - 1];
    const nx = nk % GRID_SIZE, ny = (nk / GRID_SIZE) | 0;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(ox + nx * c, oy + ny * c, c, c);
  }
  return n;
}

function draw2dRate() {
  clearPixels();
  let n = 0;
  for (let i = 0; i < discoveryHistory.length; i++) {
    const key = discoveryHistory[i];
    const count = freqArr[key];
    if (!passesFilter(count)) continue;
    n++;
    const pi = key * 4;
    const age = currentIndex - discAtArr[key];
    if (age < RATE_WINDOW) {
      const t = 1 - age / RATE_WINDOW;
      const li = lutIndex(t);
      pixels[pi] = rateLUT[li]; pixels[pi + 1] = rateLUT[li + 1]; pixels[pi + 2] = rateLUT[li + 2];
    } else {
      pixels[pi] = 18; pixels[pi + 1] = 18; pixels[pi + 2] = 40;
    }
  }
  blitToMain();
  return n;
}

function draw2dActivity() {
  clearPixels();
  let n = 0;
  for (let i = 0; i < discoveryHistory.length; i++) {
    const key = discoveryHistory[i];
    const count = freqArr[key];
    if (!passesFilter(count)) continue;
    n++;
    const li = lutIndex(getT(count));
    let r = freqLUT[li], g = freqLUT[li + 1], b = freqLUT[li + 2];
    const elapsed = frameCount - actStartFrame[key];
    if (elapsed >= 0 && elapsed < FLASH_FRAMES) {
      const f = 1 - elapsed / FLASH_FRAMES;
      const ff = f * f;
      r = r + (255 - r) * ff;
      g = g + (240 - g) * ff;
      b = b + (180 - b) * ff;
    }
    const pi = key * 4;
    pixels[pi] = r; pixels[pi + 1] = g; pixels[pi + 2] = b;
  }
  blitToMain();
  return n;
}

// ─── Three.js 3D Heightmap ───────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
camera.position.set(GRID_SIZE * 0.8, GRID_SIZE * 1.2, GRID_SIZE * 1.4);
camera.lookAt(GRID_SIZE / 2, 0, GRID_SIZE / 2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
threeContainer.appendChild(renderer.domElement);

const orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
orbitControls.target.set(GRID_SIZE / 2, 0, GRID_SIZE / 2);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.08;

const ambient = new THREE.AmbientLight(0x404060, 0.6);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(GRID_SIZE, GRID_SIZE * 2, GRID_SIZE);
scene.add(dirLight);

const groundGeo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x111128, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.set(GRID_SIZE / 2, -0.01, GRID_SIZE / 2);
scene.add(ground);

const barGeo = new THREE.BoxGeometry(0.85, 1, 0.85);
const bars = new Map();
const _c = new THREE.Color();

function getBarColor(t) {
  _c.setHSL((240 - t * 240) / 360, 0.85, 0.25 + t * 0.35);
  return _c;
}

const RIPPLE_POOL_SIZE = 30;
const rippleRingGeo = new THREE.RingGeometry(0.4, 0.6, 32);
const ripplePool = [];
for (let i = 0; i < RIPPLE_POOL_SIZE; i++) {
  const mat = new THREE.MeshBasicMaterial({
    color: 0xbbddff, transparent: true, opacity: 0, side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(rippleRingGeo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;
  scene.add(mesh);
  ripplePool.push({ mesh, active: false, born: 0 });
}
let ripplePoolIdx = 0;
let lastDiscoveryLen = 0;

const CONN_MAX = CONNECTION_COUNT;
const connPositions = new Float32Array(CONN_MAX * 3);
const connColors = new Float32Array(CONN_MAX * 3);
const connGeo = new THREE.BufferGeometry();
connGeo.setAttribute("position", new THREE.BufferAttribute(connPositions, 3));
connGeo.setAttribute("color", new THREE.BufferAttribute(connColors, 3));
const connMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8 });
const connLine = new THREE.Line(connGeo, connMat);
connLine.visible = false;
scene.add(connLine);

function ensureBar(key) {
  let bar = bars.get(key);
  if (!bar) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x222244 });
    bar = new THREE.Mesh(barGeo, mat);
    const gx = key % GRID_SIZE;
    const gy = (key / GRID_SIZE) | 0;
    bar.position.x = gx + 0.5;
    bar.position.z = gy + 0.5;
    scene.add(bar);
    bars.set(key, bar);
  }
  return bar;
}

function updateBars() {
  cachedScaleMax = scaleCount(maxFreq);
  let shownCount = 0;

  for (const bar of bars.values()) bar.visible = false;

  let trailMap = null;
  let trailStart = 0;
  if (vizMode === "trail") {
    trailStart = Math.max(0, discoveryHistory.length - TRAIL_LENGTH);
    trailMap = new Map();
    for (let i = trailStart; i < discoveryHistory.length; i++) {
      trailMap.set(discoveryHistory[i], i);
    }
  }

  for (let di = 0; di < discoveryHistory.length; di++) {
    const key = discoveryHistory[di];
    const count = freqArr[key];
    const bar = ensureBar(key);
    const vis = passesFilter(count);
    bar.visible = vis;
    if (!vis) continue;
    shownCount++;

    const t = getT(count);
    const height = Math.max(0.01, scaleCount(count) * unitHeight * 0.85);
    bar.scale.y = height;
    bar.position.y = height / 2;
    bar.material.emissive.setRGB(0, 0, 0);

    switch (vizMode) {
      case "normal":
        bar.material.color.copy(getBarColor(t));
        break;

      case "flash": {
        bar.material.color.copy(getBarColor(t));
        const age = currentIndex - discAtArr[key];
        if (age < HIGHLIGHT_WINDOW) {
          const fade = 1 - age / HIGHLIGHT_WINDOW;
          bar.material.emissive.setRGB(0.7 * fade, 0.85 * fade, fade);
        }
        break;
      }

      case "trail": {
        const idx = trailMap.get(key);
        if (idx !== undefined) {
          const recency = (idx - trailStart + 1) / TRAIL_LENGTH;
          bar.material.color.setRGB(0.3 + 0.7 * recency, 0.4 + 0.6 * recency, 0.6 + 0.4 * recency);
          bar.material.emissive.setRGB(0.1 * recency, 0.15 * recency, 0.2 * recency);
        } else {
          bar.visible = false;
          shownCount--;
        }
        break;
      }

      case "discovery": {
        const born = discAtArr[key];
        const dt = currentIndex > 0 ? born / currentIndex : 0;
        _c.setHSL((300 - dt * 120) / 360, 0.8, 0.25 + dt * 0.25);
        bar.material.color.copy(_c);
        break;
      }

      case "ripples":
        bar.material.color.copy(getBarColor(t * 0.5));
        break;

      case "connections":
        bar.material.color.copy(getBarColor(t * 0.4));
        break;

      case "rate": {
        const age = currentIndex - discAtArr[key];
        if (age < RATE_WINDOW) {
          const recency = 1 - age / RATE_WINDOW;
          _c.setHSL((200 - recency * 80) / 360, 0.8, 0.2 + recency * 0.4);
          bar.material.color.copy(_c);
          bar.material.emissive.setRGB(0.1 * recency, 0.15 * recency, 0.25 * recency);
        } else {
          bar.material.color.setRGB(0.07, 0.07, 0.16);
        }
        break;
      }

      case "activity": {
        bar.material.color.copy(getBarColor(t));
        const elapsed = frameCount - actStartFrame[key];
        if (elapsed >= 0 && elapsed < FLASH_FRAMES) {
          const f = 1 - elapsed / FLASH_FRAMES;
          const ff = f * f;
          bar.material.emissive.setRGB(0.9 * ff, 0.85 * ff, 0.5 * ff);
        }
        break;
      }
    }
  }

  // 3D ripple rings
  if (vizMode === "ripples") {
    while (lastDiscoveryLen < discoveryHistory.length) {
      const key = discoveryHistory[lastDiscoveryLen];
      const gx = key % GRID_SIZE;
      const gy = (key / GRID_SIZE) | 0;
      const rp = ripplePool[ripplePoolIdx % RIPPLE_POOL_SIZE];
      rp.active = true;
      rp.born = currentIndex;
      rp.mesh.position.set(gx + 0.5, 0.05, gy + 0.5);
      rp.mesh.scale.set(1, 1, 1);
      rp.mesh.material.opacity = 0.7;
      rp.mesh.visible = true;
      ripplePoolIdx++;
      lastDiscoveryLen++;
    }
    for (const rp of ripplePool) {
      if (!rp.active) continue;
      const age = currentIndex - rp.born;
      if (age >= RIPPLE_DURATION) {
        rp.active = false;
        rp.mesh.visible = false;
        continue;
      }
      const progress = age / RIPPLE_DURATION;
      const scale = 1 + progress * 16;
      rp.mesh.scale.set(scale, scale, scale);
      rp.mesh.material.opacity = 0.7 * (1 - progress);
    }
  } else {
    lastDiscoveryLen = discoveryHistory.length;
    for (const rp of ripplePool) {
      rp.active = false;
      rp.mesh.visible = false;
    }
  }

  // 3D connection line
  if (vizMode === "connections") {
    connLine.visible = true;
    const start = Math.max(0, discoveryHistory.length - CONN_MAX);
    const len = discoveryHistory.length - start;
    for (let i = 0; i < CONN_MAX; i++) {
      if (i < len) {
        const key = discoveryHistory[start + i];
        const gx = key % GRID_SIZE;
        const gy = (key / GRID_SIZE) | 0;
        const bar = bars.get(key);
        const py = bar ? bar.position.y * 2 : 0.5;
        connPositions[i * 3] = gx + 0.5;
        connPositions[i * 3 + 1] = py;
        connPositions[i * 3 + 2] = gy + 0.5;
        const recency = (i + 1) / len;
        connColors[i * 3] = 0.4 * recency;
        connColors[i * 3 + 1] = 0.6 * recency;
        connColors[i * 3 + 2] = 0.9 * recency;
      } else {
        connPositions[i * 3] = 0;
        connPositions[i * 3 + 1] = -10;
        connPositions[i * 3 + 2] = 0;
      }
    }
    connGeo.setDrawRange(0, len);
    connGeo.attributes.position.needsUpdate = true;
    connGeo.attributes.color.needsUpdate = true;
  } else {
    connLine.visible = false;
  }

  lastShownCount = shownCount;
}

function onWindowResize() {
  const rect = threeContainer.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(rect.width, rect.height);
}

window.addEventListener("resize", () => {
  resizeCanvas();
  onWindowResize();
  if (currentModeObj && currentModeObj.resize) currentModeObj.resize(cachedW, cachedH);
});

// ─── Startup ────────────────────────────────────────────────
const hadSave = loadState();
if (!hadSave) refreshViews();
onWindowResize();
setInterval(saveState, 5000);

// ─── Main Loop ───────────────────────────────────────────────
let frameCount = 0;
let lastShownCount = 0;

function loop() {
  const wasReplaying = replayActive;

  if (wasReplaying) {
    advanceReplay();
    swapToReplay();
  } else {
    // Generate gaps via WASM engine
    engine.tick(PRIMES_PER_FRAME);
    refreshViews();

    // Bridge activity flash from WASM events
    const updLen = engine.updated_keys_len();
    if (updLen > 0) {
      const buf = wasmModule.memory.buffer;
      const updKeys = new Uint32Array(buf, engine.updated_keys_ptr(), updLen);
      for (let i = 0; i < updLen; i++) {
        const key = updKeys[i];
        if (frameCount - actStartFrame[key] >= FLASH_COOLDOWN) {
          actStartFrame[key] = frameCount;
        }
      }
    }

    // Bridge discovery log from WASM events
    const newDiscLen = engine.new_disc_len();
    if (newDiscLen > 0) {
      const buf = wasmModule.memory.buffer;
      const ndKeys = new Uint32Array(buf, engine.new_disc_keys_ptr(), newDiscLen);
      const ndIdxs = new Uint32Array(buf, engine.new_disc_idxs_ptr(), newDiscLen);
      const ndIntervals = new Uint32Array(buf, engine.new_disc_intervals_ptr(), newDiscLen);
      for (let i = 0; i < newDiscLen; i++) {
        const key = ndKeys[i];
        const primeIdx = ndIdxs[i];
        const interval = ndIntervals[i];
        discoveryLog.push({ key, primeIdx, interval });
        if (discoveryLog.length > DISCOVERY_LOG_MAX) discoveryLog.shift();
        lastDiscoveryIdx = primeIdx;
        appendLogEntry(key, primeIdx, interval);
      }
    }
  }

  // Update info every 5 frames
  frameCount++;
  if (frameCount % 5 === 0) {
    infoIndex.textContent = currentIndex.toLocaleString();
    infoPrime.textContent = (currentIndex < primes.length ? primes[currentIndex].toLocaleString() : "...");
    infoPairs.textContent = uniquePairs.toLocaleString();
    infoShown.textContent = lastShownCount.toLocaleString();
    if (discoveryLog.length >= 2) {
      const last10 = discoveryLog.slice(-10);
      let sum = 0;
      for (const entry of last10) sum += entry.interval;
      const avg = Math.round(sum / last10.length);
      infoDiscRate.textContent = "1 per " + avg.toLocaleString();
    } else {
      infoDiscRate.textContent = "\u2014";
    }
  }

  if (currentMode === "gap-grid") {
    if (activeView === "2d") {
      drawHeatmap();
    } else {
      updateBars();
      orbitControls.update();
      renderer.render(scene, camera);
    }
  } else if (currentModeObj) {
    currentModeObj.update(primes, currentIndex);
    currentModeObj.draw(ctx, cachedW, cachedH);
  }

  if (wasReplaying) swapToLive();

  requestAnimationFrame(loop);
}

loop();
