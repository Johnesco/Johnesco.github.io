// ─── Prime Generation ────────────────────────────────────────
const primes = [2, 3];

// Use known primes as trial divisors (3.7x faster than all-odd-numbers)
function isPrime(num) {
  if (num < 2) return false;
  if (num === 2) return true;
  if (num % 2 === 0) return false;
  for (let i = 1; i < primes.length; i++) {
    const p = primes[i];
    if (p * p > num) return true;
    if (num % p === 0) return false;
  }
  return true;
}

function addPrime() {
  let candidate = primes[primes.length - 1] + (primes.length === 1 ? 1 : 2);
  while (!isPrime(candidate)) candidate += 2;
  primes.push(candidate);
}

// Seed enough primes so index 0 works (need at least 3)
while (primes.length < 100) addPrime();

// ─── Segmented Sieve (for bulk prime catch-up after load) ────
// Orders of magnitude faster than trial division for millions of primes.
// Runs one segment per frame (~1M numbers → ~5-15ms) so the page never blocks.
const SIEVE_SEG_SIZE = 1_000_000;
let sieveActive = false;
let sieveSmallPrimes = null; // primes up to sqrt(limit)
let sieveSegStart = 0;       // start of next segment to sieve
let sieveLimit = 0;          // upper bound on largest prime we need
let sieveNeeded = 0;         // how many primes we need total

function estimateNthPrime(n) {
  if (n < 6) return 13;
  const ln = Math.log(n);
  // Generous overestimate: p(n) < n * (ln(n) + ln(ln(n)) + 2)
  return Math.ceil(n * (ln + Math.log(ln) + 2)) + 1000;
}

function startSieve(primesNeeded) {
  sieveNeeded = primesNeeded;
  sieveLimit = estimateNthPrime(primesNeeded);

  // Extend primes to cover sqrt(limit) using addPrime (trivial — a few hundred primes)
  const sqrtLimit = Math.floor(Math.sqrt(sieveLimit)) + 1;
  while (primes[primes.length - 1] < sqrtLimit) addPrime();

  // Collect small primes for sieving
  sieveSmallPrimes = [];
  for (let i = 0; i < primes.length && primes[i] <= sqrtLimit; i++) {
    sieveSmallPrimes.push(primes[i]);
  }

  // Start sieving from just past our last known prime
  sieveSegStart = primes[primes.length - 1] + 1;
  sieveActive = true;
}

function advanceSieve() {
  if (!sieveActive) return;
  if (primes.length >= sieveNeeded) { sieveActive = false; return; }

  const low = sieveSegStart;
  const high = Math.min(low + SIEVE_SEG_SIZE - 1, sieveLimit);
  const segLen = high - low + 1;
  const seg = new Uint8Array(segLen); // 0 = not marked (prime candidate)

  for (let si = 0; si < sieveSmallPrimes.length; si++) {
    const p = sieveSmallPrimes[si];
    // First multiple of p >= low
    let start = Math.ceil(low / p) * p;
    if (start === p) start += p; // don't mark p itself
    for (let j = start - low; j < segLen; j += p) seg[j] = 1;
  }

  for (let i = 0; i < segLen; i++) {
    if (!seg[i]) primes.push(low + i);
  }

  sieveSegStart = high + 1;
  if (primes.length >= sieveNeeded || sieveSegStart > sieveLimit) {
    sieveActive = false;
  }
}

// Whether primes are ready for the main loop to generate new gaps
function primesReady() {
  return primes.length >= currentIndex + PRIMES_PER_FRAME + 3;
}

// ─── Frequency Grid (flat typed arrays) ─────────────────────
// Key encoding: key = y * GRID_SIZE + x
// Decode: x = key % GRID_SIZE, y = (key / GRID_SIZE) | 0
const GRID_SIZE = 60;
const GRID_CELLS = GRID_SIZE * GRID_SIZE;

let freqArr = new Uint32Array(GRID_CELLS);
let discAtArr = new Int32Array(GRID_CELLS);  // discoveredAt (-1 = unseen)
discAtArr.fill(-1);
let discoveryHistory = [];   // numeric keys in first-seen order
let maxFreq = 1;
let uniquePairs = 0;

