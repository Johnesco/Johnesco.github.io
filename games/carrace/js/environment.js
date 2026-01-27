// 3D Environment module - sky, terrain, scenery
const Environment = {
    init(scene) {
        this.createSky(scene);
        this.createGround(scene);
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

    createGround(scene) {
        // Create grass texture
        const grassCanvas = document.createElement('canvas');
        grassCanvas.width = 256;
        grassCanvas.height = 256;
        const gCtx = grassCanvas.getContext('2d');

        // Base grass color
        gCtx.fillStyle = '#2d7a2d';
        gCtx.fillRect(0, 0, 256, 256);

        // Add grass blade details
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const green = Math.floor(Math.random() * 60 + 80);
            const brightness = Math.random() * 0.4 + 0.6;
            gCtx.fillStyle = `rgb(${Math.floor(30 * brightness)}, ${Math.floor(green * brightness)}, ${Math.floor(20 * brightness)})`;
            gCtx.fillRect(x, y, 1, 2);
        }

        const grassTexture = new THREE.CanvasTexture(grassCanvas);
        grassTexture.wrapS = THREE.RepeatWrapping;
        grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(80, 80);

        // Large ground plane
        const groundGeometry = new THREE.PlaneGeometry(4000, 4000, 80, 80);

        // Add some vertex displacement for terrain
        const positions = groundGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);

            // Gentle rolling hills
            let y = Math.sin(x * 0.008) * 8 + Math.cos(z * 0.008) * 8;
            y += Math.sin(x * 0.003 + z * 0.003) * 15;

            // Keep area near track flatter
            const distFromCenter = Math.sqrt(x * x + z * z);
            if (distFromCenter < 650) {
                y *= Math.pow(distFromCenter / 650, 2);
            }

            positions.setY(i, y - 1);
        }
        groundGeometry.computeVertexNormals();

        const groundMaterial = new THREE.MeshPhongMaterial({
            map: grassTexture,
            shininess: 5
        });

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Add gravel/dirt areas near track
        this.createTrackside(scene);

        // Distant mountains
        this.createMountains(scene);
    },

    createTrackside(scene) {
        // Create dirt/gravel texture for track edges
        const dirtCanvas = document.createElement('canvas');
        dirtCanvas.width = 128;
        dirtCanvas.height = 128;
        const dCtx = dirtCanvas.getContext('2d');

        dCtx.fillStyle = '#8b7355';
        dCtx.fillRect(0, 0, 128, 128);

        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            const shade = Math.random() * 40 + 100;
            dCtx.fillStyle = `rgb(${shade}, ${shade * 0.8}, ${shade * 0.6})`;
            dCtx.fillRect(x, y, 2, 2);
        }

        const dirtTexture = new THREE.CanvasTexture(dirtCanvas);
        dirtTexture.wrapS = THREE.RepeatWrapping;
        dirtTexture.wrapT = THREE.RepeatWrapping;
        dirtTexture.repeat.set(2, 50);

        // Create dirt strips along track edges
        const numSegments = 200;
        for (let side = -1; side <= 1; side += 2) {
            const vertices = [];
            const uvs = [];

            for (let i = 0; i <= numSegments; i++) {
                const t = i / numSegments;
                const point = Track.getPointAt(t);
                const tangent = Track.getTangentAt(t);
                const up = new THREE.Vector3(0, 1, 0);
                const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

                const innerOffset = 12;
                const outerOffset = 18;

                const inner = point.clone().add(right.clone().multiplyScalar(side * innerOffset));
                const outer = point.clone().add(right.clone().multiplyScalar(side * outerOffset));

                vertices.push(inner.x, inner.y - 0.05, inner.z);
                vertices.push(outer.x, outer.y - 0.05, outer.z);

                uvs.push(0, t * 50);
                uvs.push(1, t * 50);
            }

            const indices = [];
            for (let i = 0; i < numSegments; i++) {
                const base = i * 2;
                indices.push(base, base + 1, base + 2);
                indices.push(base + 1, base + 3, base + 2);
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            geometry.setIndex(indices);
            geometry.computeVertexNormals();

            const material = new THREE.MeshPhongMaterial({
                map: dirtTexture,
                shininess: 2
            });

            const dirtStrip = new THREE.Mesh(geometry, material);
            scene.add(dirtStrip);
        }
    },

    createMountains(scene) {
        const mountainMaterial = new THREE.MeshLambertMaterial({
            color: 0x445566,
            flatShading: true
        });

        // Create several mountain ranges
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const distance = 1500 + Math.random() * 300;
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
        // Create tree geometries once
        const trunkGeom = new THREE.CylinderGeometry(0.5, 0.8, 8, 6);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a2c0a });

        const foliageGeom = new THREE.ConeGeometry(4, 12, 8);
        const foliageMat = new THREE.MeshLambertMaterial({ color: 0x0a5f0a });

        // Place trees around the track
        const numTrees = 200;

        for (let i = 0; i < numTrees; i++) {
            const t = i / numTrees;
            const point = Track.getPointAt(t);
            const tangent = Track.getTangentAt(t);
            const up = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

            // Place trees on both sides of track
            const sides = [-1, 1];
            sides.forEach(side => {
                if (Math.random() > 0.6) return; // Skip some trees

                const distance = 20 + Math.random() * 40;
                const offset = right.clone().multiplyScalar(side * distance);
                const position = point.clone().add(offset);

                // Random tree scale
                const scale = 0.8 + Math.random() * 0.8;

                // Create tree group
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

                tree.position.copy(position);
                scene.add(tree);
            });
        }

        // Add some random trees in the distance
        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 200 + Math.random() * 800;
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

            tree.position.set(x, 0, z);
            scene.add(tree);
        }
    },

    createLighting(scene) {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x666666);
        scene.add(ambient);

        // Directional light (sun)
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

        // Hemisphere light for more natural outdoor lighting
        const hemisphere = new THREE.HemisphereLight(0x88aaff, 0x445522, 0.5);
        scene.add(hemisphere);
    }
};
