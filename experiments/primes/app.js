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
const freq = new Map();       // key: "x,y" → count
let maxFreq = 1;
let uniquePairs = 0;
const GRID_SIZE = 60;         // max compacted gap value we track (covers gaps up to 120)

function recordGap(index) {
  const g1 = primes[index + 1] - primes[index];
  const g2 = primes[index + 2] - primes[index + 1];
  // Compact: all gaps after the first (2→3 gap=1) are even, so /2
  const x = g1 <= 1 ? g1 : g1 / 2;
  const y = g2 <= 1 ? g2 : g2 / 2;
  if (x >= GRID_SIZE || y >= GRID_SIZE) return;
  const key = x + "," + y;
  const prev = freq.get(key) || 0;
  if (prev === 0) uniquePairs++;
  const next = prev + 1;
  freq.set(key, next);
  if (next > maxFreq) maxFreq = next;
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
const infoIndex = document.getElementById("info-index");
const infoPrime = document.getElementById("info-prime");
const infoPairs = document.getElementById("info-pairs");

let activeView = "2d"; // "2d" | "3d"

// ─── Frequency Filtering ────────────────────────────────────
let filterMin = 1;
let filterMax = Infinity;
const filterMinInput = document.getElementById("filter-min");
const filterMaxInput = document.getElementById("filter-max");
const infoShown = document.getElementById("info-shown");

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

// ─── 2D Heatmap ──────────────────────────────────────────────
function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
resizeCanvas();

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function drawHeatmap() {
  const w = canvas.width;
  const h = canvas.height;
  const cellW = w / GRID_SIZE;
  const cellH = h / GRID_SIZE;
  const logMax = Math.log(maxFreq + 1);

  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, w, h);

  let shownCount = 0;
  for (const [key, count] of freq) {
    if (count < filterMin || count > filterMax) continue;
    shownCount++;
    const [gx, gy] = key.split(",").map(Number);
    const t = Math.log(count + 1) / logMax; // 0..1 log scale
    // cool (240° blue) → warm (0° red)
    const hue = 240 - t * 240;
    const lightness = 10 + t * 50;
    const [r, g, b] = hslToRgb(hue, 90, lightness);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(gx * cellW, gy * cellH, Math.ceil(cellW), Math.ceil(cellH));
  }
  lastShownCount = shownCount;

  // Axis labels
  ctx.fillStyle = "#555";
  ctx.font = "11px monospace";
  ctx.fillText("gap(n)→", 4, h - 6);
  ctx.save();
  ctx.translate(12, h - 20);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("gap(n+1)→", 0, 0);
  ctx.restore();
}

// ─── Three.js 3D Heightmap ───────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
camera.position.set(GRID_SIZE * 0.8, GRID_SIZE * 1.2, GRID_SIZE * 1.4);
camera.lookAt(GRID_SIZE / 2, 0, GRID_SIZE / 2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
threeContainer.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(GRID_SIZE / 2, 0, GRID_SIZE / 2);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

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

// Column meshes — reuse one geometry, create instanced mesh
const barGeo = new THREE.BoxGeometry(0.85, 1, 0.85);
// We'll use a pool of meshes keyed by "x,y"
const bars = new Map();

function getBarColor(t) {
  // blue → cyan → green → yellow → red
  const hue = 240 - t * 240;
  const lightness = 0.25 + t * 0.35;
  const color = new THREE.Color();
  color.setHSL(hue / 360, 0.85, lightness);
  return color;
}

function updateBars() {
  const logMax = Math.log(maxFreq + 1);
  let shownCount = 0;

  for (const [key, count] of freq) {
    const [gx, gy] = key.split(",").map(Number);
    let bar = bars.get(key);
    const visible = count >= filterMin && count <= filterMax;

    if (!bar) {
      const t = Math.log(count + 1) / logMax;
      const mat = new THREE.MeshStandardMaterial({ color: getBarColor(t) });
      bar = new THREE.Mesh(barGeo, mat);
      bar.position.x = gx + 0.5;
      bar.position.z = gy + 0.5;
      scene.add(bar);
      bars.set(key, bar);
    }

    bar.visible = visible;
    if (visible) {
      shownCount++;
      const t = Math.log(count + 1) / logMax;
      const height = Math.max(0.1, t * GRID_SIZE * 0.6);
      bar.scale.y = height;
      bar.position.y = height / 2;
      bar.material.color.copy(getBarColor(t));
    }
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
  // Ensure enough primes
  while (primes.length < currentIndex + PRIMES_PER_FRAME + 3) {
    addPrime();
  }

  // Process batch
  for (let i = 0; i < PRIMES_PER_FRAME; i++) {
    recordGap(currentIndex);
    currentIndex++;
  }

  // Update info every 5 frames to reduce DOM thrash
  frameCount++;
  if (frameCount % 5 === 0) {
    infoIndex.textContent = currentIndex.toLocaleString();
    infoPrime.textContent = primes[currentIndex].toLocaleString();
    infoPairs.textContent = uniquePairs.toLocaleString();
    infoShown.textContent = lastShownCount.toLocaleString();
  }

  // Render active view
  if (activeView === "2d") {
    drawHeatmap();
  } else {
    updateBars();
    controls.update();
    renderer.render(scene, camera);
  }

  requestAnimationFrame(loop);
}

loop();
