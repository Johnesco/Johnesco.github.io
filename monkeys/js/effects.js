import { PARTICLES } from './config.js';

export class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.resize();
    this.animating = false;
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
  }

  emitMatch(charEl, intensity = 0) {
    if (!charEl) return;
    const rect = charEl.getBoundingClientRect();
    const canvasRect = this.canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2 - canvasRect.left;
    const cy = rect.top + rect.height / 2 - canvasRect.top;

    const count = Math.round(PARTICLES.MATCH_COUNT + intensity * 32);
    const speedMul = 1 + intensity;
    const sizeMul = 1 + intensity;
    const colors = ['#00ff88', '#00cc66', '#88ffbb', '#d4a537'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = (2 + Math.random() * 3) * speedMul;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: (2 + Math.random() * 3) * sizeMul,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: (0.02 + Math.random() * 0.02) / (1 + intensity),
      });
    }
    this.ensureAnimating();
  }

  emitCelebration() {
    const w = this.canvas.width;
    const colors = ['#00ff88', '#d4a537', '#ff4455', '#4488ff', '#ff88ff', '#ffffff'];

    for (let i = 0; i < PARTICLES.SUCCESS_COUNT; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: -10 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 6,
        vy: 1 + Math.random() * 3,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.005 + Math.random() * 0.008,
      });
    }
    this.ensureAnimating();
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += PARTICLES.GRAVITY;
      p.vx *= PARTICLES.FRICTION;
      p.vy *= PARTICLES.FRICTION;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > this.canvas.height + 20) {
        this.particles.splice(i, 1);
      }
    }

    if (this.particles.length > PARTICLES.MAX_ACTIVE) {
      this.particles.length = PARTICLES.MAX_ACTIVE;
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const p of this.particles) {
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    this.ctx.globalAlpha = 1;
  }

  ensureAnimating() {
    if (this.animating) return;
    this.animating = true;
    this.tick();
  }

  tick() {
    if (this.particles.length === 0) {
      this.animating = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }
    this.update();
    this.draw();
    requestAnimationFrame(() => this.tick());
  }

  clear() {
    this.particles = [];
    this.animating = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
