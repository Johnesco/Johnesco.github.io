// Input handling module
const Input = {
    keys: {
        left: false,
        right: false,
        up: false,
        down: false,
        enter: false
    },

    init() {
        document.addEventListener('keydown', (e) => this.handleKey(e, true));
        document.addEventListener('keyup', (e) => this.handleKey(e, false));

        // Touch controls for mobile
        this.setupTouchControls();
    },

    handleKey(e, pressed) {
        switch(e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = pressed;
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = pressed;
                e.preventDefault();
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = pressed;
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = pressed;
                e.preventDefault();
                break;
            case 'Enter':
            case 'Space':
                this.keys.enter = pressed;
                e.preventDefault();
                break;
        }
    },

    setupTouchControls() {
        const canvas = document.getElementById('game-canvas');

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouch(e.touches[0], true);
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouch(e.touches[0], true);
        });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys.left = false;
            this.keys.right = false;
            this.keys.up = false;
        });

        // Tap to start on title screen
        document.getElementById('title-screen').addEventListener('click', () => {
            this.keys.enter = true;
            setTimeout(() => this.keys.enter = false, 100);
        });

        document.getElementById('game-over').addEventListener('click', () => {
            this.keys.enter = true;
            setTimeout(() => this.keys.enter = false, 100);
        });
    },

    handleTouch(touch, active) {
        const canvas = document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const centerX = rect.width / 2;

        // Always accelerate when touching
        this.keys.up = active;

        // Steer based on touch position
        if (active) {
            const deadzone = rect.width * 0.15;
            if (x < centerX - deadzone) {
                this.keys.left = true;
                this.keys.right = false;
            } else if (x > centerX + deadzone) {
                this.keys.right = true;
                this.keys.left = false;
            } else {
                this.keys.left = false;
                this.keys.right = false;
            }
        }
    }
};
