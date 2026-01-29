// Car — ES module
// cannon-es RaycastVehicle + Three.js visual, full 6DOF

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// ── State exposed to main loop ───────────────────────────────────────
let chassisBody;
let vehicle;
let carMesh;          // THREE.Group for chassis visual
let wheelMeshes = []; // THREE.Group[] for each wheel visual
let brakeLights = [];
let brakeLightMats;

// ── Fixed geometry constants ─────────────────────────────────────────
const CHASSIS_HALF = { x: 1.0, y: 0.4, z: 1.8 };       // half-extents (m)
const MASS = 150;
const WHEEL_RADIUS = 0.4;
const SUSP_REST_LENGTH = 0.4;
const SUSP_TRAVEL = 0.5;

// ── Driving presets ─────────────────────────────────────────────────
//  Each preset tunes: power, braking, steering, grip, stability
const PRESETS = {
    casual: {
        label: 'Casual',
        engineForce:    600,
        brakeForce:     40,
        maxSteer:       0.50,
        topSpeed:       25,      // m/s (~56 mph) — power fades toward this
        suspStiffness:  45,
        dampComp:       5.0,
        dampRel:        3.0,
        frictionSlip:   2.5,
        rollInfluence:  0.01,
        angularDamping: 0.6,
    },
    touring: {
        label: 'Touring',
        engineForce:    900,
        brakeForce:     45,
        maxSteer:       0.48,
        topSpeed:       35,
        suspStiffness:  50,
        dampComp:       4.5,
        dampRel:        2.5,
        frictionSlip:   2.0,
        rollInfluence:  0.02,
        angularDamping: 0.5,
    },
    sport: {
        label: 'Sport',
        engineForce:    1200,
        brakeForce:     50,
        maxSteer:       0.45,
        topSpeed:       45,
        suspStiffness:  60,
        dampComp:       4.4,
        dampRel:        2.3,
        frictionSlip:   1.8,
        rollInfluence:  0.04,
        angularDamping: 0.45,
    },
    race: {
        label: 'Race',
        engineForce:    1500,
        brakeForce:     55,
        maxSteer:       0.40,
        topSpeed:       55,
        suspStiffness:  65,
        dampComp:       4.2,
        dampRel:        2.2,
        frictionSlip:   1.5,
        rollInfluence:  0.05,
        angularDamping: 0.4,
    },
    drift: {
        label: 'Drift',
        engineForce:    1300,
        brakeForce:     35,
        maxSteer:       0.55,
        topSpeed:       40,
        suspStiffness:  40,
        dampComp:       3.5,
        dampRel:        2.0,
        frictionSlip:   1.0,
        rollInfluence:  0.08,
        angularDamping: 0.3,
    },
};

// Active tuning — starts as Touring, changed via setDrivingPreset()
const tuning = { ...PRESETS.touring };

// Wheel placement (local to chassis)
//   front axle z = +1.3   rear axle z = -1.3
//   left x = -0.9          right x = +0.9
const WHEEL_POSITIONS = [
    new CANNON.Vec3(-0.9, 0, 1.3),   // 0 FL
    new CANNON.Vec3( 0.9, 0, 1.3),   // 1 FR
    new CANNON.Vec3(-0.9, 0, -1.3),  // 2 RL
    new CANNON.Vec3( 0.9, 0, -1.3),  // 3 RR
];

