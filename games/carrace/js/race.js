// Race — ES module
// AI opponents, race state machine, lap tracking, position calculation

import * as THREE from 'three';
import { createCarInstance, applyCarControlsTo, syncCarVisualsFor, resetCarInstance } from './car3d.js';
import { getTrackCurve, getGridPositions } from './track.js';

// ── AI constants ─────────────────────────────────────────────────────
const AI_COLORS = [0x2255cc, 0x22aa44, 0xdd8800]; // blue, green, orange
const AI_NAMES  = ['Blue', 'Green', 'Orange'];
const AI_SPEEDS = [28, 31, 34]; // target m/s

const AI_TUNING = {
    engineForce: 900, brakeForce: 45, maxSteer: 0.48,
    topSpeed: 36, suspStiffness: 50, dampComp: 4.5, dampRel: 2.5,
    frictionSlip: 2.0, rollInfluence: 0.02, angularDamping: 0.5,
};

// ── Race state ───────────────────────────────────────────────────────
const STATES = { COUNTDOWN: 0, RACING: 1, FINISHED: 2 };
let state = STATES.COUNTDOWN;
let countdown = 3.0;
let raceTime = 0;
const totalLaps = 3;
let finishOrder = [];

// ── Racers array (player + AI) ──────────────────────────────────────
let racers = [];     // { car, name, targetSpeed, trackT, prevT, lap, isPlayer }
let playerRacer = null;

// ── Curve sample cache for AI nearest-t lookup ──────────────────────
const N_CURVE_SAMPLES = 200;
let curveSamples = null; // [{ point: Vector3, t: number }]

function buildCurveSamples(curve) {
    curveSamples = [];
    for (let i = 0; i < N_CURVE_SAMPLES; i++) {
        const t = i / N_CURVE_SAMPLES;
        curveSamples.push({ point: curve.getPointAt(t), t });
    }
}

function findClosestT(position, curve) {
    if (!curveSamples) buildCurveSamples(curve);

    let bestDist = Infinity;
    let bestT = 0;
    const px = position.x, pz = position.z;

    for (let i = 0; i < curveSamples.length; i++) {
        const s = curveSamples[i];
        const dx = s.point.x - px;
        const dz = s.point.z - pz;
        const dist = dx * dx + dz * dz; // skip sqrt for comparison
        if (dist < bestDist) {
            bestDist = dist;
            bestT = s.t;
        }
    }
    return bestT;
}

// ═══════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════

export function initRace(playerCar, scene, world) {
    const curve = getTrackCurve();
    buildCurveSamples(curve);

    // Create AI cars
    const aiCars = [];
    for (let i = 0; i < 3; i++) {
        const car = createCarInstance(scene, world, AI_COLORS[i]);
        aiCars.push({
            car,
            name: AI_NAMES[i],
            targetSpeed: AI_SPEEDS[i],
            trackT: 0,
            prevT: 0,
            lap: 0,
            isPlayer: false,
        });
    }

    // Build racers array: player at index 0, then AI
    playerRacer = {
        car: playerCar,
        name: 'Player',
        targetSpeed: 0, // not used for player
        trackT: 0,
        prevT: 0,
        lap: 0,
        isPlayer: true,
    };
    racers = [playerRacer, ...aiCars];

    // Position all cars on the starting grid
    const gridSlots = getGridPositions(4);
    for (let i = 0; i < racers.length; i++) {
        const slot = gridSlots[i];
        resetCarInstance(racers[i].car, slot.position, slot.quaternion);
    }

    // Init race state
    state = STATES.COUNTDOWN;
    countdown = 3.0;
    raceTime = 0;
    finishOrder = [];

    // Init track positions
    for (const r of racers) {
        r.trackT = findClosestT(r.car.chassisBody.position, curve);
        r.prevT = r.trackT;
        r.lap = 0;
    }

    return { aiCars, racers };
}

export function updateRace(dt, playerInput) {
    const curve = getTrackCurve();

    switch (state) {
        case STATES.COUNTDOWN:
            // Hold all cars with brakes
            for (const r of racers) {
                for (let i = 0; i < 4; i++) r.car.vehicle.setBrake(100, i);
                r.car.vehicle.applyEngineForce(0, 2);
                r.car.vehicle.applyEngineForce(0, 3);
            }
            countdown -= dt;
            if (countdown <= 0) {
                state = STATES.RACING;
                raceTime = 0;
                // Release brakes
                for (const r of racers) {
                    for (let i = 0; i < 4; i++) r.car.vehicle.setBrake(0, i);
                }
            }
            break;

        case STATES.RACING:
            raceTime += dt;

            // Player controls
            applyCarControlsTo(playerRacer.car, playerInput);

            // AI driving
            for (const r of racers) {
                if (r.isPlayer) continue;
                updateAIDriving(r, curve);
            }

            // Update lap progress for all racers
            for (const r of racers) {
                updateLapProgress(r, curve);
            }

            // Check win condition
            for (const r of racers) {
                if (r.lap >= totalLaps && !finishOrder.includes(r.name)) {
                    finishOrder.push(r.name);
                }
            }
            if (finishOrder.length > 0 && state === STATES.RACING) {
                state = STATES.FINISHED;
                // Fill remaining positions
                const sorted = getRacePositionsSorted();
                for (const r of sorted) {
                    if (!finishOrder.includes(r.name)) {
                        finishOrder.push(r.name);
                    }
                }
            }
            break;

        case STATES.FINISHED:
            // AI cars coast
            for (const r of racers) {
                if (r.isPlayer) {
                    applyCarControlsTo(playerRacer.car, playerInput);
                    continue;
                }
                // Light braking, no engine
                r.car.vehicle.applyEngineForce(0, 2);
                r.car.vehicle.applyEngineForce(0, 3);
                for (let i = 0; i < 4; i++) r.car.vehicle.setBrake(10, i);
            }
            break;
    }
}

