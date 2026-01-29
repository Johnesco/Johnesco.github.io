// Main entry — ES module
// cannon-es physics world, Three.js renderer, game loop, chase camera

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { initInput, getInput } from './input.js';
import { createEnvironment } from './environment.js';
import { createCar, applyCarControls, syncCarVisuals, resetCar, getChassisBody, getSpeedMPH } from './car3d.js';
import { createTrack, getTrackStart } from './track.js';

// ── Three.js setup ───────────────────────────────────────────────────
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    5000,
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x88aadd);
document.getElementById('game-canvas').appendChild(renderer.domElement);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── cannon-es physics world ──────────────────────────────────────────
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.SAPBroadphase(world);
world.defaultContactMaterial.friction = 0.3;

// ── Build scene ──────────────────────────────────────────────────────
const env = createEnvironment(scene, world);
createTrack(scene, world);
createCar(scene, world);
initInput();

// Spawn car on track start
const trackStart = getTrackStart();
resetCar(trackStart.position, trackStart.quaternion);

// ── Chase camera state ───────────────────────────────────────────────
const camPos = new THREE.Vector3(0, 5, -12);
const camLookAt = new THREE.Vector3();

const CAM_DISTANCE = 12;
const CAM_HEIGHT = 4;
const CAM_LOOK_AHEAD = 10;
const CAM_POS_SMOOTH = 0.06;
const CAM_LOOK_SMOOTH = 0.10;

// ── HUD elements ─────────────────────────────────────────────────────
const speedEl = document.getElementById('speed');
const debugEl = document.getElementById('debug');

// ── Clock ────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

// ── Game loop ────────────────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.1);

    // Input
    const input = getInput();

    // Reset
    if (input.reset) {
        const start = getTrackStart();
        resetCar(start.position, start.quaternion);
        input.reset = false; // consume
    }

    // 1. Apply controls (steering / engine / brake)
    applyCarControls(input);

    // 2. Physics step (fixed 1/60 s, up to 3 sub-steps)
    world.step(1 / 60, dt, 3);

    // 3. Sync visuals from physics
    syncCarVisuals();

    // Camera
    updateCamera();

    // Move shadow camera to follow car
    const chassis = getChassisBody();
    if (chassis && env.dirLight) {
        env.dirLight.target.position.copy(chassis.position);
        env.dirLight.target.updateMatrixWorld();
        env.dirLight.position.set(
            chassis.position.x + 50,
            80,
            chassis.position.z + 30,
        );
    }

    // HUD
    speedEl.textContent = getSpeedMPH() + ' MPH';
    if (chassis) {
        const p = chassis.position;
        const v = chassis.velocity;
        debugEl.textContent =
            `pos  ${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)}\n` +
            `vel  ${v.length().toFixed(1)} m/s`;
    }

    renderer.render(scene, camera);
}

function updateCamera() {
    const chassis = getChassisBody();
    if (!chassis) return;

    const pos = chassis.position;
    const speed = chassis.velocity.length();
    const speedRatio = Math.min(speed / 40, 1);

    // Car forward direction from chassis quaternion
    const forward = new THREE.Vector3(0, 0, 1);
    const q = new THREE.Quaternion(
        chassis.quaternion.x,
        chassis.quaternion.y,
        chassis.quaternion.z,
        chassis.quaternion.w,
    );
    forward.applyQuaternion(q);

    // Speed-adaptive distance / height
    const dist = CAM_DISTANCE + speedRatio * 4;
    const height = CAM_HEIGHT + speedRatio * 2;

    // Target camera position: behind and above car
    const targetPos = new THREE.Vector3(
        pos.x - forward.x * dist,
        pos.y + height,
        pos.z - forward.z * dist,
    );

    // Target look-at: ahead of car
    const lookAhead = CAM_LOOK_AHEAD + speedRatio * 6;
    const targetLook = new THREE.Vector3(
        pos.x + forward.x * lookAhead,
        pos.y + 1.5,
        pos.z + forward.z * lookAhead,
    );

    // Lerp
    camPos.lerp(targetPos, CAM_POS_SMOOTH);
    camLookAt.lerp(targetLook, CAM_LOOK_SMOOTH);

    camera.position.copy(camPos);
    camera.lookAt(camLookAt);
}

// Go
animate();
