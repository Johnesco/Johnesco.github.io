// Main 3D Game module
const Game = {
    // Game states
    STATE: {
        TITLE: 'title',
        PLAYING: 'playing',
        GAMEOVER: 'gameover'
    },

    state: 'title',

    // Three.js objects
    scene: null,
    camera: null,
    renderer: null,

    // Camera settings
    cameraDistance: 12,
    cameraHeight: 4,
    cameraLookAhead: 15,

    // Smooth camera state
    cameraPos: null,
    cameraLookAt: null,
    cameraSmoothness: 0.08,
    cameraLookSmoothness: 0.12,

    // Race settings
    totalLaps: 3,
    currentLap: 1,
    lastProgress: 0,
    raceTime: 0,
    bestTime: null,

    // Timing
    clock: null,

    init() {
        this.setupThreeJS();
        this.setupScene();

        // Initialize input
        Input.init();

        // Load best time
        this.bestTime = localStorage.getItem('retroRacer3DBest');

        // Start game loop
        this.clock = new THREE.Clock();
        this.animate();
    },

    setupThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x88aacc, 200, 1500);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            640 / 480,
            0.1,
            3000
        );

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(640, 480);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Add to DOM
        const container = document.getElementById('game-canvas');
        container.appendChild(this.renderer.domElement);
    },

    setupScene() {
        // Initialize track first (other modules depend on it)
        Track.init(this.scene);

        // Initialize environment
        Environment.init(this.scene);

        // Initialize cars
        Car3D.init(this.scene);
        Traffic3D.init(this.scene);

        // Position camera initially
        this.updateCamera();
    },

    animate() {
        requestAnimationFrame(() => this.animate());

        const dt = Math.min(this.clock.getDelta(), 0.1);

        switch (this.state) {
            case this.STATE.TITLE:
                this.updateTitle(dt);
                break;
            case this.STATE.PLAYING:
                this.updatePlaying(dt);
                break;
            case this.STATE.GAMEOVER:
                this.updateGameOver(dt);
                break;
        }

        // Render
        this.renderer.render(this.scene, this.camera);
    },

    updateTitle(dt) {
        // Slowly rotate camera around track for title screen
        const time = this.clock.elapsedTime * 0.02;
        const pos = Track.getPointAt(time % 1);
        const tangent = Track.getTangentAt(time % 1);

        this.camera.position.set(pos.x, pos.y + 30, pos.z);
        this.camera.lookAt(pos.x + tangent.x * 50, pos.y, pos.z + tangent.z * 50);

        // Check for start
        if (Input.keys.enter) {
            this.startGame();
            Input.keys.enter = false;
        }
    },

    updatePlaying(dt) {
        // Update race time
        this.raceTime += dt;

        // Update player car
        Car3D.update(dt, Input);

        // Update traffic
        Traffic3D.update(dt);

        // Check collisions with traffic
        const collidedCar = Traffic3D.checkCollisions(Car3D.trackProgress, Car3D.laneOffset);
        if (collidedCar) {
            // Realistic collision response - reduce velocity
            Car3D.velocity.x *= 0.6;
            Car3D.velocity.z *= 0.6;

            // Push player away from traffic car
            const pushDirection = Math.sign(Car3D.laneOffset - collidedCar.laneOffset) || 1;
            const rightDir = {
                x: Math.cos(Car3D.rotation.yaw),
                z: -Math.sin(Car3D.rotation.yaw)
            };
            Car3D.velocity.x += rightDir.x * pushDirection * 5;
            Car3D.velocity.z += rightDir.z * pushDirection * 5;

            // Add some angular velocity from impact
            Car3D.angularVelocity.yaw += pushDirection * 0.3;

            // Add body roll from impact
            Car3D.rotation.roll += pushDirection * 0.05;
        }

        // Update camera to follow player
        this.updateCamera();

        // Check lap progress
        this.checkLapProgress();

        // Update HUD
        this.updateHUD();
    },

    updateGameOver(dt) {
        // Keep camera following but don't update car
        this.updateCamera();

        // Check for restart
        if (Input.keys.enter) {
            this.startGame();
            Input.keys.enter = false;
        }
    },

    updateCamera() {
        const carPos = Car3D.getPosition();

        // Use car's actual facing direction instead of track tangent
        const carForward = new THREE.Vector3(
            Math.sin(Car3D.rotation.yaw),
            0,
            Math.cos(Car3D.rotation.yaw)
        );
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(carForward, up).normalize();

        // Speed-based camera distance (closer when slow, further when fast)
        const speed = Car3D.getSpeed();
        const speedRatio = Math.min(speed / Car3D.maxSpeed, 1);
        const dynamicDistance = this.cameraDistance + speedRatio * 3;
        const dynamicHeight = this.cameraHeight + speedRatio * 1.5;

        // Camera position behind and above car (follows car orientation)
        const cameraOffset = carForward.clone().multiplyScalar(-dynamicDistance);
        cameraOffset.y = dynamicHeight;

        // Add lateral offset based on steering (camera swings outward in turns)
        const lateralOffset = -Car3D.steerAngle * 4 - Car3D.laneOffset * 0.15;
        cameraOffset.add(right.clone().multiplyScalar(lateralOffset));

        // Calculate target position
        const targetPos = carPos.clone().add(cameraOffset);

        // Initialize camera position if needed
        if (!this.cameraPos) {
            this.cameraPos = targetPos.clone();
            this.cameraLookAt = carPos.clone();
        }

        // Smooth camera movement with variable smoothness based on speed
        const posSmoothness = this.cameraSmoothness * (1 + speedRatio * 0.5);
        this.cameraPos.lerp(targetPos, posSmoothness);
        this.camera.position.copy(this.cameraPos);

        // Look target - ahead of car, adjusted for speed
        const lookAheadDist = this.cameraLookAhead + speedRatio * 8;
        const targetLookAt = carPos.clone().add(carForward.clone().multiplyScalar(lookAheadDist));
        targetLookAt.y = carPos.y + 1.5;

        // Smooth look-at transition
        this.cameraLookAt.lerp(targetLookAt, this.cameraLookSmoothness);
        this.camera.lookAt(this.cameraLookAt);

        // Subtle camera shake at high speed or off-road
        if (speedRatio > 0.7 || !Car3D.isOnTrack) {
            const shakeIntensity = Car3D.isOnTrack ? (speedRatio - 0.7) * 0.1 : 0.15;
            this.camera.position.x += (Math.random() - 0.5) * shakeIntensity;
            this.camera.position.y += (Math.random() - 0.5) * shakeIntensity * 0.5;
        }
    },

    checkLapProgress() {
        // Detect when player crosses start line (progress wraps from ~1 to ~0)
        if (this.lastProgress > 0.9 && Car3D.trackProgress < 0.1) {
            this.currentLap++;

            if (this.currentLap > this.totalLaps) {
                this.endRace();
            }
        }

        this.lastProgress = Car3D.trackProgress;
    },

    updateHUD() {
        const speedText = Car3D.getSpeedMPH() + ' MPH';
        const offTrackIndicator = Car3D.isOffTrack() ? ' [OFF TRACK]' : '';
        document.getElementById('speed').textContent = speedText + offTrackIndicator;
        document.getElementById('lap').textContent =
            'LAP ' + Math.min(this.currentLap, this.totalLaps) + '/' + this.totalLaps;
        document.getElementById('time').textContent = 'TIME ' + this.formatTime(this.raceTime);
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return mins + ':' + secs.toString().padStart(2, '0') + '.' + ms.toString().padStart(2, '0');
    },

    startGame() {
        // Hide screens
        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');

        // Reset state
        this.state = this.STATE.PLAYING;
        this.currentLap = 1;
        this.lastProgress = 0;
        this.raceTime = 0;

        // Reset car and traffic
        Car3D.reset();
        Traffic3D.reset();

        // Reset camera
        this.cameraPos = null;
        this.cameraLookAt = null;
    },

    endRace() {
        this.state = this.STATE.GAMEOVER;

        // Check best time
        if (!this.bestTime || this.raceTime < parseFloat(this.bestTime)) {
            this.bestTime = this.raceTime;
            localStorage.setItem('retroRacer3DBest', this.raceTime);
        }

        // Show game over
        const gameOver = document.getElementById('game-over');
        gameOver.classList.remove('hidden');
        document.getElementById('final-time').textContent =
            'Time: ' + this.formatTime(this.raceTime) +
            (this.bestTime === this.raceTime ? ' (NEW BEST!)' : '');
    }
};

// Start when loaded
window.addEventListener('load', () => {
    Game.init();
});
