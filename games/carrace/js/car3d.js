// 3D Player Car module with realistic 6DOF physics
const Car3D = {
    // World position (true 3D coordinates)
    position: { x: 0, y: 0, z: 0 },

    // 6DOF rotation (Euler angles in radians)
    rotation: { pitch: 0, yaw: 0, roll: 0 },

    // Linear velocity in world space
    velocity: { x: 0, y: 0, z: 0 },

    // Angular velocity (rotation rates)
    angularVelocity: { pitch: 0, yaw: 0, roll: 0 },

    // Track progress (for lap counting and AI reference)
    trackProgress: 0,
    laneOffset: 0,

    // 3D objects
    mesh: null,
    bodyMesh: null,
    wheelMeshes: [],
    brakeLights: [],
    chassisGroup: null,

    // Engine/drivetrain
    engineRPM: 800,
    throttle: 0,
    brake: 0,

    // Steering
    steerAngle: 0,
    steerInput: 0,
    wheelRotation: 0,
    isBraking: false,

    // Physics constants - tuned for realistic 4-wheel feel
    mass: 1400,                    // kg
    wheelBase: 2.8,                // Distance between front and rear axles (m)
    trackWidth: 1.6,               // Distance between left and right wheels (m)
    cgHeight: 0.4,                 // Center of gravity height (m)
    frontAxleFromCG: 1.3,          // Front axle distance from CG
    rearAxleFromCG: 1.5,           // Rear axle distance from CG (slightly rear-biased)

    // Engine/Drivetrain
    maxDriveForce: 8000,           // N - max force at wheels
    maxSpeed: 50,                  // m/s (~112 mph)
    engineBraking: 1500,           // N of engine braking when coasting

    // Braking
    maxBrakeForce: 20000,          // N total brake force
    brakeBalance: 0.6,             // 60% front brake bias

    // Steering
    maxSteerAngle: 0.5,            // ~28 degrees in radians
    steerSpeed: 4.0,               // How fast steering responds
    steerReturnSpeed: 6.0,         // How fast steering centers

    // Tire physics (Pacejka-simplified)
    tireGripFront: 1.1,            // Front tire grip coefficient
    tireGripRear: 1.15,            // Rear tire grip (slightly higher for stability)
    tireGripOffroad: 0.5,          // Reduced grip off track
    peakSlipAngle: 0.14,           // Slip angle at peak grip (~8 degrees)
    peakSlipRatio: 0.1,            // Slip ratio at peak traction (10%)

    // Cornering stiffness (force per radian of slip before saturation)
    corneringStiffnessFront: 45000,
    corneringStiffnessRear: 50000,

    // Suspension
    suspensionStiffness: 35000,    // N/m spring rate
    suspensionDamping: 3500,       // Ns/m damping coefficient
    suspensionTravel: 0.12,        // m max travel
    antiRollStiffness: 8000,       // Anti-roll bar stiffness
    suspensionOffset: [0, 0, 0, 0],
    suspensionVelocity: [0, 0, 0, 0],

    // Aerodynamics
    dragCoefficient: 0.35,
    frontalArea: 2.0,              // m^2

    // Dynamic state
    wheelAngularVel: [0, 0, 0, 0], // Wheel rotation speed (rad/s)
    wheelLoad: [0, 0, 0, 0],       // Normal force on each wheel
    slipAngle: [0, 0, 0, 0],       // Current slip angle per wheel
    slipRatio: [0, 0, 0, 0],       // Current slip ratio per wheel

    // Wheel positions relative to CG (local coordinates) - set in createCarMesh
    wheelPositions: [
        { x: -1.2, z: 1.5 },   // FL
        { x: 1.2, z: 1.5 },    // FR
        { x: -1.2, z: -1.5 },  // RL
        { x: 1.2, z: -1.5 }    // RR
    ],

    // Terrain state
    isOnTrack: true,
    groundHeight: 0,
    terrainNormal: { x: 0, y: 1, z: 0 },

    init(scene) {
        this.createCarMesh(scene);
        this.reset();
    },

    createCarMesh(scene) {
        // Main car group
        this.mesh = new THREE.Group();

        // Suspension/chassis group (for body roll/pitch)
        const chassisGroup = new THREE.Group();
        this.chassisGroup = chassisGroup;

        // --- SIMPLE BOX CAR BODY ---
        const bodyWidth = 2.0;
        const bodyHeight = 0.8;
        const bodyLength = 3.6;

        const bodyGeometry = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLength);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0xcc0000,
            shininess: 80,
            specular: 0x444444
        });
        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.position.y = 0.4 + bodyHeight / 2;
        this.bodyMesh.castShadow = true;
        chassisGroup.add(this.bodyMesh);

        // --- HEADLIGHTS (front face) ---
        const headlightGeom = new THREE.BoxGeometry(0.3, 0.15, 0.05);
        const headlightMat = new THREE.MeshPhongMaterial({
            color: 0xffffee,
            emissive: 0xaaaa66
        });
        [-0.6, 0.6].forEach(x => {
            const light = new THREE.Mesh(headlightGeom, headlightMat);
            light.position.set(x, 0.7, bodyLength / 2 + 0.03);
            chassisGroup.add(light);
        });

        // --- BRAKE LIGHTS (rear face) ---
        const brakeLightGeom = new THREE.BoxGeometry(0.3, 0.15, 0.05);
        const brakeLightOffMat = new THREE.MeshPhongMaterial({
            color: 0x660000,
            emissive: 0x220000
        });
        const brakeLightOnMat = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.8
        });
        this.brakeLightMaterials = { off: brakeLightOffMat, on: brakeLightOnMat };

        [-0.6, 0.6].forEach(x => {
            const brakeLight = new THREE.Mesh(brakeLightGeom, brakeLightOffMat);
            brakeLight.position.set(x, 0.7, -bodyLength / 2 - 0.03);
            chassisGroup.add(brakeLight);
            this.brakeLights.push(brakeLight);
        });

        // --- WHEELS AT CORNERS ---
        this.wheelMeshes = [];
        const wheelRadius = 0.35;
        const wheelWidth = 0.25;

        // Wheel positions at corners of the box
        const wheelX = bodyWidth / 2 + wheelWidth / 2 + 0.05;
        const wheelZ = bodyLength / 2 - 0.3;

        const wheelPositions = [
            { x: -wheelX, z: wheelZ, name: 'FL' },
            { x: wheelX, z: wheelZ, name: 'FR' },
            { x: -wheelX, z: -wheelZ, name: 'RL' },
            { x: wheelX, z: -wheelZ, name: 'RR' }
        ];

        // Update physics wheel positions to match visual
        this.wheelPositions = [
            { x: -wheelX, z: wheelZ },
            { x: wheelX, z: wheelZ },
            { x: -wheelX, z: -wheelZ },
            { x: wheelX, z: -wheelZ }
        ];

        wheelPositions.forEach((pos, i) => {
            const wheelGroup = new THREE.Group();

            // Tire (cylinder)
            const tireGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
            const tireMaterial = new THREE.MeshPhongMaterial({
                color: 0x1a1a1a,
                shininess: 30
            });
            const tire = new THREE.Mesh(tireGeometry, tireMaterial);
            tire.rotation.z = Math.PI / 2;
            wheelGroup.add(tire);

            // Rim (visible on outside)
            const rimGeometry = new THREE.CylinderGeometry(wheelRadius * 0.6, wheelRadius * 0.6, wheelWidth + 0.02, 8);
            const rimMaterial = new THREE.MeshPhongMaterial({
                color: 0xaaaaaa,
                shininess: 100
            });
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            rim.rotation.z = Math.PI / 2;
            wheelGroup.add(rim);

            // Hub
            const hubGeometry = new THREE.CylinderGeometry(wheelRadius * 0.2, wheelRadius * 0.2, wheelWidth + 0.04, 6);
            const hubMaterial = new THREE.MeshPhongMaterial({
                color: 0x666666,
                shininess: 60
            });
            const hub = new THREE.Mesh(hubGeometry, hubMaterial);
            hub.rotation.z = Math.PI / 2;
            wheelGroup.add(hub);

            wheelGroup.position.set(pos.x, wheelRadius, pos.z);
            wheelGroup.castShadow = true;

            this.mesh.add(wheelGroup);
            this.wheelMeshes.push(wheelGroup);
        });

        // Add chassis to main mesh
        this.mesh.add(chassisGroup);
        scene.add(this.mesh);
    },

    reset() {
        // Get starting position from track
        const startPos = Track.getPointAt(0);
        const startTangent = Track.getTangentAt(0);

        // Start on flat ground (Environment.groundY) with wheel clearance
        const groundY = (typeof Environment !== 'undefined') ? Environment.groundY : 0;
        const startHeight = groundY + 0.5;

        this.position = { x: startPos.x, y: startHeight, z: startPos.z };
        this.rotation = { pitch: 0, yaw: Math.atan2(startTangent.x, startTangent.z), roll: 0 };

        this.velocity = { x: 0, y: 0, z: 0 };
        this.angularVelocity = { pitch: 0, yaw: 0, roll: 0 };

        this.trackProgress = 0;
        this.laneOffset = 0;

        this.engineRPM = 800;
        this.throttle = 0;
        this.brake = 0;

        this.steerAngle = 0;
        this.steerInput = 0;
        this.wheelRotation = 0;
        this.isBraking = false;

        this.suspensionOffset = [0, 0, 0, 0];
        this.suspensionVelocity = [0, 0, 0, 0];

        this.wheelAngularVel = [0, 0, 0, 0];
        this.wheelLoad = [this.mass * 9.81 / 4, this.mass * 9.81 / 4, this.mass * 9.81 / 4, this.mass * 9.81 / 4];
        this.slipAngle = [0, 0, 0, 0];
        this.slipRatio = [0, 0, 0, 0];

        this.isOnTrack = true;
        this.groundHeight = groundY;
        this.terrainNormal = { x: 0, y: 1, z: 0 };
    },

    update(dt, input) {
        // Clamp dt to prevent physics explosion
        dt = Math.min(dt, 0.033);

        // --- INPUT PROCESSING ---
        this.throttle = input.keys.up ? 1.0 : 0;
        this.brake = input.keys.down ? 1.0 : 0;
        this.isBraking = this.brake > 0;
        this.steerInput = (input.keys.left ? -1 : 0) + (input.keys.right ? 1 : 0);

        // --- STEERING ---
        // Speed-sensitive steering (less responsive at high speed)
        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
        const speedFactor = Math.max(0.3, 1 - speed / this.maxSpeed * 0.5);
        const targetSteer = this.steerInput * this.maxSteerAngle * speedFactor;

        // Steering with different rates for turning vs centering
        if (this.steerInput !== 0) {
            const steerDelta = targetSteer - this.steerAngle;
            this.steerAngle += steerDelta * Math.min(1, this.steerSpeed * dt);
        } else {
            // Self-centering steering
            this.steerAngle *= Math.max(0, 1 - this.steerReturnSpeed * dt);
        }

        // --- CAR COORDINATE SYSTEM ---
        const cosYaw = Math.cos(this.rotation.yaw);
        const sinYaw = Math.sin(this.rotation.yaw);
        const forwardDir = { x: sinYaw, z: cosYaw };
        const rightDir = { x: cosYaw, z: -sinYaw };

        // Local velocity (car's reference frame)
        const localVelX = this.velocity.x * rightDir.x + this.velocity.z * rightDir.z;  // Lateral (+ = right)
        const localVelZ = this.velocity.x * forwardDir.x + this.velocity.z * forwardDir.z;  // Longitudinal (+ = forward)

        // --- TERRAIN/GROUND DETECTION ---
        this.updateTerrainContact();
        const gripMultiplier = this.isOnTrack ? 1.0 : (this.tireGripOffroad / this.tireGripFront);

        // --- CALCULATE WHEEL LOADS (weight transfer) ---
        const gravity = 9.81;
        const totalWeight = this.mass * gravity;

        // Static weight distribution (slightly rear-biased)
        const frontStaticLoad = totalWeight * this.rearAxleFromCG / this.wheelBase;
        const rearStaticLoad = totalWeight * this.frontAxleFromCG / this.wheelBase;

        // Longitudinal weight transfer from acceleration
        const longAccel = (this.throttle * this.maxDriveForce - this.brake * this.maxBrakeForce) / this.mass;
        const longTransfer = this.mass * longAccel * this.cgHeight / this.wheelBase;

        // Lateral weight transfer from cornering
        const lateralAccel = localVelZ * this.angularVelocity.yaw;
        const latTransfer = this.mass * lateralAccel * this.cgHeight / this.trackWidth;

        // Calculate individual wheel loads
        this.wheelLoad[0] = Math.max(100, (frontStaticLoad / 2) - longTransfer / 2 + latTransfer / 2);  // FL
        this.wheelLoad[1] = Math.max(100, (frontStaticLoad / 2) - longTransfer / 2 - latTransfer / 2);  // FR
        this.wheelLoad[2] = Math.max(100, (rearStaticLoad / 2) + longTransfer / 2 + latTransfer / 2);   // RL
        this.wheelLoad[3] = Math.max(100, (rearStaticLoad / 2) + longTransfer / 2 - latTransfer / 2);   // RR

        // --- TIRE FORCES ---
        let totalForceX = 0;
        let totalForceZ = 0;
        let yawTorque = 0;

        for (let i = 0; i < 4; i++) {
            const wheelPos = this.wheelPositions[i];
            const isFront = i < 2;
            const isLeft = i % 2 === 0;

            // Wheel position relative to CG in world coords
            const wheelWorldX = wheelPos.x * rightDir.x + wheelPos.z * forwardDir.x;
            const wheelWorldZ = wheelPos.x * rightDir.z + wheelPos.z * forwardDir.z;

            // Wheel velocity (including rotation around CG)
            const wheelVelX = this.velocity.x - this.angularVelocity.yaw * wheelPos.z * cosYaw - this.angularVelocity.yaw * wheelPos.x * sinYaw;
            const wheelVelZ = this.velocity.z + this.angularVelocity.yaw * wheelPos.z * sinYaw - this.angularVelocity.yaw * wheelPos.x * cosYaw;

            // Wheel direction (steered for front wheels)
            let wheelYaw = this.rotation.yaw;
            if (isFront) {
                // Ackermann-ish steering (inner wheel turns more)
                const ackermann = isLeft ? 1.05 : 0.95;
                wheelYaw += this.steerAngle * ackermann;
            }

            const wheelForward = { x: Math.sin(wheelYaw), z: Math.cos(wheelYaw) };
            const wheelRight = { x: Math.cos(wheelYaw), z: -Math.sin(wheelYaw) };

            // Local wheel velocity
            const wheelLocalVelX = wheelVelX * wheelRight.x + wheelVelZ * wheelRight.z;  // Lateral
            const wheelLocalVelZ = wheelVelX * wheelForward.x + wheelVelZ * wheelForward.z;  // Longitudinal

            const wheelSpeed = Math.sqrt(wheelLocalVelX ** 2 + wheelLocalVelZ ** 2);

            // --- SLIP ANGLE (lateral slip) ---
            let slipAngle = 0;
            if (wheelSpeed > 0.5) {
                slipAngle = Math.atan2(-wheelLocalVelX, Math.abs(wheelLocalVelZ));
            } else if (speed < 0.5 && Math.abs(this.steerAngle) > 0.01) {
                // Low speed steering - use geometric slip
                slipAngle = isFront ? -this.steerAngle * 0.5 : 0;
            }
            this.slipAngle[i] = slipAngle;

            // --- SLIP RATIO (longitudinal slip) ---
            const wheelRadius = 0.35;
            const wheelAngularSpeed = this.wheelAngularVel[i] * wheelRadius;
            let slipRatio = 0;
            if (wheelSpeed > 0.5) {
                slipRatio = (wheelAngularSpeed - wheelLocalVelZ) / Math.max(Math.abs(wheelLocalVelZ), 0.5);
                slipRatio = Math.max(-1, Math.min(1, slipRatio));
            }
            this.slipRatio[i] = slipRatio;

            // --- TIRE FORCE MODEL (simplified Pacejka-like) ---
            const load = this.wheelLoad[i];
            const grip = isFront ? this.tireGripFront : this.tireGripRear;
            const maxForce = load * grip * gripMultiplier;

            // Lateral force (cornering)
            const corneringStiffness = isFront ? this.corneringStiffnessFront : this.corneringStiffnessRear;
            const normalizedSlip = slipAngle / this.peakSlipAngle;
            // Magic formula approximation: rises linearly then saturates
            const lateralForceFactor = Math.sin(Math.atan(normalizedSlip * 1.9)) * 1.05;
            let lateralForce = corneringStiffness * this.peakSlipAngle * lateralForceFactor * (load / (this.mass * gravity / 4));
            lateralForce = Math.max(-maxForce, Math.min(maxForce, lateralForce));

            // Longitudinal force (traction/braking)
            let longitudinalForce = 0;

            // Drive force (rear wheels only - RWD)
            if (!isFront && this.throttle > 0) {
                const driveForce = this.throttle * this.maxDriveForce * 0.5;  // Split between two rear wheels
                // Traction limit based on slip ratio
                const tractionFactor = 1 - Math.abs(slipRatio) * 0.5;
                longitudinalForce += driveForce * tractionFactor;
            }

            // Brake force (all wheels with bias)
            if (this.brake > 0 && speed > 0.3) {
                const brakeBias = isFront ? this.brakeBalance : (1 - this.brakeBalance);
                const brakeForce = this.brake * this.maxBrakeForce * brakeBias * 0.5;
                longitudinalForce -= brakeForce * Math.sign(wheelLocalVelZ);
            }

            // Engine braking (rear wheels)
            if (!isFront && this.throttle === 0 && this.brake === 0 && speed > 1) {
                longitudinalForce -= this.engineBraking * 0.5 * Math.sign(wheelLocalVelZ);
            }

            // --- FRICTION CIRCLE (combined slip) ---
            const combinedForce = Math.sqrt(lateralForce ** 2 + longitudinalForce ** 2);
            if (combinedForce > maxForce) {
                const scale = maxForce / combinedForce;
                lateralForce *= scale;
                longitudinalForce *= scale;
            }

            // --- UPDATE WHEEL ANGULAR VELOCITY ---
            const wheelInertia = 10;  // kg*m^2
            const wheelTorque = -longitudinalForce * wheelRadius;
            this.wheelAngularVel[i] += (wheelTorque / wheelInertia) * dt;
            // Sync wheel speed with ground speed when not slipping much
            const targetAngularVel = wheelLocalVelZ / wheelRadius;
            this.wheelAngularVel[i] += (targetAngularVel - this.wheelAngularVel[i]) * 0.1;

            // --- CONVERT TO WORLD FORCES ---
            const forceWorldX = wheelForward.x * longitudinalForce + wheelRight.x * lateralForce;
            const forceWorldZ = wheelForward.z * longitudinalForce + wheelRight.z * lateralForce;

            totalForceX += forceWorldX;
            totalForceZ += forceWorldZ;

            // Yaw torque from this wheel (moment arm from CG)
            yawTorque += wheelWorldX * forceWorldZ - wheelWorldZ * forceWorldX;
        }

        // --- AERODYNAMIC DRAG ---
        const airDensity = 1.225;
        const dragForce = 0.5 * airDensity * this.dragCoefficient * this.frontalArea * speed * speed;
        if (speed > 0.1) {
            totalForceX -= dragForce * (this.velocity.x / speed);
            totalForceZ -= dragForce * (this.velocity.z / speed);
        }

        // --- ROLLING RESISTANCE ---
        const rollingResistance = 0.012 * this.mass * gravity;
        if (speed > 0.1) {
            totalForceX -= rollingResistance * (this.velocity.x / speed);
            totalForceZ -= rollingResistance * (this.velocity.z / speed);
        }

        // --- LOW SPEED DAMPING (prevents jitter) ---
        if (speed < 0.5 && this.throttle === 0) {
            this.velocity.x *= 0.95;
            this.velocity.z *= 0.95;
            this.angularVelocity.yaw *= 0.9;
        }

        // --- APPLY FORCES ---
        this.velocity.x += (totalForceX / this.mass) * dt;
        this.velocity.z += (totalForceZ / this.mass) * dt;

        // --- YAW DYNAMICS ---
        // Moment of inertia for yaw rotation
        const yawInertia = this.mass * (this.wheelBase * this.wheelBase + this.trackWidth * this.trackWidth) / 12;
        this.angularVelocity.yaw += (yawTorque / yawInertia) * dt;

        // Yaw damping (simulates tire scrub and mechanical friction)
        this.angularVelocity.yaw *= 0.985;

        // --- UPDATE POSITION ---
        this.position.x += this.velocity.x * dt;
        this.position.z += this.velocity.z * dt;
        this.rotation.yaw += this.angularVelocity.yaw * dt;

        // --- VERTICAL PHYSICS (SUSPENSION) ---
        this.updateSuspension(dt);

        // --- BODY ROLL/PITCH ---
        // Roll from suspension difference (left vs right)
        const leftSuspAvg = (this.suspensionOffset[0] + this.suspensionOffset[2]) / 2;
        const rightSuspAvg = (this.suspensionOffset[1] + this.suspensionOffset[3]) / 2;
        const rollFromSusp = (leftSuspAvg - rightSuspAvg) * 0.8;

        // Pitch from suspension difference (front vs rear)
        const frontSuspAvg = (this.suspensionOffset[0] + this.suspensionOffset[1]) / 2;
        const rearSuspAvg = (this.suspensionOffset[2] + this.suspensionOffset[3]) / 2;
        const pitchFromSusp = (frontSuspAvg - rearSuspAvg) * 0.5;

        // Add acceleration-based body movement
        const targetRoll = rollFromSusp - lateralAccel * 0.012;
        const targetPitch = pitchFromSusp + longAccel * 0.006;

        // Smooth body movement
        this.rotation.roll += (targetRoll - this.rotation.roll) * Math.min(1, 12 * dt);
        this.rotation.pitch += (targetPitch - this.rotation.pitch) * Math.min(1, 12 * dt);

        // Clamp body angles
        this.rotation.roll = Math.max(-0.15, Math.min(0.15, this.rotation.roll));
        this.rotation.pitch = Math.max(-0.1, Math.min(0.1, this.rotation.pitch));

        // --- UPDATE TRACK PROGRESS ---
        this.updateTrackProgress();

        // --- CHECK FOR FALL BELOW GROUND - RESET ---
        if (this.position.y < Environment.groundY - 5) {
            this.reset();
            return;
        }

        // --- UPDATE VISUALS ---
        this.updateMeshPosition(dt);
        this.updateWheels(dt, speed);
        this.updateBrakeLights();
    },

    updateTerrainContact() {
        // Ground is now a flat plane from Environment
        this.groundHeight = Environment.groundY;
        this.terrainNormal = { x: 0, y: 1, z: 0 };

        // Check if car is on track or off-road
        const halfTrackWidth = Track.trackWidth / 2;

        // Find closest point on track
        let closestT = 0;
        let closestDist = Infinity;

        for (let t = 0; t < 1; t += 0.01) {
            const trackPoint = Track.getPointAt(t);
            const dx = this.position.x - trackPoint.x;
            const dz = this.position.z - trackPoint.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < closestDist) {
                closestDist = dist;
                closestT = t;
            }
        }

        // Refine search
        for (let t = closestT - 0.01; t <= closestT + 0.01; t += 0.001) {
            const trackPoint = Track.getPointAt(t);
            const dx = this.position.x - trackPoint.x;
            const dz = this.position.z - trackPoint.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < closestDist) {
                closestDist = dist;
                closestT = t;
            }
        }

        // Determine if on track (within track width)
        this.isOnTrack = closestDist < halfTrackWidth;

        // Calculate lane offset for track progress
        const trackPoint = Track.getPointAt(closestT);
        const tangent = Track.getTangentAt(closestT);
        const right = { x: tangent.z, z: -tangent.x };
        const toCarX = this.position.x - trackPoint.x;
        const toCarZ = this.position.z - trackPoint.z;
        this.laneOffset = toCarX * right.x + toCarZ * right.z;

        this.trackProgress = closestT;
    },

    updateSuspension(dt) {
        const wheelRadius = 0.35;
        const gravity = 9.81;
        const groundY = this.groundHeight;

        // Target ride height
        const rideHeight = wheelRadius + 0.25;

        for (let i = 0; i < 4; i++) {
            const wheelPos = this.wheelPositions[i];

            // Body height at wheel position (accounting for roll/pitch)
            const rollOffset = wheelPos.x * Math.sin(this.rotation.roll);
            const pitchOffset = wheelPos.z * Math.sin(this.rotation.pitch);
            const bodyHeightAtWheel = this.position.y + rollOffset + pitchOffset;

            // Desired wheel contact point
            const wheelContactY = groundY;

            // Current suspension compression
            const currentLength = bodyHeightAtWheel - wheelContactY;
            const restLength = rideHeight;
            const compression = restLength - currentLength;

            // Spring force (progressive spring rate)
            const normalizedComp = compression / this.suspensionTravel;
            const progressiveFactor = 1 + Math.abs(normalizedComp) * 0.5;
            const springForce = compression * this.suspensionStiffness * progressiveFactor;

            // Damping force (higher compression damping)
            const dampingMultiplier = this.suspensionVelocity[i] > 0 ? 1.2 : 1.0;
            const dampingForce = -this.suspensionVelocity[i] * this.suspensionDamping * dampingMultiplier;

            // Anti-roll bar effect (reduces body roll)
            const isLeft = i % 2 === 0;
            const pairIndex = isLeft ? i + 1 : i - 1;
            const rollDiff = this.suspensionOffset[i] - this.suspensionOffset[pairIndex];
            const antiRollForce = -rollDiff * this.antiRollStiffness;

            // Total force on this corner
            const totalForce = springForce + dampingForce + antiRollForce;

            // Update suspension velocity and position
            const cornerMass = this.mass / 4;
            const suspAccel = totalForce / cornerMass;
            this.suspensionVelocity[i] += suspAccel * dt;
            this.suspensionVelocity[i] *= 0.98;  // Damping
            this.suspensionOffset[i] += this.suspensionVelocity[i] * dt;

            // Clamp suspension travel
            this.suspensionOffset[i] = Math.max(-this.suspensionTravel, Math.min(this.suspensionTravel, this.suspensionOffset[i]));
        }

        // Keep car at proper ride height
        const avgSuspension = (this.suspensionOffset[0] + this.suspensionOffset[1] +
                               this.suspensionOffset[2] + this.suspensionOffset[3]) / 4;
        const targetHeight = groundY + rideHeight - avgSuspension * 0.3;

        // Smoothly adjust height
        const heightError = targetHeight - this.position.y;
        this.position.y += heightError * Math.min(1, 15 * dt);

        // Hard floor constraint
        const minHeight = groundY + wheelRadius + 0.05;
        if (this.position.y < minHeight) {
            this.position.y = minHeight;
            if (this.velocity.y < 0) {
                this.velocity.y = 0;
            }
        }
    },

    updateTrackProgress() {
        // Track progress is updated in updateTerrainContact
        // Wrap around
        if (this.trackProgress >= 1) this.trackProgress -= 1;
        if (this.trackProgress < 0) this.trackProgress += 1;
    },

    updateMeshPosition(dt) {
        // Set mesh position directly from physics state
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);

        // Set rotation from physics state (yaw, pitch, roll)
        this.mesh.rotation.order = 'YXZ';
        this.mesh.rotation.y = this.rotation.yaw;
        this.mesh.rotation.x = -this.rotation.pitch;
        this.mesh.rotation.z = this.rotation.roll;

        // Apply additional body dynamics to chassis group
        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);

        // Subtle vibration at speed
        if (speed > 2) {
            const vibrationIntensity = Math.min(speed / this.maxSpeed, 1) * 0.003;
            const vibration = (Math.random() - 0.5) * vibrationIntensity;
            this.chassisGroup.position.y = vibration;

            // Off-road produces more vibration
            if (!this.isOnTrack) {
                this.chassisGroup.position.y += (Math.random() - 0.5) * 0.02;
                this.chassisGroup.position.x = (Math.random() - 0.5) * 0.01;
            }
        } else {
            this.chassisGroup.position.y = 0;
        }
    },

    updateWheels(dt, speed) {
        const wheelRadius = 0.35;

        this.wheelMeshes.forEach((wheel, i) => {
            // Update wheel rotation based on individual wheel angular velocity
            this.wheelRotation = (this.wheelRotation || 0) + this.wheelAngularVel[i] * dt;

            // Wheel spin (rotate around the axle axis)
            const rotation = this.wheelAngularVel[i] * dt;
            wheel.children[0].rotation.x += rotation;
            wheel.children[1].rotation.x += rotation;
            wheel.children[2].rotation.x += rotation;

            // Front wheel steering with Ackermann
            if (i < 2) {
                const isLeft = i % 2 === 0;
                const ackermann = isLeft ? 1.05 : 0.95;
                wheel.rotation.y = this.steerAngle * ackermann;
            }

            // Wheel position based on suspension
            const baseY = wheelRadius;
            wheel.position.y = baseY - this.suspensionOffset[i] * 0.3;

            // Wheel positions
            const wheelPos = this.wheelPositions[i];
            wheel.position.x = wheelPos.x;
            wheel.position.z = wheelPos.z;
        });
    },

    updateBrakeLights() {
        const material = this.isBraking ? this.brakeLightMaterials.on : this.brakeLightMaterials.off;
        this.brakeLights.forEach(light => {
            light.material = material;
        });
    },

    getSpeedMPH() {
        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
        // Convert m/s to MPH (1 m/s = 2.237 mph)
        return Math.round(speed * 2.237);
    },

    getSpeed() {
        return Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
    },

    getPosition() {
        return this.mesh.position.clone();
    },

    // Check if car is off the track (for UI feedback)
    isOffTrack() {
        return !this.isOnTrack;
    }
};

