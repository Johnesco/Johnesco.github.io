// 3D Environment module - unified ground with painted track
const Environment = {
    groundMesh: null,
    groundSize: 2000,
    groundY: 0,  // Ground plane height

    init(scene) {
        this.createSky(scene);
        this.createUnifiedGround(scene);
        this.createTrees(scene);
        this.createLighting(scene);
    },

    createSky(scene) {
        // Gradient sky using a large sphere
        const skyGeometry = new THREE.SphereGeometry(2000, 32, 32);

        // Create gradient texture
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#1a1a4a');
        gradient.addColorStop(0.3, '#4a4a8a');
        gradient.addColorStop(0.5, '#8a6aa0');
        gradient.addColorStop(0.7, '#ffaa66');
        gradient.addColorStop(1, '#ff7744');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 256);

        const skyTexture = new THREE.CanvasTexture(canvas);

        const skyMaterial = new THREE.MeshBasicMaterial({
            map: skyTexture,
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        scene.add(sky);

        // Sun
        const sunGeometry = new THREE.SphereGeometry(50, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffdd44,
            transparent: true,
            opacity: 0.9
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(800, 300, -500);
        scene.add(sun);

        // Sun glow
        const glowGeometry = new THREE.SphereGeometry(80, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffcc44,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(sun.position);
        scene.add(glow);
    },

    createUnifiedGround(scene) {
        // Create a large canvas texture with grass and track painted on it
        const textureSize = 2048;
        const canvas = document.createElement('canvas');
        canvas.width = textureSize;
        canvas.height = textureSize;
        const ctx = canvas.getContext('2d');

        // Fill with grass base color
        ctx.fillStyle = '#2d7a2d';
        ctx.fillRect(0, 0, textureSize, textureSize);

        // Add grass texture noise
        for (let i = 0; i < 50000; i++) {
            const x = Math.random() * textureSize;
            const y = Math.random() * textureSize;
            const green = Math.floor(Math.random() * 60 + 80);
            const brightness = Math.random() * 0.4 + 0.6;
            ctx.fillStyle = `rgb(${Math.floor(30 * brightness)}, ${Math.floor(green * brightness)}, ${Math.floor(20 * brightness)})`;
            ctx.fillRect(x, y, 2, 3);
        }

        // Paint the track onto the texture
        this.paintTrackOnTexture(ctx, textureSize);

        // Create texture from canvas
        const groundTexture = new THREE.CanvasTexture(canvas);
        groundTexture.wrapS = THREE.ClampToEdgeWrapping;
        groundTexture.wrapT = THREE.ClampToEdgeWrapping;

        // Create flat ground plane
        const groundGeometry = new THREE.PlaneGeometry(this.groundSize, this.groundSize, 1, 1);

        const groundMaterial = new THREE.MeshPhongMaterial({
            map: groundTexture,
            shininess: 5
        });

        this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.groundMesh.position.y = this.groundY;
        this.groundMesh.receiveShadow = true;
        scene.add(this.groundMesh);

        // Add start/finish line
        this.createStartLine(scene);

        // Distant mountains for atmosphere
        this.createMountains(scene);
    },

    paintTrackOnTexture(ctx, textureSize) {
        const halfSize = this.groundSize / 2;
        const scale = textureSize / this.groundSize;

        // Convert world coordinates to texture coordinates
        const toTexCoord = (x, z) => {
            return {
                x: (x + halfSize) * scale,
                y: (z + halfSize) * scale
            };
        };

        // Sample track points
        const numSamples = 500;
        const trackWidth = Track.trackWidth;

        // Draw track surface (asphalt)
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = trackWidth * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        for (let i = 0; i <= numSamples; i++) {
            const t = i / numSamples;
            const point = Track.getPointAt(t);
            const tc = toTexCoord(point.x, point.z);

            if (i === 0) {
                ctx.moveTo(tc.x, tc.y);
            } else {
                ctx.lineTo(tc.x, tc.y);
            }
        }
        ctx.closePath();
        ctx.stroke();

        // Add asphalt texture noise
        ctx.globalCompositeOperation = 'source-atop';
        for (let i = 0; i < 30000; i++) {
            const t = Math.random();
            const point = Track.getPointAt(t);
            const tangent = Track.getTangentAt(t);
            const right = { x: tangent.z, z: -tangent.x };

            const laneOffset = (Math.random() - 0.5) * trackWidth * 0.9;
            const worldX = point.x + right.x * laneOffset;
            const worldZ = point.z + right.z * laneOffset;

            const tc = toTexCoord(worldX, worldZ);
            const brightness = Math.random() * 30 + 45;
            ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
            ctx.fillRect(tc.x, tc.y, 2, 2);
        }
        ctx.globalCompositeOperation = 'source-over';

        // Draw track edge lines (white)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8 * scale;

        for (let side = -1; side <= 1; side += 2) {
            ctx.beginPath();
            for (let i = 0; i <= numSamples; i++) {
                const t = i / numSamples;
                const point = Track.getPointAt(t);
                const tangent = Track.getTangentAt(t);
                const right = { x: tangent.z, z: -tangent.x };

                const edgeX = point.x + right.x * side * (trackWidth / 2 - 1);
                const edgeZ = point.z + right.z * side * (trackWidth / 2 - 1);
                const tc = toTexCoord(edgeX, edgeZ);

                if (i === 0) {
                    ctx.moveTo(tc.x, tc.y);
                } else {
                    ctx.lineTo(tc.x, tc.y);
                }
            }
            ctx.closePath();
            ctx.stroke();
        }

        // Draw center dashed line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5 * scale;
        ctx.setLineDash([8 * scale, 8 * scale]);

        ctx.beginPath();
        for (let i = 0; i <= numSamples; i++) {
            const t = i / numSamples;
            const point = Track.getPointAt(t);
            const tc = toTexCoord(point.x, point.z);

            if (i === 0) {
                ctx.moveTo(tc.x, tc.y);
            } else {
                ctx.lineTo(tc.x, tc.y);
            }
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw rumble strips (red/white alternating on edges)
        const rumbleWidth = 2 * scale;
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < numSamples; i++) {
                const t = i / numSamples;
                const point = Track.getPointAt(t);
                const tangent = Track.getTangentAt(t);
                const right = { x: tangent.z, z: -tangent.x };

                const rumbleX = point.x + right.x * side * (trackWidth / 2 + 1.5);
                const rumbleZ = point.z + right.z * side * (trackWidth / 2 + 1.5);
                const tc = toTexCoord(rumbleX, rumbleZ);

                ctx.fillStyle = (i % 4 < 2) ? '#cc0000' : '#ffffff';
                ctx.beginPath();
                ctx.arc(tc.x, tc.y, rumbleWidth, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },

    createStartLine(scene) {
        // Create checkered start/finish line
        const startT = 0;
        const point = Track.getPointAt(startT);
        const tangent = Track.getTangentAt(startT);
        const right = new THREE.Vector3(tangent.z, 0, -tangent.x);

        const lineWidth = Track.trackWidth;
        const lineDepth = 3;

        // Checkered pattern texture
        const checkerCanvas = document.createElement('canvas');
        checkerCanvas.width = 64;
        checkerCanvas.height = 16;
        const cCtx = checkerCanvas.getContext('2d');

        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 2; y++) {
                cCtx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#000000';
                cCtx.fillRect(x * 8, y * 8, 8, 8);
            }
        }

        const checkerTexture = new THREE.CanvasTexture(checkerCanvas);

        const lineGeom = new THREE.PlaneGeometry(lineWidth, lineDepth);
        const lineMat = new THREE.MeshPhongMaterial({
            map: checkerTexture,
            shininess: 10
        });

        const startLine = new THREE.Mesh(lineGeom, lineMat);
        startLine.rotation.x = -Math.PI / 2;
        startLine.position.set(point.x, this.groundY + 0.01, point.z);

        // Rotate to align with track direction
        const angle = Math.atan2(tangent.x, tangent.z);
        startLine.rotation.z = -angle;

        scene.add(startLine);
    },

    createMountains(scene) {
        const mountainMaterial = new THREE.MeshLambertMaterial({
            color: 0x445566,
            flatShading: true
        });

        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const distance = 1200 + Math.random() * 300;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;

            const height = 100 + Math.random() * 200;
            const width = 150 + Math.random() * 150;

            const mountainGeom = new THREE.ConeGeometry(width, height, 6);
            const mountain = new THREE.Mesh(mountainGeom, mountainMaterial);
            mountain.position.set(x, height / 2 - 20, z);
            mountain.rotation.y = Math.random() * Math.PI;
            scene.add(mountain);
        }
    },

    createTrees(scene) {
        const trunkGeom = new THREE.CylinderGeometry(0.5, 0.8, 8, 6);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a2c0a });

        const foliageGeom = new THREE.ConeGeometry(4, 12, 8);
        const foliageMat = new THREE.MeshLambertMaterial({ color: 0x0a5f0a });

        // Place trees around the track
        const numTrees = 150;

        for (let i = 0; i < numTrees; i++) {
            const t = i / numTrees;
            const point = Track.getPointAt(t);
            const tangent = Track.getTangentAt(t);
            const right = { x: tangent.z, z: -tangent.x };

            const sides = [-1, 1];
            sides.forEach(side => {
                if (Math.random() > 0.5) return;

                const distance = 25 + Math.random() * 50;
                const offsetX = right.x * side * distance;
                const offsetZ = right.z * side * distance;

                const scale = 0.8 + Math.random() * 0.8;

                const tree = new THREE.Group();

                const trunk = new THREE.Mesh(trunkGeom, trunkMat);
                trunk.scale.setScalar(scale);
                trunk.position.y = 4 * scale;
                trunk.castShadow = true;
                tree.add(trunk);

                const foliage = new THREE.Mesh(foliageGeom, foliageMat);
                foliage.scale.setScalar(scale);
                foliage.position.y = 12 * scale;
                foliage.castShadow = true;
                tree.add(foliage);

                tree.position.set(point.x + offsetX, this.groundY, point.z + offsetZ);
                scene.add(tree);
            });
        }

        // Random distant trees
        for (let i = 0; i < 80; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 300 + Math.random() * 600;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;

            const scale = 0.5 + Math.random() * 1;

            const tree = new THREE.Group();

            const trunk = new THREE.Mesh(trunkGeom, trunkMat);
            trunk.scale.setScalar(scale);
            trunk.position.y = 4 * scale;
            tree.add(trunk);

            const foliage = new THREE.Mesh(foliageGeom, foliageMat);
            foliage.scale.setScalar(scale);
            foliage.position.y = 12 * scale;
            tree.add(foliage);

            tree.position.set(x, this.groundY, z);
            scene.add(tree);
        }
    },

    createLighting(scene) {
        const ambient = new THREE.AmbientLight(0x666666);
        scene.add(ambient);

        const directional = new THREE.DirectionalLight(0xffddaa, 1);
        directional.position.set(800, 400, -500);
        directional.castShadow = true;
        directional.shadow.mapSize.width = 2048;
        directional.shadow.mapSize.height = 2048;
        directional.shadow.camera.near = 100;
        directional.shadow.camera.far = 2000;
        directional.shadow.camera.left = -500;
        directional.shadow.camera.right = 500;
        directional.shadow.camera.top = 500;
        directional.shadow.camera.bottom = -500;
        scene.add(directional);

        const hemisphere = new THREE.HemisphereLight(0x88aaff, 0x445522, 0.5);
        scene.add(hemisphere);
    },

    // Get ground height at any position (flat ground)
    getGroundHeight(x, z) {
        return this.groundY;
    }
};