// ── Create everything ────────────────────────────────────────────────
export function createCar(scene, world) {
    // ── Physics chassis ──────────────────────────────────────────────
    const chassisShape = new CANNON.Box(
        new CANNON.Vec3(CHASSIS_HALF.x, CHASSIS_HALF.y, CHASSIS_HALF.z)
    );
    chassisBody = new CANNON.Body({ mass: MASS });
    // Offset shape y+0.1 to lower CG relative to shape center
    chassisBody.addShape(chassisShape, new CANNON.Vec3(0, 0.1, 0));
    chassisBody.angularDamping = tuning.angularDamping;
    chassisBody.position.set(0, 2, 0);
    // Don't add chassisBody to world directly — RaycastVehicle does that

    // ── RaycastVehicle ───────────────────────────────────────────────
    vehicle = new CANNON.RaycastVehicle({
        chassisBody,
        indexRightAxis: 0,    // x = right
        indexUpAxis: 1,       // y = up
        indexForwardAxis: 2,  // z = forward
    });

    const wheelOptions = {
        radius: WHEEL_RADIUS,
        directionLocal: new CANNON.Vec3(0, -1, 0),
        suspensionStiffness: tuning.suspStiffness,
        suspensionRestLength: SUSP_REST_LENGTH,
        maxSuspensionTravel: SUSP_TRAVEL,
        frictionSlip: tuning.frictionSlip,
        dampingCompression: tuning.dampComp,
        dampingRelaxation: tuning.dampRel,
        rollInfluence: tuning.rollInfluence,
        axleLocal: new CANNON.Vec3(-1, 0, 0),
        chassisConnectionPointLocal: new CANNON.Vec3(), // overwritten per wheel
        maxSuspensionForce: 100000,
        customSlidingRotationalSpeed: -30,
        useCustomSlidingRotationalSpeed: true,
    };

    WHEEL_POSITIONS.forEach(pos => {
        wheelOptions.chassisConnectionPointLocal.copy(pos);
        vehicle.addWheel(wheelOptions);
    });

    vehicle.addToWorld(world);

    // ── Visual chassis ───────────────────────────────────────────────
    carMesh = new THREE.Group();

    const bodyW = CHASSIS_HALF.x * 2;
    const bodyH = CHASSIS_HALF.y * 2;
    const bodyL = CHASSIS_HALF.z * 2;

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(bodyW, bodyH, bodyL),
        new THREE.MeshPhongMaterial({ color: 0xcc0000, shininess: 80, specular: 0x444444 }),
    );
    body.castShadow = true;
    carMesh.add(body);

    // Headlights
    const hlGeo = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    const hlMat = new THREE.MeshPhongMaterial({ color: 0xffffee, emissive: 0xaaaa66 });
    [-0.55, 0.55].forEach(x => {
        const hl = new THREE.Mesh(hlGeo, hlMat);
        hl.position.set(x, -0.05, bodyL / 2 + 0.03);
        carMesh.add(hl);
    });

    // Brake lights
    const blGeo = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    const blOffMat = new THREE.MeshPhongMaterial({ color: 0x660000, emissive: 0x220000 });
    const blOnMat = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 });
    brakeLightMats = { off: blOffMat, on: blOnMat };
    brakeLights = [];
    [-0.55, 0.55].forEach(x => {
        const bl = new THREE.Mesh(blGeo, blOffMat);
        bl.position.set(x, -0.05, -bodyL / 2 - 0.03);
        carMesh.add(bl);
        brakeLights.push(bl);
    });

    scene.add(carMesh);

    // ── Visual wheels (added to scene root, not car group) ───────────
    wheelMeshes = [];
    for (let i = 0; i < 4; i++) {
        const wg = new THREE.Group();

        // Tire cylinder
        const tire = new THREE.Mesh(
            new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.25, 16),
            new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 30 }),
        );
        tire.rotation.z = Math.PI / 2; // orient along x-axis
        wg.add(tire);

        // Rim
        const rim = new THREE.Mesh(
            new THREE.CylinderGeometry(WHEEL_RADIUS * 0.6, WHEEL_RADIUS * 0.6, 0.27, 8),
            new THREE.MeshPhongMaterial({ color: 0xaaaaaa, shininess: 100 }),
        );
        rim.rotation.z = Math.PI / 2;
        wg.add(rim);

        // Hub
        const hub = new THREE.Mesh(
            new THREE.CylinderGeometry(WHEEL_RADIUS * 0.2, WHEEL_RADIUS * 0.2, 0.29, 6),
            new THREE.MeshPhongMaterial({ color: 0x666666, shininess: 60 }),
        );
        hub.rotation.z = Math.PI / 2;
        wg.add(hub);

        wg.castShadow = true;
        scene.add(wg);
        wheelMeshes.push(wg);
    }

    return { chassisBody, vehicle };
}

