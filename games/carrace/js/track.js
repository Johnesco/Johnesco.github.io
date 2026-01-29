// Track — ES module
// Stadium-oval closed-loop track with banked turns, hills,
// CANNON.Trimesh physics and procedural asphalt texture.

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// ── Track constants ────────────────────────────────────────────────────
const HALF_WIDTH    = 6;          // 12 m total road width
const N_SAMPLES     = 400;        // cross-sections around the loop
const BANK_MAX_DEG  = 18;         // max banking angle in degrees
const K_MAX         = 0.025;      // curvature at which banking saturates
const SMOOTH_RADIUS = 3;          // triangle-kernel smoothing radius

// ── Module state ───────────────────────────────────────────────────────
let trackCurve   = null;   // THREE.CatmullRomCurve3
let trackMesh    = null;   // THREE.Mesh
let trackBody    = null;   // CANNON.Body (Trimesh)
let startPos     = null;   // CANNON.Vec3
let startQuat    = null;   // CANNON.Quaternion

// ═══════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════

export function createTrack(scene, world) {
    trackCurve = buildCurve();

    const bankAngles = computeBankingArray(trackCurve, N_SAMPLES);
    const smoothed   = smoothArray(bankAngles, SMOOTH_RADIUS);

    const { positions, uvs, indices, normals } = buildTrackGeometry(trackCurve, smoothed, N_SAMPLES);

    // ── Physics trimesh ────────────────────────────────────────────────
    const trimesh = new CANNON.Trimesh(positions, indices);
    trackBody = new CANNON.Body({ mass: 0 });
    trackBody.addShape(trimesh);
    world.addBody(trackBody);

    // ── Visual mesh ────────────────────────────────────────────────────
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv',       new THREE.BufferAttribute(uvs, 2));
    geo.setAttribute('normal',   new THREE.BufferAttribute(normals, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();                       // override with smooth normals

    const mat = new THREE.MeshPhongMaterial({
        map: createTrackTexture(),
        side: THREE.DoubleSide,
        shininess: 8,
    });
    trackMesh = new THREE.Mesh(geo, mat);
    trackMesh.receiveShadow = true;
    scene.add(trackMesh);

    // ── Compute start transform ────────────────────────────────────────
    computeStartTransform(trackCurve);

    return { mesh: trackMesh, body: trackBody, curve: trackCurve };
}

export function getTrackStart() {
    return { position: startPos, quaternion: startQuat };
}

// ═══════════════════════════════════════════════════════════════════════
// Internal helpers
// ═══════════════════════════════════════════════════════════════════════

// ── Track path (stadium oval with hills) ───────────────────────────────
function buildCurve() {
    // Stadium oval: two straights + two semicircles
    // Bottom straight along +X, top straight along -X
    // Semicircles at ±X ends
    const R = 65;           // semicircle radius
    const L = 120;          // half-length of each straight (total straight ≈ 240 m)

    // Control points traced counter-clockwise when viewed from above
    const pts = [
        // Bottom straight (Z = -R) — gentle hill peaking at Y≈3
        new THREE.Vector3(-L,   0.5, -R),
        new THREE.Vector3(-L/2, 2.0, -R),
        new THREE.Vector3( 0,   3.0, -R),     // gentle hill peak
        new THREE.Vector3( L/2, 2.0, -R),
        new THREE.Vector3( L,   0.5, -R),

        // Right semicircle (center at X=L, Z=0)
        new THREE.Vector3( L + R * 0.7,  0.5, -R * 0.7),
        new THREE.Vector3( L + R,        0.5,  0),
        new THREE.Vector3( L + R * 0.7,  0.5,  R * 0.7),

        // Top straight (Z = +R) — big hill peaking at Y≈10 for jumps
        new THREE.Vector3( L,   0.5,  R),
        new THREE.Vector3( L/2, 5.0,  R),
        new THREE.Vector3( 0,  10.0,  R),     // big hill peak
        new THREE.Vector3(-L/2, 5.0,  R),
        new THREE.Vector3(-L,   0.5,  R),

        // Left semicircle (center at X=-L, Z=0)
        new THREE.Vector3(-L - R * 0.7,  0.5,  R * 0.7),
        new THREE.Vector3(-L - R,        0.5,  0),
        new THREE.Vector3(-L - R * 0.7,  0.5, -R * 0.7),
    ];

    return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
}

// ── Stable Frenet-like frame ───────────────────────────────────────────
function getFrame(curve, t) {
    const T = curve.getTangentAt(t).normalize();
    const worldUp = new THREE.Vector3(0, 1, 0);
    const R = new THREE.Vector3().crossVectors(T, worldUp).normalize();
    // If tangent is near-vertical, fallback
    if (R.lengthSq() < 0.001) {
        R.set(1, 0, 0);
    }
    const U = new THREE.Vector3().crossVectors(R, T).normalize();
    return { T, R, U };
}

// ── Signed curvature in XZ plane ───────────────────────────────────────
function getCurvature(curve, t) {
    const dt = 0.005;
    const t0 = ((t - dt) % 1 + 1) % 1;
    const t1 = ((t + dt) % 1 + 1) % 1;
    const T0 = curve.getTangentAt(t0);
    const T1 = curve.getTangentAt(t1);

    // Angle change in XZ
    const a0 = Math.atan2(T0.x, T0.z);
    const a1 = Math.atan2(T1.x, T1.z);
    let da = a1 - a0;
    // Wrap to [-PI, PI]
    if (da >  Math.PI) da -= 2 * Math.PI;
    if (da < -Math.PI) da += 2 * Math.PI;

    // Arc-length between the two samples
    const arcLen = curve.getLength() * 2 * dt;
    return da / arcLen;   // signed curvature (positive = left turn)
}

// ── Banking angle from curvature ───────────────────────────────────────
function bankingAngle(curvature) {
    const absK = Math.abs(curvature);
    const ratio = Math.min(absK / K_MAX, 1);
    // Smoothstep
    const ss = ratio * ratio * (3 - 2 * ratio);
    const angle = ss * (BANK_MAX_DEG * Math.PI / 180);
    // Sign: positive curvature (left turn) → tilt right edge up → negative angle
    return -Math.sign(curvature) * angle;
}

// ── Compute banking for all samples ────────────────────────────────────
function computeBankingArray(curve, n) {
    const arr = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const t = i / n;
        arr[i] = bankingAngle(getCurvature(curve, t));
    }
    return arr;
}

// ── Triangle-kernel smoothing ──────────────────────────────────────────
function smoothArray(arr, radius) {
    const n = arr.length;
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        let sum = 0, wSum = 0;
        for (let j = -radius; j <= radius; j++) {
            const idx = ((i + j) % n + n) % n;
            const w = radius + 1 - Math.abs(j);
            sum += arr[idx] * w;
            wSum += w;
        }
        out[i] = sum / wSum;
    }
    return out;
}