// Visualization constants
const HIGHLIGHT_WINDOW = 800;
const TRAIL_LENGTH = 60;
const RIPPLE_DURATION = 600;
const CONNECTION_COUNT = 80;
const RATE_WINDOW = 3000;
const FLASH_FRAMES = 10;     // activity flash duration in frames
const FLASH_COOLDOWN = 24;   // frames before a cell can re-flash

// Activity flash: frame-based with refractory cooldown
let actStartFrame = new Int32Array(GRID_CELLS);
actStartFrame.fill(-1000);

// Gap history for replay — parallel flat arrays (no object alloc)
let ghKeys = [];   // numeric grid keys
let ghIdxs = [];   // prime indices

function recordGap(index) {
  const g1 = primes[index + 1] - primes[index];
  const g2 = primes[index + 2] - primes[index + 1];
  const x = g1 <= 1 ? g1 : g1 / 2;
  const y = g2 <= 1 ? g2 : g2 / 2;
  if (x >= GRID_SIZE || y >= GRID_SIZE) return;
  const key = y * GRID_SIZE + x;
  ghKeys.push(key);
  ghIdxs.push(index);
  lastSeenArr[key] = currentIndex;
  if (frameCount - actStartFrame[key] >= FLASH_COOLDOWN) {
    actStartFrame[key] = frameCount;
  }
  const prev = freqArr[key];
  if (prev === 0) {
    uniquePairs++;
    discAtArr[key] = currentIndex;
    discoveryHistory.push(key);
    const interval = currentIndex - lastDiscoveryIdx;
    discoveryLog.push({ key, primeIdx: currentIndex, interval });
    if (discoveryLog.length > DISCOVERY_LOG_MAX) discoveryLog.shift();
    lastDiscoveryIdx = currentIndex;
    appendLogEntry(key, currentIndex, interval);
  }
  const next = prev + 1;
  freqArr[key] = next;
  if (next > maxFreq) maxFreq = next;
}

// ─── Discovery Log ───────────────────────────────────────────
let lastSeenArr = new Int32Array(GRID_CELLS);
lastSeenArr.fill(-1);
let discoveryLog = [];       // [{key, primeIdx, interval}, ...]
let lastDiscoveryIdx = 0;
const DISCOVERY_LOG_MAX = 200;

// ─── State ───────────────────────────────────────────────────
let currentIndex = 0;
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

// ─── Replay ─────────────────────────────────────────────────
const btnReplay = document.getElementById("btn-replay");

let replayActive = false;
let replayPos = 0;
const REPLAY_SPEED = 500;

