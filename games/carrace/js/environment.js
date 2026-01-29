// Environment — ES module
// Flat infinite ground (cannon-es + Three.js), sky, lighting, fog, ramp for jumps

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export function createEnvironment(scene, world) {
    // ── Physics ground (infinite plane facing +Y) ─────────────────────
    const groundBody = new CANNON.Body({ mass: 0 });
    const groundShape = new CANNON.Plane();
    groundBody.addShape(groundShape);
    // CANNON.Plane default normal is +Z; rotate -PI/2 around X so it faces +Y
    groundBody.quaternion.setFromEulerAngles(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // ── Visual ground plane ───────────────────────────────────────────
    const groundSize = 10000;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);

    // Repeating grass-ish texture via canvas
    const texSize = 512;
    const canvas = document.createElement('canvas');
    canvas.width = texSize;
    canvas.height = texSize;
    const ctx = canvas.getContext('2d');

    // Base green
    ctx.fillStyle = '#3a7a3a';
    ctx.fillRect(0, 0, texSize, texSize);

    // Noise dots
    for (let i = 0; i < 8000; i++) {
        const x = Math.random() * texSize;
        const y = Math.random() * texSize;
        const g = Math.floor(Math.random() * 50 + 90);
        const b = Math.random() * 0.4 + 0.6;
        ctx.fillStyle = `rgb(${Math.floor(35 * b)},${Math.floor(g * b)},${Math.floor(25 * b)})`;
        ctx.fillRect(x, y, 2, 3);
    }

    // Subtle grid lines for spatial reference (every 10 m at texture scale)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    const gridStep = texSize / 10;
    for (let i = 0; i <= 10; i++) {
        const p = i * gridStep;
        ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, texSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(texSize, p); ctx.stroke();
    }

    const grassTex = new THREE.CanvasTexture(canvas);
    grassTex.wrapS = THREE.RepeatWrapping;
    grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(groundSize / 20, groundSize / 20);

    const groundMat = new THREE.MeshPhongMaterial({ map: grassTex, shininess: 5 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // ── Sky sphere (gradient) ─────────────────────────────────────────
    const skyGeo = new THREE.SphereGeometry(4000, 32, 32);
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 1;
    skyCanvas.height = 256;
    const skyCtx = skyCanvas.getContext('2d');
    const grad = skyCtx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#1a1a4a');
    grad.addColorStop(0.35, '#4a6aaa');
    grad.addColorStop(0.6, '#88aadd');
    grad.addColorStop(0.85, '#bbddff');
    grad.addColorStop(1, '#ddeeff');
    skyCtx.fillStyle = grad;
    skyCtx.fillRect(0, 0, 1, 256);
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // ── Lighting ──────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x666666));

    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(50, 80, 30);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 300;
    dir.shadow.camera.left = -60;
    dir.shadow.camera.right = 60;
    dir.shadow.camera.top = 60;
    dir.shadow.camera.bottom = -60;
    scene.add(dir);

    scene.add(new THREE.HemisphereLight(0x88aaff, 0x445522, 0.5));

    // ── Fog (hides ground edges) ──────────────────────────────────────
    scene.fog = new THREE.Fog(0x88aadd, 200, 2000);

    // ── Ramp for testing 6DOF airborne physics ────────────────────────
    addRamp(scene, world, { x: 0, z: 60 });
    addRamp(scene, world, { x: 30, z: 120 }, Math.PI / 6);

    return { groundBody, dirLight: dir };
}

/**
 * Helper — static box ramp.
 * Default: 6m wide, 0.4m tall at peak, 8m long, angled 12 deg.
 */
function addRamp(scene, world, pos, angle) {
    const w = 6, h = 0.4, d = 8;
    const rampAngle = angle ?? 0.2; // ~12 degrees

    // Physics
    const rampBody = new CANNON.Body({ mass: 0 });
    rampBody.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)));
    rampBody.position.set(pos.x, h / 2 + Math.sin(rampAngle) * d * 0.25, pos.z);
    rampBody.quaternion.setFromEulerAngles(-rampAngle, 0, 0);
    world.addBody(rampBody);

    // Visual
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.copy(rampBody.position);
    mesh.quaternion.copy(rampBody.quaternion);
    scene.add(mesh);
}