export function syncAllRaceCars() {
    for (const r of racers) {
        syncCarVisualsFor(r.car);
    }
}

export function restartRace() {
    const curve = getTrackCurve();

    // Reposition all cars on grid
    const gridSlots = getGridPositions(racers.length);
    for (let i = 0; i < racers.length; i++) {
        const slot = gridSlots[i];
        resetCarInstance(racers[i].car, slot.position, slot.quaternion);
    }

    state = STATES.COUNTDOWN;
    countdown = 3.0;
    raceTime = 0;
    finishOrder = [];

    for (const r of racers) {
        r.trackT = findClosestT(r.car.chassisBody.position, curve);
        r.prevT = r.trackT;
        r.lap = 0;
    }
}

export function getRaceHUD() {
    const playerPos = getPlayerPosition();
    return {
        state,
        countdown,
        playerLap: playerRacer ? playerRacer.lap : 0,
        totalLaps,
        playerPosition: playerPos,
        totalCars: racers.length,
        raceTime,
        finishOrder,
    };
}

// ═══════════════════════════════════════════════════════════════════════
// AI driving
// ═══════════════════════════════════════════════════════════════════════

function updateAIDriving(aiRacer, curve) {
    const car = aiRacer.car;
    const body = car.chassisBody;
    const speed = body.velocity.length();
    const pos = body.position;

    // 1. Find current t on curve
    const currentT = findClosestT(pos, curve);

    // 2. Speed-dependent lookahead — further ahead at higher speed
    const baseLook = 0.02;
    const speedLook = Math.min(speed / 600, 0.03);
    const targetT = (currentT + baseLook + speedLook) % 1;
    const targetPt = curve.getPointAt(targetT);

    // 3. Compute steering
    // Car driving direction: the car uses negative engine force along +Z,
    // so the actual driving forward is local -Z
    const forward = new THREE.Vector3(0, 0, -1);
    const q = new THREE.Quaternion(
        body.quaternion.x, body.quaternion.y,
        body.quaternion.z, body.quaternion.w,
    );
    forward.applyQuaternion(q);

    // Direction to target
    const toTarget = new THREE.Vector3(
        targetPt.x - pos.x,
        0,
        targetPt.z - pos.z,
    ).normalize();

    // Cross product for steering direction
    const cross = new THREE.Vector3().crossVectors(forward, toTarget);
    const steerAmount = Math.max(-1, Math.min(1, cross.y * 3));

    // Alignment (dot product) — how well car faces the target
    const alignment = forward.x * toTarget.x + forward.z * toTarget.z;

    // 4. Curvature braking — slow down in tight turns
    const lookAheadT2 = (currentT + 0.06) % 1;
    const tan1 = curve.getTangentAt(currentT);
    const tan2 = curve.getTangentAt(lookAheadT2);
    const curveDot = tan1.x * tan2.x + tan1.z * tan2.z;
    const curvature = 1 - Math.max(0, curveDot); // 0 = straight, ~1 = sharp turn

    // Reduce target speed in curves
    let effectiveTargetSpeed = aiRacer.targetSpeed;
    if (curvature > 0.02) {
        effectiveTargetSpeed *= Math.max(0.55, 1 - curvature * 3);
    }

    // 5. Build input
    const aiInput = {
        steerAmount,
        up: speed < effectiveTargetSpeed && alignment > -0.2,
        down: false,
        brake: speed > effectiveTargetSpeed + 5 || alignment < 0.1,
    };

    applyCarControlsTo(car, aiInput, AI_TUNING);
}

// ═══════════════════════════════════════════════════════════════════════
// Lap tracking
// ═══════════════════════════════════════════════════════════════════════

function updateLapProgress(racer, curve) {
    racer.prevT = racer.trackT;
    racer.trackT = findClosestT(racer.car.chassisBody.position, curve);

    // Forward crossing of start line
    if (racer.prevT > 0.85 && racer.trackT < 0.15) {
        racer.lap++;
    }
    // Backward crossing (prevent cheating by reversing)
    if (racer.prevT < 0.15 && racer.trackT > 0.85) {
        racer.lap = Math.max(0, racer.lap - 1);
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Position calculation
// ═══════════════════════════════════════════════════════════════════════

function getRacePositionsSorted() {
    // Sort by total progress (lap + trackT), descending
    return [...racers].sort((a, b) => {
        const progressA = a.lap + a.trackT;
        const progressB = b.lap + b.trackT;
        return progressB - progressA;
    });
}

function getPlayerPosition() {
    if (!playerRacer) return 1;
    const sorted = getRacePositionsSorted();
    for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].isPlayer) return i + 1;
    }
    return 1;
}