// Replay data (separate from live state)
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
  const end = Math.min(replayPos + REPLAY_SPEED, ghKeys.length);
  for (let i = replayPos; i < end; i++) {
    const key = ghKeys[i];
    rIndex = ghIdxs[i];
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
  if (replayPos >= ghKeys.length) stopReplay();
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
function appendLogEntry(key, primeIdx, interval) {
  const x = key % GRID_SIZE;
  const y = (key / GRID_SIZE) | 0;
  const n = discoveryHistory.length;
  const line = document.createElement("div");
  line.textContent = `#${n}: (${x},${y}) at idx ${primeIdx.toLocaleString()} \u2014 gap ${interval.toLocaleString()} since last`;
  logEntriesEl.appendChild(line);
  // Trim old entries
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
  if (activeView !== "2d") { tooltipEl.style.display = "none"; return; }
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
  // Position tooltip near cursor, offset slightly
  const container = canvas.parentElement.getBoundingClientRect();
  let tx = e.clientX - container.left + 14;
  let ty = e.clientY - container.top + 14;
  // Keep tooltip on screen
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
  // Only save non-zero entries to keep JSON small
  const fEntries = [];
  const dEntries = [];
  for (let i = 0; i < GRID_CELLS; i++) {
    if (freqArr[i] > 0) fEntries.push([i, freqArr[i]]);
    if (discAtArr[i] >= 0) dEntries.push([i, discAtArr[i]]);
  }
  const data = {
    v: 2,
    currentIndex,
    maxFreq,
    uniquePairs,
    freq: fEntries,
    discoveredAt: dEntries,
    discoveryHistory,
    primesLen: primes.length,
    unitHeight
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    currentIndex = data.currentIndex;
    maxFreq = data.maxFreq;
    uniquePairs = data.uniquePairs;

    freqArr.fill(0);
    discAtArr.fill(-1);

    if (data.v === 2 || data.v === 3) {
      // Numeric-key format
      for (const [k, v] of data.freq) freqArr[k] = v;
      for (const [k, v] of data.discoveredAt) discAtArr[k] = v;
      // Safe copy without spread (avoids stack overflow on large arrays)
      discoveryHistory = data.discoveryHistory.slice();
    } else {
      // Migrate old string-key format ("x,y" → y*GRID_SIZE+x)
      for (const [k, v] of data.freq) {
        const ci = k.indexOf(",");
        freqArr[( +k.slice(ci + 1)) * GRID_SIZE + (+k.slice(0, ci))] = v;
      }
      for (const [k, v] of data.discoveredAt) {
        const ci = k.indexOf(",");
        discAtArr[(+k.slice(ci + 1)) * GRID_SIZE + (+k.slice(0, ci))] = v;
      }
      discoveryHistory = [];
      for (const k of data.discoveryHistory) {
        const ci = k.indexOf(",");
        discoveryHistory.push((+k.slice(ci + 1)) * GRID_SIZE + (+k.slice(0, ci)));
      }
    }

    // Restore unit height
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

// Cached per-frame to avoid redundant scaleCount(maxFreq)
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
const pixels = imgData.data;   // Uint8ClampedArray, length = GRID_CELLS * 4

// Pre-filled background buffer for fast clear via .set()
const BG_R = 10, BG_G = 10, BG_B = 26;
const bgBuf = new Uint8Array(GRID_CELLS * 4);
for (let i = 0; i < bgBuf.length; i += 4) {
  bgBuf[i] = BG_R; bgBuf[i + 1] = BG_G; bgBuf[i + 2] = BG_B; bgBuf[i + 3] = 255;
}

function clearPixels() { pixels.set(bgBuf); }

// ─── 2D: Cached layout (only recomputed on resize) ─────────
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

// Blit offscreen 60×60 ImageData → main canvas, scaled with nearest-neighbor
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

  // Axis labels (drawn on main canvas after blit)
  ctx.fillStyle = "#555";
  ctx.font = "11px monospace";
  ctx.fillText("gap(n)\u2192", cachedOx + 4, cachedOy + cachedGridPx - 6);
  ctx.save();
  ctx.translate(cachedOx + 12, cachedOy + cachedGridPx - 20);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("gap(n+1)\u2192", 0, 0);
  ctx.restore();
}

// --- Normal: plain frequency heatmap via ImageData ---
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

// --- Flash: merged single pass (no double iteration) ---
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

// --- Trail: last N discoveries ---
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

// --- Discovery order ---
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

// --- Ripples: dimmed heatmap + rings on main canvas ---
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
  // Expanding rings (few, drawn with canvas primitives)
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

// --- Connections: dimmed heatmap + lines on main canvas ---
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
  // Lines (on main canvas)
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

// --- Discovery rate ---
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

// --- Activity: flash every cell on each increment (frame-based pulse) ---
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

// Lighting
const ambient = new THREE.AmbientLight(0x404060, 0.6);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(GRID_SIZE, GRID_SIZE * 2, GRID_SIZE);
scene.add(dirLight);

// Ground plane
const groundGeo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x111128, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.set(GRID_SIZE / 2, -0.01, GRID_SIZE / 2);
scene.add(ground);

// Bar pool (keyed by numeric grid key)
const barGeo = new THREE.BoxGeometry(0.85, 1, 0.85);
const bars = new Map();

// Scratch THREE.Color reused across all bar updates (no per-frame allocation)
const _c = new THREE.Color();

function getBarColor(t) {
  _c.setHSL((240 - t * 240) / 360, 0.85, 0.25 + t * 0.35);
  return _c;
}

// 3D Ripple pool
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

// 3D Connection line
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

// ─── 3D Update ──────────────────────────────────────────────
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

  // Hide all bars first (needed for replay where freq is smaller)
  for (const bar of bars.values()) bar.visible = false;

  // Pre-build trail lookup map (avoids O(n) indexOf per bar)
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

  // 3D connection line (no .slice(), direct indexing)
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
});