// ── Apply banking rotation to right/up vectors ─────────────────────────
function applyBanking(T, R, U, angle) {
    // Rotate R and U around T by `angle`
    const quat = new THREE.Quaternion().setFromAxisAngle(T, angle);
    const bR = R.clone().applyQuaternion(quat);
    const bU = U.clone().applyQuaternion(quat);
    return { R: bR, U: bU };
}

// ── Build track geometry arrays ────────────────────────────────────────
function buildTrackGeometry(curve, bankAngles, n) {
    // n samples + 1 seam sample (at t=1 = t=0 for UV continuity)
    const vCount = (n + 1) * 2;
    const positions = new Float32Array(vCount * 3);
    const uvs       = new Float32Array(vCount * 2);
    const normals   = new Float32Array(vCount * 3);

    const totalLen = curve.getLength();
    const lengths  = curve.getLengths(n);   // n+1 entries (0 .. totalLen)

    for (let i = 0; i <= n; i++) {
        const t = (i % n) / n;             // wraps last sample to 0
        const { T, R, U } = getFrame(curve, t);
        const bAngle = bankAngles[i % n];
        const { R: bR, U: bU } = applyBanking(T, R, U, bAngle);

        const center = curve.getPointAt(t);
        const leftOff  = bR.clone().multiplyScalar(-HALF_WIDTH);
        const rightOff = bR.clone().multiplyScalar( HALF_WIDTH);

        const left  = center.clone().add(leftOff);
        const right = center.clone().add(rightOff);

        const vi = i * 2;
        // Left vertex
        positions[vi * 3]     = left.x;
        positions[vi * 3 + 1] = left.y;
        positions[vi * 3 + 2] = left.z;
        // Right vertex
        positions[(vi + 1) * 3]     = right.x;
        positions[(vi + 1) * 3 + 1] = right.y;
        positions[(vi + 1) * 3 + 2] = right.z;

        // UVs: U = 0 (left) .. 1 (right), V = arcLength / 20
        const arcLen = lengths[i];
        const v = arcLen / 20;
        uvs[vi * 2]         = 0;
        uvs[vi * 2 + 1]     = v;
        uvs[(vi + 1) * 2]   = 1;
        uvs[(vi + 1) * 2 + 1] = v;

        // Normal = banked up
        normals[vi * 3]     = bU.x;
        normals[vi * 3 + 1] = bU.y;
        normals[vi * 3 + 2] = bU.z;
        normals[(vi + 1) * 3]     = bU.x;
        normals[(vi + 1) * 3 + 1] = bU.y;
        normals[(vi + 1) * 3 + 2] = bU.z;
    }

    // ── Indices (triangle strip → two tris per quad) ───────────────────
    const triCount = n * 2;
    const indices  = new Uint32Array(triCount * 3);
    for (let i = 0; i < n; i++) {
        const a = i * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;

        const idx = i * 6;
        // Triangle 1 (CCW from above — normals face +Y)
        indices[idx]     = a;
        indices[idx + 1] = b;
        indices[idx + 2] = c;
        // Triangle 2
        indices[idx + 3] = b;
        indices[idx + 4] = d;
        indices[idx + 5] = c;
    }

    return { positions, uvs, indices, normals };
}

