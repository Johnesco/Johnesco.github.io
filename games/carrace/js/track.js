// 3D Track generation module
const Track = {
    // Track configuration
    trackWidth: 20,
    trackLength: 0,
    segmentLength: 10,

    // Track data
    points: [],        // Spline control points
    curve: null,       // THREE.CatmullRomCurve3
    roadMesh: null,

    // Track segments for game logic
    segments: [],

    init(scene) {
        this.generateTrackPoints();
        this.createCurve();
        // Road is now painted on the unified ground mesh in Environment
        this.buildSegmentData();
    },

    generateTrackPoints() {
        // Create a varied racing circuit on flat ground
        this.points = [];

        const numPoints = 50;
        const radius = 500;

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const t = i / numPoints;

            // Base oval with variations for interesting curves
            let x = Math.cos(angle) * radius;
            let z = Math.sin(angle) * radius * 0.8; // Slightly oval

            // Add sweeping curves
            x += Math.sin(angle * 2) * 120;
            z += Math.cos(angle * 2) * 80;

            // S-curve section
            if (t > 0.2 && t < 0.35) {
                x += Math.sin((t - 0.2) * Math.PI * 6) * 60;
            }

            // Flat track - all points at y = 0 (ground level)
            let y = 0;

            this.points.push(new THREE.Vector3(x, y, z));
        }
    },

    createCurve() {
        // Create a smooth closed spline through all points
        this.curve = new THREE.CatmullRomCurve3(this.points, true, 'catmullrom', 0.5);
        this.trackLength = this.curve.getLength();
    },

    createRoadMesh(scene) {
        // Sample many points along the curve for smooth road
        const numSegments = 500;
        const halfWidth = this.trackWidth / 2;

        // Create road geometry
        const vertices = [];
        const indices = [];
        const uvs = [];
        const colors = [];

        for (let i = 0; i <= numSegments; i++) {
            const t = i / numSegments;
            const point = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t);

            // Calculate perpendicular (right) vector
            const up = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

            // Adjust for banking on curves
            const nextT = Math.min(t + 0.01, 1);
            const prevT = Math.max(t - 0.01, 0);
            const nextTangent = this.curve.getTangentAt(nextT);
            const curvature = tangent.angleTo(nextTangent);

            // Left and right edge points
            const left = point.clone().add(right.clone().multiplyScalar(-halfWidth));
            const rightPt = point.clone().add(right.clone().multiplyScalar(halfWidth));

            // Calculate banking based on curve direction and intensity
            const cross = tangent.clone().cross(nextTangent);
            const turnDirection = Math.sign(cross.y);
            const bankAmount = curvature * 80; // More pronounced banking

            // Bank the road - outer edge higher in turns
            if (turnDirection > 0) {
                // Turning left - right side higher
                rightPt.y += bankAmount;
                left.y -= bankAmount * 0.3;
            } else if (turnDirection < 0) {
                // Turning right - left side higher
                left.y += bankAmount;
                rightPt.y -= bankAmount * 0.3;
            }

            vertices.push(left.x, left.y, left.z);
            vertices.push(rightPt.x, rightPt.y, rightPt.z);

            // UVs for texturing
            uvs.push(0, t * 50);
            uvs.push(1, t * 50);

            // Subtle color variation for road surface
            const noise = Math.sin(t * 200) * 0.02;
            const gray = 0.55 + noise;
            colors.push(gray, gray, gray);
            colors.push(gray, gray, gray);
        }

        // Create triangles
        for (let i = 0; i < numSegments; i++) {
            const base = i * 2;
            indices.push(base, base + 1, base + 2);
            indices.push(base + 1, base + 3, base + 2);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        // Create asphalt-like texture
        const textureCanvas = document.createElement('canvas');
        textureCanvas.width = 256;
        textureCanvas.height = 256;
        const tCtx = textureCanvas.getContext('2d');

        // Base asphalt color
        tCtx.fillStyle = '#3a3a3a';
        tCtx.fillRect(0, 0, 256, 256);

        // Add noise/grain for asphalt texture
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const brightness = Math.random() * 30 + 40;
            tCtx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
            tCtx.fillRect(x, y, 1, 1);
        }

        const roadTexture = new THREE.CanvasTexture(textureCanvas);
        roadTexture.wrapS = THREE.RepeatWrapping;
        roadTexture.wrapT = THREE.RepeatWrapping;
        roadTexture.repeat.set(4, 100);

        const material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            map: roadTexture,
            side: THREE.DoubleSide,
            shininess: 10
        });

        this.roadMesh = new THREE.Mesh(geometry, material);
        this.roadMesh.receiveShadow = true;
        scene.add(this.roadMesh);
    },

    createRoadMarkings(scene) {
        const numSegments = 500;
        const halfWidth = this.trackWidth / 2;

        // Center line (dashed)
        const centerLineGeometry = new THREE.BufferGeometry();
        const centerVertices = [];

        for (let i = 0; i <= numSegments; i++) {
            const t = i / numSegments;
            const segIndex = Math.floor(t * 200);

            // Dashed pattern
            if (segIndex % 4 < 2) {
                const point = this.curve.getPointAt(t);
                centerVertices.push(point.x, point.y + 0.1, point.z);
            }
        }

        centerLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(centerVertices, 3));
        const centerLineMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
        const centerLine = new THREE.Points(centerLineGeometry, centerLineMaterial);
        scene.add(centerLine);

        // Edge lines (solid white)
        this.createEdgeLine(scene, -halfWidth + 0.5, 0xffffff);
        this.createEdgeLine(scene, halfWidth - 0.5, 0xffffff);

        // Rumble strips (red/white)
        this.createRumbleStrip(scene, -halfWidth - 1, 0xff0000);
        this.createRumbleStrip(scene, halfWidth + 1, 0xff0000);
    },

    createEdgeLine(scene, offset, color) {
        const numSegments = 500;
        const vertices = [];

        for (let i = 0; i <= numSegments; i++) {
            const t = i / numSegments;
            const point = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t);
            const up = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

            const edgePoint = point.clone().add(right.clone().multiplyScalar(offset));
            vertices.push(edgePoint.x, edgePoint.y + 0.1, edgePoint.z);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        const material = new THREE.LineBasicMaterial({ color: color });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
    },

    createRumbleStrip(scene, offset, color) {
        const numSegments = 200;

        for (let i = 0; i < numSegments; i++) {
            const t = i / numSegments;
            const point = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t);
            const up = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

            const stripPoint = point.clone().add(right.clone().multiplyScalar(offset));

            // Alternating red/white
            const isRed = i % 2 === 0;
            const geometry = new THREE.BoxGeometry(2, 0.3, 3);
            const material = new THREE.MeshLambertMaterial({
                color: isRed ? 0xcc0000 : 0xffffff
            });

            const strip = new THREE.Mesh(geometry, material);
            strip.position.copy(stripPoint);
            strip.lookAt(stripPoint.clone().add(tangent));
            scene.add(strip);
        }
    },

    createBarriers(scene) {
        const numPosts = 100;
        const halfWidth = this.trackWidth / 2 + 3;

        for (let i = 0; i < numPosts; i++) {
            const t = i / numPosts;
            const point = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t);
            const up = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

            // Left barrier post
            this.createBarrierPost(scene, point, right, -halfWidth);
            // Right barrier post
            this.createBarrierPost(scene, point, right, halfWidth);
        }
    },

    createBarrierPost(scene, point, right, offset) {
        const postGeom = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
        const postMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const post = new THREE.Mesh(postGeom, postMat);

        const position = point.clone().add(right.clone().multiplyScalar(offset));
        post.position.copy(position);
        post.position.y += 1.5;

        scene.add(post);
    },

    buildSegmentData() {
        // Create segment data for game logic (lap tracking, etc.)
        const numSegments = 100;
        this.segments = [];

        for (let i = 0; i < numSegments; i++) {
            const t = i / numSegments;
            this.segments.push({
                t: t,
                point: this.curve.getPointAt(t),
                tangent: this.curve.getTangentAt(t)
            });
        }
    },

    // Get position and orientation at a point along track (0-1)
    getPointAt(t) {
        // Wrap t to 0-1
        t = ((t % 1) + 1) % 1;
        return this.curve.getPointAt(t);
    },

    getTangentAt(t) {
        t = ((t % 1) + 1) % 1;
        return this.curve.getTangentAt(t);
    },

    // Convert track progress (0-1) to world position with proper road surface height
    getWorldPosition(trackT, laneOffset) {
        const surface = this.getRoadSurface(trackT, laneOffset);
        return surface.position;
    },

    // Get road surface data - flat ground version
    getRoadSurface(trackT, laneOffset) {
        const point = this.getPointAt(trackT);
        const tangent = this.getTangentAt(trackT);
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

        // Position on road - horizontal offset only (flat ground)
        const position = point.clone().add(right.clone().multiplyScalar(laneOffset));
        position.y = 0; // Flat ground

        return {
            position: position,
            tangent: tangent,
            right: right,
            banking: 0,
            pitch: 0,
            normal: up
        };
    },

    // Calculate banking angle at a point on the track (flat = 0)
    getBankingAt(trackT) {
        return 0; // Flat ground, no banking
    },

    // Calculate pitch (uphill/downhill) at a point
    getPitchAt(trackT) {
        trackT = ((trackT % 1) + 1) % 1;

        const prevT = (trackT - 0.01 + 1) % 1;
        const nextT = (trackT + 0.01) % 1;

        const prevPoint = this.curve.getPointAt(prevT);
        const nextPoint = this.curve.getPointAt(nextT);

        const dy = nextPoint.y - prevPoint.y;
        const dz = prevPoint.distanceTo(nextPoint);

        return Math.atan2(dy, dz);
    },

    // Get road surface normal vector
    getRoadNormal(tangent, right, banking) {
        const up = new THREE.Vector3(0, 1, 0);

        // Rotate up vector around tangent by banking angle
        const normal = up.clone();
        normal.applyAxisAngle(tangent, banking);

        return normal.normalize();
    }
};