// ─── Async Gap History Rebuild ───────────────────────────────
// Rebuilds ghKeys in chunks after sieve completes.
// Only needed for replay — the visualization works from saved freq data.
let rebuildInProgress = false;
let rebuildTarget = 0;
let rebuildPos = 0;
const REBUILD_CHUNK = 50000;

function startGapHistoryRebuild() {
  ghKeys.length = 0;
  ghIdxs.length = 0;
  rebuildTarget = currentIndex;
  rebuildPos = 0;
  rebuildInProgress = true;
}

function advanceGapHistoryRebuild() {
  // Don't advance until sieve is done — we need primes
  if (sieveActive) return;
  const end = Math.min(rebuildPos + REBUILD_CHUNK, rebuildTarget);
  if (end + 2 >= primes.length) return; // not enough primes yet
  for (let i = rebuildPos; i < end; i++) {
    if (i + 2 >= primes.length) break;
    const g1 = primes[i + 1] - primes[i];
    const g2 = primes[i + 2] - primes[i + 1];
    const x = g1 <= 1 ? g1 : g1 / 2;
    const y = g2 <= 1 ? g2 : g2 / 2;
    if (x >= GRID_SIZE || y >= GRID_SIZE) continue;
    ghKeys.push(y * GRID_SIZE + x);
    ghIdxs.push(i);
  }
  rebuildPos = end;
  if (rebuildPos >= rebuildTarget) {
    rebuildInProgress = false;
  }
}

// ─── Startup Sequence ────────────────────────────────────────
const hadSave = loadState();
if (hadSave) {
  // Kick off sieve to regenerate primes in background (chunked, non-blocking)
  const needed = currentIndex + PRIMES_PER_FRAME + 10;
  if (needed > primes.length) {
    startSieve(needed);
  }
  // Gap history rebuild starts after sieve finishes
  startGapHistoryRebuild();
}
onWindowResize();
setInterval(saveState, 5000);

// ─── Main Loop ───────────────────────────────────────────────
let frameCount = 0;
let lastShownCount = 0;

function loop() {
  // Advance sieve (one segment per frame, ~5-15ms each)
  if (sieveActive) {
    advanceSieve();
  }

  // Advance async gap history rebuild (waits for sieve to finish)
  if (rebuildInProgress) {
    advanceGapHistoryRebuild();
  }

  const wasReplaying = replayActive;

  if (wasReplaying) {
    advanceReplay();
    swapToReplay();
  } else if (primesReady()) {
    // Only generate new gaps when primes have caught up
    for (let i = 0; i < PRIMES_PER_FRAME; i++) {
      recordGap(currentIndex);
      currentIndex++;
    }
    // Generate primes for next frame (incremental, uses optimized isPrime)
    while (primes.length < currentIndex + PRIMES_PER_FRAME + 3) addPrime();
  }

  // Update info every 5 frames
  frameCount++;
  if (frameCount % 5 === 0) {
    infoIndex.textContent = currentIndex.toLocaleString();
    infoPrime.textContent = (currentIndex < primes.length ? primes[currentIndex].toLocaleString() : "...");
    infoPairs.textContent = uniquePairs.toLocaleString();
    infoShown.textContent = lastShownCount.toLocaleString();
    // Discovery rate: average of last 10 inter-discovery intervals
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

  if (activeView === "2d") {
    drawHeatmap();
  } else {
    updateBars();
    orbitControls.update();
    renderer.render(scene, camera);
  }

  if (wasReplaying) swapToLive();

  requestAnimationFrame(loop);
}

loop();
