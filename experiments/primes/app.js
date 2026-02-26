// ─── Prime Generation ────────────────────────────────────────
const primes = [2, 3];

function isPrime(num) {
  if (num < 2) return false;
  if (num === 2) return true;
  if (num % 2 === 0) return false;
  const cap = Math.floor(Math.sqrt(num));
  for (let d = 3; d <= cap; d += 2) {
    if (num % d === 0) return false;
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

// ─── Frequency Grid ──────────────────────────────────────────
// Using let so replay can temporarily swap these
let freq = new Map();              // key: "x,y" → count
let discoveredAt = new Map();      // key: "x,y" → currentIndex when first seen
let discoveryHistory = [];         // keys in order of first appearance
let maxFreq = 1;
let uniquePairs = 0;
const GRID_SIZE = 60;

// Visualization constants
const HIGHLIGHT_WINDOW = 800;
const TRAIL_LENGTH = 60;
const RIPPLE_DURATION = 600;
const CONNECTION_COUNT = 80;
const RATE_WINDOW = 3000;

// Gap history for replay — stores {key, idx} for every gap recorded
const gapHistory = [];

function recordGap(index) {
  const g1 = primes[index + 1] - primes[index];
  const g2 = primes[index + 2] - primes[index + 1];
  const x = g1 <= 1 ? g1 : g1 / 2;
  const y = g2 <= 1 ? g2 : g2 / 2;
  if (x >= GRID_SIZE || y >= GRID_SIZE) return;
  const key = x + "," + y;
  gapHistory.push({ key, idx: index });
  const prev = freq.get(key) || 0;
  if (prev === 0) {
    uniquePairs++;
    discoveredAt.set(key, currentIndex);
    discoveryHistory.push(key);
  }
  const next = prev + 1;
  freq.set(key, next);
  if (next > maxFreq) maxFreq = next;
}

// Rebuild gapHistory from primes after loading saved state
function rebuildGapHistory() {
  gapHistory.length = 0;
  for (let i = 0; i < currentIndex; i++) {
    if (i + 2 >= primes.length) break;
    const g1 = primes[i + 1] - primes[i];
    const g2 = primes[i + 2] - primes[i + 1];
    const x = g1 <= 1 ? g1 : g1 / 2;
    const y = g2 <= 1 ? g2 : g2 / 2;
    if (x >= GRID_SIZE || y >= GRID_SIZE) continue;
    gapHistory.push({ key: x + "," + y, idx: i });
  }
}

// ─── State ───────────────────────────────────────────────────
let currentIndex = 0;
const PRIMES_PER_FRAME = 200;

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

let activeView = "2d"; // "2d" | "3d"

// ─── Replay ─────────────────────────────────────────────────
const btnReplay = document.getElementById("btn-replay");

let replayActive = false;
let replayPos = 0;
const REPLAY_SPEED = 500;     // gaps per frame (fixed)

// Replay data (separate from live state)
let rFreq = new Map();
let rDiscoveredAt = new Map();
let rDiscoveryHistory = [];
let rMaxFreq = 1;
let rUniquePairs = 0;
let rIndex = 0;

// Live state references (saved during swap)
let liveFreq, liveDiscoveredAt, liveDiscoveryHistory, liveMaxFreq, liveUniquePairs, liveCurrentIndex;

function startReplay() {
  replayActive = true;
  replayPos = 0;
  rFreq = new Map();
  rDiscoveredAt = new Map();
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
  const end = Math.min(replayPos + REPLAY_SPEED, gapHistory.length);
  for (let i = replayPos; i < end; i++) {
    const { key, idx } = gapHistory[i];
    rIndex = idx;
    const prev = rFreq.get(key) || 0;
    if (prev === 0) {
      rUniquePairs++;
      rDiscoveredAt.set(key, idx);
      rDiscoveryHistory.push(key);
    }
    const next = prev + 1;
    rFreq.set(key, next);
    if (next > rMaxFreq) rMaxFreq = next;
  }
  replayPos = end;
  if (replayPos >= gapHistory.length) stopReplay();
}

function swapToReplay() {
  liveFreq = freq; liveDiscoveredAt = discoveredAt; liveDiscoveryHistory = discoveryHistory;
  liveMaxFreq = maxFreq; liveUniquePairs = uniquePairs; liveCurrentIndex = currentIndex;
  freq = rFreq; discoveredAt = rDiscoveredAt; discoveryHistory = rDiscoveryHistory;
  maxFreq = rMaxFreq; uniquePairs = rUniquePairs; currentIndex = rIndex;
}

function swapToLive() {
  freq = liveFreq; discoveredAt = liveDiscoveredAt; discoveryHistory = liveDiscoveryHistory;
  maxFreq = liveMaxFreq; uniquePairs = liveUniquePairs; currentIndex = liveCurrentIndex;
}

// ─── Filtering & Viz Mode ───────────────────────────────────
let filterMin = 1;
let filterMax = Infinity;
const filterMinInput = document.getElementById("filter-min");
const filterMaxInput = document.getElementById("filter-max");

let useLog = true;
const logToggle = document.getElementById("log-toggle");
logToggle.addEventListener("change", () => { useLog = logToggle.checked; });

let vizMode = "flash";
const vizSelect = document.getElementById("viz-mode");
vizSelect.addEventListener("change", () => {
  vizMode = vizSelect.value;
  // Hide 3D extras when switching modes
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

// ─── LocalStorage Persistence ───────────────────────────────
const STORAGE_KEY = "primeGapViz";

function saveState() {
  const data = {
    currentIndex,
    maxFreq,
    uniquePairs,
    freq: Array.from(freq.entries()),
    discoveredAt: Array.from(discoveredAt.entries()),
    discoveryHistory,
    primesLen: primes.length
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
    freq.clear();
    for (const [k, v] of data.freq) freq.set(k, v);
    discoveredAt.clear();
    for (const [k, v] of data.discoveredAt) discoveredAt.set(k, v);
    discoveryHistory.length = 0;
    discoveryHistory.push(...data.discoveryHistory);
    // Regenerate primes up to where we were
    while (primes.length < data.primesLen + PRIMES_PER_FRAME + 3) addPrime();
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

// Load previous session
loadState();
rebuildGapHistory();

// Auto-save every 5 seconds
setInterval(saveState, 5000);

// ─── 2D Heatmap ──────────────────────────────────────────────
function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  // 1:1 pixel ratio: use device pixels for sharp rendering
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

// ─── Shared helpers ─────────────────────────────────────────
function getT(count) {
  if (maxFreq <= 1) return count > 0 ? 1 : 0;
  return useLog ? Math.log(count + 1) / Math.log(maxFreq + 1) : count / maxFreq;
}

function cellXY(key) {
  const i = key.indexOf(",");
  return [+key.slice(0, i), +key.slice(i + 1)];
}

function freqColor(t) {
  const hue = 240 - t * 240;
  const lightness = 10 + t * 50;
  return hslToRgb(hue, 90, lightness);
}

function passesFilter(count) {
  return count >= filterMin && count <= filterMax;
}

// ─── 2D Drawing ─────────────────────────────────────────────
function drawHeatmap() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  // Square cells: use the smaller dimension
  const cell = Math.floor(Math.min(w, h) / GRID_SIZE);
  const gridPx = cell * GRID_SIZE;
  const ox = Math.floor((w - gridPx) / 2);
  const oy = Math.floor((h - gridPx) / 2);

  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, w, h);

  let shownCount = 0;

  switch (vizMode) {
    case "normal": shownCount = draw2dNormal(cell, ox, oy); break;
    case "flash":  shownCount = draw2dFlash(cell, ox, oy); break;
    case "trail":  shownCount = draw2dTrail(cell, ox, oy); break;
    case "discovery": shownCount = draw2dDiscovery(cell, ox, oy); break;
    case "ripples": shownCount = draw2dRipples(cell, ox, oy); break;
    case "connections": shownCount = draw2dConnections(cell, ox, oy); break;
    case "rate":   shownCount = draw2dRate(cell, ox, oy); break;
  }

  lastShownCount = shownCount;

  // Axis labels
  ctx.fillStyle = "#555";
  ctx.font = "11px monospace";
  ctx.fillText("gap(n)\u2192", ox + 4, oy + gridPx - 6);
  ctx.save();
  ctx.translate(ox + 12, oy + gridPx - 20);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("gap(n+1)\u2192", 0, 0);
  ctx.restore();
}

// --- Normal: plain frequency heatmap ---
function draw2dNormal(c, ox, oy) {
  let n = 0;
  for (const [key, count] of freq) {
    if (!passesFilter(count)) continue;
    n++;
    const [gx, gy] = cellXY(key);
    const [r, g, b] = freqColor(getT(count));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(ox + gx * c, oy + gy * c, c, c);
  }
  return n;
}

// --- Flash: frequency + bright pulse on new ---
function draw2dFlash(c, ox, oy) {
  const n = draw2dNormal(c, ox, oy);
  for (const [key, count] of freq) {
    if (!passesFilter(count)) continue;
    const age = currentIndex - discoveredAt.get(key);
    if (age >= HIGHLIGHT_WINDOW) continue;
    const [gx, gy] = cellXY(key);
    const fade = 1 - age / HIGHLIGHT_WINDOW;
    ctx.fillStyle = `rgba(180,220,255,${(fade * 0.85).toFixed(3)})`;
    ctx.fillRect(ox + gx * c, oy + gy * c, c, c);
  }
  return n;
}

// --- Trail: last N discoveries, colored by recency ---
function draw2dTrail(c, ox, oy) {
  const start = Math.max(0, discoveryHistory.length - TRAIL_LENGTH);
  const slice = discoveryHistory.slice(start);
  let n = 0;
  for (let i = 0; i < slice.length; i++) {
    const key = slice[i];
    const count = freq.get(key);
    if (!passesFilter(count)) continue;
    n++;
    const [gx, gy] = cellXY(key);
    const recency = (i + 1) / slice.length;
    const r = Math.round(80 + 175 * recency);
    const g = Math.round(100 + 155 * recency);
    const b = Math.round(160 + 95 * recency);
    ctx.fillStyle = `rgba(${r},${g},${b},${(0.3 + 0.7 * recency).toFixed(3)})`;
    ctx.fillRect(ox + gx * c, oy + gy * c, c, c);
  }
  return n;
}

// --- Discovery order: color by when found, not how often ---
function draw2dDiscovery(c, ox, oy) {
  let n = 0;
  for (const [key, count] of freq) {
    if (!passesFilter(count)) continue;
    n++;
    const [gx, gy] = cellXY(key);
    const t = currentIndex > 0 ? discoveredAt.get(key) / currentIndex : 0;
    // Magenta (early) → Cyan (recent)
    const hue = 300 - t * 120;
    const lightness = 20 + t * 30;
    const [r, g, b] = hslToRgb(hue, 80, lightness);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(ox + gx * c, oy + gy * c, c, c);
  }
  return n;
}

// --- Ripples: dimmed heatmap + expanding rings from new ---
function draw2dRipples(c, ox, oy) {
  let n = 0;
  for (const [key, count] of freq) {
    if (!passesFilter(count)) continue;
    n++;
    const [gx, gy] = cellXY(key);
    const t = getT(count);
    const hue = 240 - t * 240;
    const lightness = 8 + t * 25;
    const [r, g, b] = hslToRgb(hue, 70, lightness);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(ox + gx * c, oy + gy * c, c, c);
  }
  // Rings
  for (let i = discoveryHistory.length - 1; i >= 0; i--) {
    const key = discoveryHistory[i];
    const born = discoveredAt.get(key);
    const age = currentIndex - born;
    if (age >= RIPPLE_DURATION) break;
    const [gx, gy] = cellXY(key);
    const progress = age / RIPPLE_DURATION;
    const radius = progress * c * 8;
    const fade = 1 - progress;
    ctx.beginPath();
    ctx.arc(ox + (gx + 0.5) * c, oy + (gy + 0.5) * c, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(180,220,255,${(fade * 0.6).toFixed(3)})`;
    ctx.lineWidth = Math.max(1, 2 * fade);
    ctx.stroke();
  }
  return n;
}

// --- Connections: dimmed heatmap + lines between consecutive discoveries ---
function draw2dConnections(c, ox, oy) {
  let n = 0;
  for (const [key, count] of freq) {
    if (!passesFilter(count)) continue;
    n++;
    const [gx, gy] = cellXY(key);
    const t = getT(count);
    const hue = 240 - t * 240;
    const lightness = 6 + t * 18;
    const [r, g, b] = hslToRgb(hue, 60, lightness);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(ox + gx * c, oy + gy * c, c, c);
  }
  // Lines
  const start = Math.max(0, discoveryHistory.length - CONNECTION_COUNT);
  const slice = discoveryHistory.slice(start);
  for (let i = 0; i < slice.length - 1; i++) {
    const [x1, y1] = cellXY(slice[i]);
    const [x2, y2] = cellXY(slice[i + 1]);
    const recency = (i + 1) / slice.length;
    ctx.beginPath();
    ctx.moveTo(ox + (x1 + 0.5) * c, oy + (y1 + 0.5) * c);
    ctx.lineTo(ox + (x2 + 0.5) * c, oy + (y2 + 0.5) * c);
    ctx.strokeStyle = `rgba(140,180,255,${(0.15 + 0.85 * recency).toFixed(3)})`;
    ctx.lineWidth = 0.5 + 2 * recency;
    ctx.stroke();
  }
  // Newest dot
  if (slice.length > 0) {
    const [nx, ny] = cellXY(slice[slice.length - 1]);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(ox + nx * c, oy + ny * c, c, c);
  }
  return n;
}

// --- Discovery rate: bright for recently found, dim for old ---
function draw2dRate(c, ox, oy) {
  let n = 0;
  for (const [key, count] of freq) {
    if (!passesFilter(count)) continue;
    n++;
    const [gx, gy] = cellXY(key);
    const age = currentIndex - discoveredAt.get(key);
    if (age < RATE_WINDOW) {
      const recency = 1 - age / RATE_WINDOW;
      const hue = 200 - recency * 80;
      const lightness = 15 + recency * 50;
      const [r, g, b] = hslToRgb(hue, 80, lightness);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
    } else {
      ctx.fillStyle = "rgb(18,18,40)";
    }
    ctx.fillRect(ox + gx * c, oy + gy * c, c, c);
  }
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

// Bar pool
const barGeo = new THREE.BoxGeometry(0.85, 1, 0.85);
const bars = new Map();

function getBarColor(t) {
  const hue = 240 - t * 240;
  const lightness = 0.25 + t * 0.35;
  const color = new THREE.Color();
  color.setHSL(hue / 360, 0.85, lightness);
  return color;
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
  ripplePool.push({ mesh, active: false, born: 0, x: 0, z: 0 });
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
    const [gx, gy] = cellXY(key);
    bar.position.x = gx + 0.5;
    bar.position.z = gy + 0.5;
    scene.add(bar);
    bars.set(key, bar);
  }
  return bar;
}

function updateBars() {
  let shownCount = 0;

  // Hide all bars first (needed for replay where freq is smaller than bars pool)
  for (const bar of bars.values()) bar.visible = false;

  // Ensure all bars exist & set base state
  for (const [key, count] of freq) {
    const bar = ensureBar(key);
    const vis = passesFilter(count);
    bar.visible = vis;
    if (!vis) continue;
    shownCount++;

    const t = getT(count);
    const height = Math.max(0.1, t * GRID_SIZE * 0.6);
    bar.scale.y = height;
    bar.position.y = height / 2;
    bar.material.emissive.setRGB(0, 0, 0);

    // Mode-specific color/emissive
    switch (vizMode) {
      case "normal":
        bar.material.color.copy(getBarColor(t));
        break;

      case "flash": {
        bar.material.color.copy(getBarColor(t));
        const age = currentIndex - discoveredAt.get(key);
        if (age < HIGHLIGHT_WINDOW) {
          const fade = 1 - age / HIGHLIGHT_WINDOW;
          bar.material.emissive.setRGB(0.7 * fade, 0.85 * fade, fade);
        }
        break;
      }

      case "trail": {
        const idx = discoveryHistory.indexOf(key);
        const trailStart = discoveryHistory.length - TRAIL_LENGTH;
        if (idx >= trailStart && idx < discoveryHistory.length) {
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
        const born = discoveredAt.get(key);
        const dt = currentIndex > 0 ? born / currentIndex : 0;
        const c = new THREE.Color();
        c.setHSL((300 - dt * 120) / 360, 0.8, 0.25 + dt * 0.25);
        bar.material.color.copy(c);
        break;
      }

      case "ripples":
        bar.material.color.copy(getBarColor(t * 0.5));
        break;

      case "connections":
        bar.material.color.copy(getBarColor(t * 0.4));
        break;

      case "rate": {
        const age = currentIndex - discoveredAt.get(key);
        if (age < RATE_WINDOW) {
          const recency = 1 - age / RATE_WINDOW;
          const c = new THREE.Color();
          c.setHSL((200 - recency * 80) / 360, 0.8, 0.2 + recency * 0.4);
          bar.material.color.copy(c);
          bar.material.emissive.setRGB(0.1 * recency, 0.15 * recency, 0.25 * recency);
        } else {
          bar.material.color.setRGB(0.07, 0.07, 0.16);
        }
        break;
      }
    }
  }

  // 3D ripple rings
  if (vizMode === "ripples") {
    // Spawn new ripples for newly discovered pairs
    while (lastDiscoveryLen < discoveryHistory.length) {
      const key = discoveryHistory[lastDiscoveryLen];
      const [gx, gy] = cellXY(key);
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
    // Animate active ripples
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
    // Keep discovery counter in sync even when not in ripple mode
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
    const slice = discoveryHistory.slice(start);
    const len = slice.length;
    for (let i = 0; i < CONN_MAX; i++) {
      if (i < len) {
        const [gx, gy] = cellXY(slice[i]);
        const bar = bars.get(slice[i]);
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
onWindowResize();

// ─── Main Loop ───────────────────────────────────────────────
let frameCount = 0;
let lastShownCount = 0;

function loop() {
  const wasReplaying = replayActive;

  if (wasReplaying) {
    advanceReplay();
    swapToReplay();
  } else {
    while (primes.length < currentIndex + PRIMES_PER_FRAME + 3) addPrime();
    for (let i = 0; i < PRIMES_PER_FRAME; i++) {
      recordGap(currentIndex);
      currentIndex++;
    }
  }

  // Update info every 5 frames
  frameCount++;
  if (frameCount % 5 === 0) {
    infoIndex.textContent = currentIndex.toLocaleString();
    infoPrime.textContent = (currentIndex < primes.length ? primes[currentIndex].toLocaleString() : "...");
    infoPairs.textContent = uniquePairs.toLocaleString();
    infoShown.textContent = lastShownCount.toLocaleString();
  }

  // Render active view
  if (activeView === "2d") {
    drawHeatmap();
  } else {
    updateBars();
    orbitControls.update();
    renderer.render(scene, camera);
  }

  // Restore live state after replay render
  if (wasReplaying) swapToLive();

  requestAnimationFrame(loop);
}

loop();