// AI Traffic Cars - improved visuals
const Traffic3D = {
    cars: [],
    maxCars: 8,
    colors: [
        { main: 0x0066cc, dark: 0x004488 },
        { main: 0x00aa44, dark: 0x007733 },
        { main: 0xddaa00, dark: 0xaa7700 },
        { main: 0x9933cc, dark: 0x662299 },
        { main: 0xff6622, dark: 0xcc4411 },
        { main: 0x44aaaa, dark: 0x337777 }
    ],

    init(scene) {
        this.scene = scene;
        this.cars = [];
        this.spawnCars();
    },

    spawnCars() {
        for (let i = 0; i < this.maxCars; i++) {
            const car = this.createTrafficCar();
            car.trackProgress = i / this.maxCars;
            car.laneOffset = (Math.random() - 0.5) * 14;
            car.speed = 0.02 + Math.random() * 0.02;
            car.bodyRoll = 0;
            this.cars.push(car);
        }
    },

    createTrafficCar() {
        const colorSet = this.colors[Math.floor(Math.random() * this.colors.length)];
        const carGroup = new THREE.Group();
        const chassisGroup = new THREE.Group();

        // Car body
        const bodyGeom = new THREE.BoxGeometry(2.0, 0.9, 4.2);
        const bodyMat = new THREE.MeshPhongMaterial({
            color: colorSet.main,
            shininess: 80
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 0.7;
        body.castShadow = true;
        chassisGroup.add(body);

        // Cabin
        const cabinGeom = new THREE.BoxGeometry(1.8, 0.6, 1.8);
        const cabinMat = new THREE.MeshPhongMaterial({
            color: 0x222222,
            shininess: 60
        });
        const cabin = new THREE.Mesh(cabinGeom, cabinMat);
        cabin.position.set(0, 1.3, -0.2);
        chassisGroup.add(cabin);

        // Windows
        const windowMat = new THREE.MeshPhongMaterial({
            color: 0x88aacc,
            transparent: true,
            opacity: 0.5
        });
        const windowGeom = new THREE.PlaneGeometry(1.6, 0.5);
        const frontWindow = new THREE.Mesh(windowGeom, windowMat);
        frontWindow.position.set(0, 1.2, 0.65);
        frontWindow.rotation.x = -0.3;
        chassisGroup.add(frontWindow);

        // Wheels
        const wheelGeom = new THREE.TorusGeometry(0.28, 0.1, 8, 16);
        const wheelMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });

        [[-0.9, 1.3], [0.9, 1.3], [-0.9, -1.3], [0.9, -1.3]].forEach(([x, z]) => {
            const wheel = new THREE.Mesh(wheelGeom, wheelMat);
            wheel.rotation.y = Math.PI / 2;
            wheel.position.set(x, 0.28, z);
            carGroup.add(wheel);
        });

        carGroup.add(chassisGroup);
        this.scene.add(carGroup);

        return {
            mesh: carGroup,
            chassis: chassisGroup,
            trackProgress: 0,
            laneOffset: 0,
            speed: 0.03,
            bodyRoll: 0
        };
    },

    update(dt) {
        this.cars.forEach(car => {
            // Move along track
            car.trackProgress += car.speed * dt;
            if (car.trackProgress >= 1) car.trackProgress -= 1;

            // Sample road at front and rear for pitch calculation
            const wheelBase = 2.6;
            const trackProgressPerUnit = 1 / Track.trackLength;
            const frontOffset = wheelBase * 0.5 * trackProgressPerUnit * 50;
            const rearOffset = -wheelBase * 0.5 * trackProgressPerUnit * 50;

            const frontSurface = Track.getRoadSurface(car.trackProgress + frontOffset, car.laneOffset);
            const centerSurface = Track.getRoadSurface(car.trackProgress, car.laneOffset);
            const rearSurface = Track.getRoadSurface(car.trackProgress + rearOffset, car.laneOffset);

            // Update position on road surface
            car.mesh.position.copy(centerSurface.position);
            car.mesh.position.y += 0.28;

            // Calculate pitch from height difference
            const heightDiff = frontSurface.position.y - rearSurface.position.y;
            const pitch = Math.atan2(heightDiff, wheelBase);

            // Orient along track
            const lookTarget = centerSurface.position.clone().add(centerSurface.tangent.clone().multiplyScalar(5));
            lookTarget.y = car.mesh.position.y;
            car.mesh.lookAt(lookTarget);

            // Apply road banking and calculated pitch
            car.mesh.rotation.z = centerSurface.banking * 0.8;
            car.mesh.rotation.x = -pitch;

            // Calculate body roll from turning (steering dynamics)
            const t = car.trackProgress;
            const tangent = Track.getTangentAt(t);
            const nextTangent = Track.getTangentAt((t + 0.01) % 1);
            const curvature = tangent.angleTo(nextTangent);
            const turnDirection = tangent.clone().cross(nextTangent).y > 0 ? 1 : -1;

            const targetRoll = -turnDirection * curvature * car.speed * 30;
            car.bodyRoll += (targetRoll - car.bodyRoll) * 0.1;
            car.chassis.rotation.z = car.bodyRoll;
        });
    },

    checkCollisions(playerProgress, playerLane) {
        for (const car of this.cars) {
            const progressDiff = Math.abs(car.trackProgress - playerProgress);
            const laneDiff = Math.abs(car.laneOffset - playerLane);

            if (progressDiff < 0.004 && laneDiff < 2.5) {
                return car;
            }
        }
        return null;
    },

    reset() {
        this.cars.forEach(car => this.scene.remove(car.mesh));
        this.cars = [];
        this.spawnCars();
    }
};