// ── Apply controls (call BEFORE world.step) ─────────────────────────
export function applyCarControls(input) {
    if (!vehicle) return;

    const speed = chassisBody.velocity.length();

    // ── Steering (speed-sensitive) ───────────────────────────────────
    const steerDir = (input.left ? 1 : 0) + (input.right ? -1 : 0);
    const speedFactor = Math.max(0.3, 1 - Math.min(speed / 40, 1) * 0.6);
    const steer = steerDir * tuning.maxSteer * speedFactor;
    vehicle.setSteeringValue(steer, 0);
    vehicle.setSteeringValue(steer, 1);

    // ── Engine (rear-wheel drive) with speed-based power fade ────────
    const speedRatio = Math.min(speed / tuning.topSpeed, 1);
    const powerFade  = 1 - speedRatio * 0.9;   // 100% at rest → 10% at top speed
    let engineForce = 0;
    if (input.up)   engineForce = -tuning.engineForce * powerFade;     // negative = forward
    if (input.down)  engineForce =  tuning.engineForce * 0.6 * powerFade; // reverse weaker
    vehicle.applyEngineForce(engineForce, 2);
    vehicle.applyEngineForce(engineForce, 3);

    // ── Brakes ───────────────────────────────────────────────────────
    const braking = input.brake;
    const brakeVal = braking ? tuning.brakeForce : 0;
    for (let i = 0; i < 4; i++) vehicle.setBrake(brakeVal, i);

    // Brake lights
    const blMat = braking ? brakeLightMats.on : brakeLightMats.off;
    brakeLights.forEach(bl => { bl.material = blMat; });
}

// ── Sync visuals (call AFTER world.step) ─────────────────────────────
export function syncCarVisuals() {
    if (!vehicle) return;

    // ── Sync chassis visual ──────────────────────────────────────────
    carMesh.position.copy(chassisBody.position);
    carMesh.quaternion.copy(chassisBody.quaternion);

    // ── Sync wheel visuals ───────────────────────────────────────────
    for (let i = 0; i < 4; i++) {
        vehicle.updateWheelTransform(i);
        const t = vehicle.wheelInfos[i].worldTransform;
        wheelMeshes[i].position.copy(t.position);
        wheelMeshes[i].quaternion.copy(t.quaternion);
    }
}

// ── Reset car (optional spawn position / quaternion) ────────────────
export function resetCar(position, quaternion) {
    if (!chassisBody) return;
    if (position) {
        chassisBody.position.copy(position);
    } else {
        chassisBody.position.set(0, 2, 0);
    }
    chassisBody.velocity.setZero();
    chassisBody.angularVelocity.setZero();
    if (quaternion) {
        chassisBody.quaternion.copy(quaternion);
    } else {
        chassisBody.quaternion.set(0, 0, 0, 1);
    }
}

// ── Driving preset switcher ──────────────────────────────────────────
export function setDrivingPreset(name) {
    const preset = PRESETS[name];
    if (!preset) return;
    Object.assign(tuning, preset);

    // Apply to live chassis
    if (chassisBody) {
        chassisBody.angularDamping = tuning.angularDamping;
    }
    // Apply to live wheel infos
    if (vehicle) {
        for (let i = 0; i < vehicle.wheelInfos.length; i++) {
            const w = vehicle.wheelInfos[i];
            w.suspensionStiffness  = tuning.suspStiffness;
            w.dampingCompression   = tuning.dampComp;
            w.dampingRelaxation    = tuning.dampRel;
            w.frictionSlip         = tuning.frictionSlip;
            w.rollInfluence        = tuning.rollInfluence;
        }
    }
}

// ── Accessors for camera / HUD ───────────────────────────────────────
export function getChassisBody() { return chassisBody; }
export function getVehicle() { return vehicle; }

export function getSpeedMPH() {
    if (!chassisBody) return 0;
    return Math.round(chassisBody.velocity.length() * 2.237);
}