// ── Procedural asphalt canvas texture ──────────────────────────────────
function createTrackTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width  = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base dark gray
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 0, size, size);

    // Noise grain
    for (let i = 0; i < 12000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const b = Math.floor(Math.random() * 30 + 40);
        ctx.fillStyle = `rgb(${b},${b},${b})`;
        ctx.fillRect(x, y, 1, 1);
    }

    // Edge lines (white) — left edge U ≈ 0.03–0.06, right edge U ≈ 0.94–0.97
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    const leftX0  = Math.round(0.03 * size);
    const leftX1  = Math.round(0.06 * size);
    const rightX0 = Math.round(0.94 * size);
    const rightX1 = Math.round(0.97 * size);
    ctx.fillRect(leftX0,  0, leftX1 - leftX0,   size);
    ctx.fillRect(rightX0, 0, rightX1 - rightX0, size);

    // Dashed center line (white) — U ≈ 0.49–0.51
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const cx0 = Math.round(0.49 * size);
    const cx1 = Math.round(0.51 * size);
    const dashLen = 30;
    const gapLen  = 30;
    for (let y = 0; y < size; y += dashLen + gapLen) {
        ctx.fillRect(cx0, y, cx1 - cx0, dashLen);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

// ── Compute start position & quaternion ────────────────────────────────
function computeStartTransform(curve) {
    const t = 0;
    const center = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();

    // Position: 2 m above surface center at t=0
    startPos = new CANNON.Vec3(center.x, center.y + 2, center.z);

    // Quaternion: car Z-forward aligned with tangent
    const forward = new THREE.Vector3(tangent.x, tangent.y, tangent.z);
    const m = new THREE.Matrix4();
    const eye = new THREE.Vector3(0, 0, 0);
    const up  = new THREE.Vector3(0, 1, 0);
    m.lookAt(eye, forward, up);
    const q = new THREE.Quaternion().setFromRotationMatrix(m);

    startQuat = new CANNON.Quaternion(q.x, q.y, q.z, q.w);
}
