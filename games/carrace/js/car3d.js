// 3D Player Car module with realistic physics
const Car3D = {
    // Track position (0-1 around the track)
    trackProgress: 0,

    // Lane position (-1 to 1, where 0 is center)
    laneOffset: 0,

    // Speed and velocity
    speed: 0,
    targetSpeed: 0,

    // 3D objects
    mesh: null,
    bodyMesh: null,
    wheelMeshes: [],
    brakeLights: [],

    // Physics constants
    maxSpeed: 0.08,
    acceleration: 0.025,
    braking: 0.08,
    deceleration: 0.008,
    steeringSpeed: 10,
    maxLaneOffset: 9,

    // Realistic physics state
    velocity: { x: 0, z: 0 },
    angularVelocity: 0,
    bodyRoll: 0,
    bodyPitch: 0,
    suspensionOffset: [0, 0, 0, 0], // FL, FR, RL, RR
    steerAngle: 0,
    wheelRotation: 0,
    isBraking: false,

    // Physics tuning
    mass: 1200,
    grip: 0.85,
    suspensionStiffness: 0.15,
    suspensionDamping: 0.85,
    bodyRollFactor: 0.12,
    bodyPitchFactor: 0.05,
    inertiaDamping: 0.92,

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

        // --- CAR BODY ---
        // Main body shape - more realistic sports car proportions
        const bodyShape = new THREE.Shape();
        bodyShape.moveTo(-1.1, 0);
        bodyShape.lineTo(-1.1, 0.6);
        bodyShape.lineTo(-0.9, 0.9);
        bodyShape.lineTo(0.8, 0.9);
        bodyShape.lineTo(1.1, 0.6);
        bodyShape.lineTo(1.1, 0);
        bodyShape.lineTo(-1.1, 0);

        const bodyExtrudeSettings = { depth: 4.2, bevelEnabled: false };
        const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, bodyExtrudeSettings);
        bodyGeometry.rotateX(Math.PI / 2);
        bodyGeometry.translate(0, 0, 2.1);

        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0xcc0000,
            shininess: 100,
            specular: 0x444444
        });
        this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.bodyMesh.position.y = 0.45;
        this.bodyMesh.castShadow = true;
        chassisGroup.add(this.bodyMesh);

        // Hood (sloped)
        const hoodGeometry = new THREE.BoxGeometry(2.0, 0.15, 1.8);
        const hood = new THREE.Mesh(hoodGeometry, bodyMaterial);
        hood.position.set(0, 1.0, 1.4);
        hood.rotation.x = -0.1;
        hood.castShadow = true;
        chassisGroup.add(hood);

        // Roof
        const roofGeometry = new THREE.BoxGeometry(1.8, 0.12, 1.4);
        const roof = new THREE.Mesh(roofGeometry, bodyMaterial);
        roof.position.set(0, 1.45, -0.3);
        roof.castShadow = true;
        chassisGroup.add(roof);

        // Windshield
        const windshieldGeometry = new THREE.PlaneGeometry(1.7, 0.8);
        const windshieldMaterial = new THREE.MeshPhongMaterial({
            color: 0x88aacc,
            transparent: true,
            opacity: 0.6,
            shininess: 200,
            side: THREE.DoubleSide
        });
        const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
        windshield.position.set(0, 1.25, 0.55);
        windshield.rotation.x = -0.45;
        chassisGroup.add(windshield);

        // Rear windshield
        const rearWindshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
        rearWindshield.position.set(0, 1.25, -1.1);
        rearWindshield.rotation.x = 0.45;
        chassisGroup.add(rearWindshield);

        // Side windows
        const sideWindowGeom = new THREE.PlaneGeometry(1.2, 0.5);
        const leftWindow = new THREE.Mesh(sideWindowGeom, windshieldMaterial);
        leftWindow.position.set(-1.05, 1.2, -0.3);
        leftWindow.rotation.y = Math.PI / 2;
        chassisGroup.add(leftWindow);
        const rightWindow = new THREE.Mesh(sideWindowGeom, windshieldMaterial);
        rightWindow.position.set(1.05, 1.2, -0.3);
        rightWindow.rotation.y = -Math.PI / 2;
        chassisGroup.add(rightWindow);

        // Spoiler
        const spoilerWingGeom = new THREE.BoxGeometry(2.2, 0.08, 0.4);
        const spoilerMat = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 80 });
        const spoilerWing = new THREE.Mesh(spoilerWingGeom, spoilerMat);
        spoilerWing.position.set(0, 1.55, -2.0);
        chassisGroup.add(spoilerWing);

        // Spoiler supports
        const supportGeom = new THREE.BoxGeometry(0.08, 0.35, 0.08);
        [-0.8, 0.8].forEach(x => {
            const support = new THREE.Mesh(supportGeom, spoilerMat);
            support.position.set(x, 1.35, -2.0);
            chassisGroup.add(support);
        });

        // --- HEADLIGHTS ---
        const headlightGeom = new THREE.CircleGeometry(0.15, 16);
        const headlightMat = new THREE.MeshPhongMaterial({
            color: 0xffffee,
            emissive: 0x666644,
            shininess: 100
        });
        [-0.6, 0.6].forEach(x => {
            const light = new THREE.Mesh(headlightGeom, headlightMat);
            light.position.set(x, 0.7, 2.11);
            chassisGroup.add(light);
        });

        // --- BRAKE LIGHTS ---
        const brakeLightGeom = new THREE.BoxGeometry(0.3, 0.1, 0.05);
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

        [-0.7, 0.7].forEach(x => {
            const brakeLight = new THREE.Mesh(brakeLightGeom, brakeLightOffMat);
            brakeLight.position.set(x, 0.85, -2.11);
            chassisGroup.add(brakeLight);
            this.brakeLights.push(brakeLight);
        });

        // --- WHEELS ---
        this.wheelMeshes = [];
        const wheelPositions = [
            { x: -1.0, z: 1.4, name: 'FL' },
            { x: 1.0, z: 1.4, name: 'FR' },
            { x: -1.0, z: -1.5, name: 'RL' },
            { x: 1.0, z: -1.5, name: 'RR' }
        ];

        wheelPositions.forEach((pos, i) => {
            const wheelGroup = new THREE.Group();

            // Tire
            const tireGeometry = new THREE.TorusGeometry(0.32, 0.12, 8, 24);
            const tireMaterial = new THREE.MeshPhongMaterial({
                color: 0x1a1a1a,
                shininess: 30
            });
            const tire = new THREE.Mesh(tireGeometry, tireMaterial);
            tire.rotation.y = Math.PI / 2;
            wheelGroup.add(tire);

            // Rim
            const rimGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.15, 6);
            const rimMaterial = new THREE.MeshPhongMaterial({
                color: 0xcccccc,
                shininess: 100
            });
            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            rim.rotation.z = Math.PI / 2;
            wheelGroup.add(rim);

            // Hub cap
            const hubGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.18, 8);
            const hubMaterial = new THREE.MeshPhongMaterial({
                color: 0x888888,
                shininess: 80
            });
            const hub = new THREE.Mesh(hubGeometry, hubMaterial);
            hub.rotation.z = Math.PI / 2;
            wheelGroup.add(hub);

            wheelGroup.position.set(pos.x, 0.32, pos.z);
            wheelGroup.castShadow = true;

            this.mesh.add(wheelGroup);
            this.wheelMeshes.push(wheelGroup);
        });

        // Add chassis to main mesh
        this.mesh.add(chassisGroup);
        scene.add(this.mesh);
    },

    reset() {
        this.trackProgress = 0;
        this.laneOffset = 0;
        this.speed = 0;
        this.targetSpeed = 0;
        this.velocity = { x: 0, z: 0 };
        this.angularVelocity = 0;
        this.bodyRoll = 0;
        this.bodyPitch = 0;
        this.steerAngle = 0;
        this.wheelRotation = 0;
        this.suspensionOffset = [0, 0, 0, 0];
        this.isBraking = false;
    },

    update(dt, input) {
        // --- INPUT PROCESSING ---
        const wasAccelerating = this.targetSpeed > this.speed;
        this.isBraking = input.keys.down;

        // Target speed based on input
        if (input.keys.up) {
            this.targetSpeed = this.maxSpeed;
        } else if (input.keys.down) {
            this.targetSpeed = -this.maxSpeed * 0.3;
        } else {
            this.targetSpeed = 0;
        }

        // --- ACCELERATION WITH INERTIA ---
        const speedDiff = this.targetSpeed - this.speed;
        let accelRate;

        if (input.keys.up && this.speed >= 0) {
            // Accelerating forward - slower as we approach max speed
            const speedRatio = this.speed / this.maxSpeed;
            accelRate = this.acceleration * (1 - speedRatio * 0.7);
        } else if (input.keys.down) {
            accelRate = this.braking;
        } else {
            // Coasting - gradual slowdown
            accelRate = this.deceleration;
        }

        // Apply acceleration with smoothing
        if (Math.abs(speedDiff) > 0.0001) {
            this.speed += Math.sign(speedDiff) * Math.min(Math.abs(speedDiff), accelRate * dt);
        }

        // Clamp speed
        this.speed = Math.max(-this.maxSpeed * 0.3, Math.min(this.speed, this.maxSpeed));

        // --- STEERING WITH INERTIA ---
        const speedFactor = Math.min(Math.abs(this.speed) / this.maxSpeed, 1);
        const steerInput = (input.keys.left ? -1 : 0) + (input.keys.right ? 1 : 0);

        // Steering is less responsive at high speed
        const steerResponse = 1 - speedFactor * 0.4;
        const targetSteer = steerInput * 0.4 * steerResponse;

        // Smooth steering transition
        this.steerAngle += (targetSteer - this.steerAngle) * (1 - Math.pow(0.05, dt));

        // Apply steering to lane offset with grip consideration
        const lateralForce = this.steerAngle * this.steeringSpeed * speedFactor;
        this.laneOffset += lateralForce * dt;

        // --- BODY PHYSICS ---
        // Body roll (lean into turns)
        const targetRoll = -this.steerAngle * speedFactor * this.bodyRollFactor * 15;
        this.bodyRoll += (targetRoll - this.bodyRoll) * (1 - Math.pow(0.1, dt));

        // Body pitch (nose down on accel, up on brake)
        let targetPitch = 0;
        if (input.keys.up && this.speed > 0) {
            targetPitch = -this.bodyPitchFactor * (this.speed / this.maxSpeed);
        } else if (input.keys.down && this.speed > 0.01) {
            targetPitch = this.bodyPitchFactor * 1.5;
        }
        this.bodyPitch += (targetPitch - this.bodyPitch) * (1 - Math.pow(0.15, dt));

        // --- ROAD BOUNDARIES ---
        // Soft boundary at road edge
        const edgeDistance = Math.abs(this.laneOffset) - this.maxLaneOffset * 0.9;
        if (edgeDistance > 0) {
            // Progressive resistance at edge
            const pushBack = edgeDistance * 0.5 * Math.sign(this.laneOffset);
            this.laneOffset -= pushBack * dt * 10;
            this.speed *= (1 - edgeDistance * 0.1);
        }

        // Hard clamp
        this.laneOffset = Math.max(-this.maxLaneOffset, Math.min(this.maxLaneOffset, this.laneOffset));

        // --- TRACK PROGRESS ---
        this.trackProgress += this.speed * dt;
        if (this.trackProgress >= 1) this.trackProgress -= 1;
        if (this.trackProgress < 0) this.trackProgress += 1;

        // --- UPDATE VISUALS ---
        this.updateMeshPosition(dt);
        this.updateWheels(dt);
        this.updateBrakeLights();
    },

    updateMeshPosition(dt) {
        // Sample road at front and rear axle positions for accurate ground following
        const wheelBase = 3.0; // Distance between front and rear axles
        const trackProgressPerUnit = 1 / Track.trackLength;
        const frontOffset = wheelBase * 0.5 * trackProgressPerUnit * 50;
        const rearOffset = -wheelBase * 0.5 * trackProgressPerUnit * 50;

        // Get road surface at front, center, and rear
        const frontSurface = Track.getRoadSurface(this.trackProgress + frontOffset, this.laneOffset);
        const centerSurface = Track.getRoadSurface(this.trackProgress, this.laneOffset);
        const rearSurface = Track.getRoadSurface(this.trackProgress + rearOffset, this.laneOffset);

        // Car position is at center
        this.mesh.position.copy(centerSurface.position);
        this.mesh.position.y += 0.32; // Wheel radius offset

        // Calculate pitch from front/rear height difference
        const heightDiff = frontSurface.position.y - rearSurface.position.y;
        const calculatedPitch = Math.atan2(heightDiff, wheelBase);

        // Orient car along track direction
        const lookTarget = centerSurface.position.clone().add(centerSurface.tangent.clone().multiplyScalar(5));
        lookTarget.y = this.mesh.position.y;
        this.mesh.lookAt(lookTarget);

        // Apply road banking (roll from banked road surface)
        this.mesh.rotation.z = centerSurface.banking * 0.8;

        // Apply calculated pitch (from actual road slope)
        this.mesh.rotation.x = -calculatedPitch;

        // Apply additional body roll and pitch FROM DRIVING dynamics
        this.chassisGroup.rotation.z = this.bodyRoll;
        this.chassisGroup.rotation.x = this.bodyPitch;

        // Subtle vibration at speed
        if (this.speed > 0.01) {
            const vibration = (Math.random() - 0.5) * 0.002 * (this.speed / this.maxSpeed);
            this.chassisGroup.position.y = vibration;
        }
    },

    updateWheels(dt) {
        // Rotate wheels based on speed
        const wheelRotationSpeed = this.speed * 80;
        this.wheelRotation += wheelRotationSpeed * dt;

        this.wheelMeshes.forEach((wheel, i) => {
            // Wheel spin
            wheel.children[0].rotation.x = this.wheelRotation;
            wheel.children[1].rotation.x = this.wheelRotation;
            wheel.children[2].rotation.x = this.wheelRotation;

            // Front wheel steering
            if (i < 2) {
                wheel.rotation.y = this.steerAngle * 1.2;
            }

            // Suspension compression
            const baseY = 0.32;
            const suspOffset = this.suspensionOffset[i];
            wheel.position.y = baseY + suspOffset;

            // Simple suspension simulation based on body movement
            const targetOffset = -this.bodyPitch * (i < 2 ? 1 : -1) * 0.1
                               - this.bodyRoll * (i % 2 === 0 ? 1 : -1) * 0.05;
            this.suspensionOffset[i] += (targetOffset - suspOffset) * this.suspensionStiffness;
            this.suspensionOffset[i] *= this.suspensionDamping;
        });
    },

    updateBrakeLights() {
        const material = this.isBraking ? this.brakeLightMaterials.on : this.brakeLightMaterials.off;
        this.brakeLights.forEach(light => {
            light.material = material;
        });
    },

    getSpeedMPH() {
        return Math.round(Math.abs(this.speed) * 1875);
    },

    getPosition() {
        return this.mesh.position.clone();
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
