import { SIM, TILE, STATE, COLORS, PHASE } from './config.js';

const NOTE_CHARS = ['\u266A', '\u266B', '\u266C']; // ♪ ♫ ♬

const TILE_COLORS = {
  [TILE.FLOOR]: COLORS.FLOOR,
  [TILE.WALL]: COLORS.WALL,
  [TILE.TABLE]: COLORS.TABLE,
  [TILE.CHAIR]: COLORS.CHAIR,
  [TILE.STAGE]: COLORS.STAGE,
  [TILE.SIGNUP]: COLORS.SIGNUP,
  [TILE.ENTRANCE]: COLORS.ENTRANCE,
};

// ── Thought bubble system ──
// Wall-clock duration so thoughts are readable at any sim speed
const THOUGHT_MS = 2500;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const THOUGHTS = {
  [STATE.WALKING_TO_SEAT]: ['Ooh, karaoke!', 'This looks fun!', 'Found a spot!', 'Let\'s go!', 'Exciting!'],
  [STATE.SEATED]:          ['Nice spot!', 'What should I sing?', 'Good vibes', 'Love this place'],
  [STATE.WALKING_TO_SIGNUP]: ['Gonna sign up!', 'I know the song!', 'My turn to sign up!'],
  [STATE.QUEUING_AT_SIGNUP]: ['The line...', 'Almost my turn', 'C\'mon, hurry up', 'So many people'],
  [STATE.AT_SIGNUP]:       ['Hmm, this one!', 'Perfect song!', 'Decisions...'],
  [STATE.WALKING_BACK]:    ['Now we wait...', 'Can\'t wait!', 'Fingers crossed!'],
  [STATE.CALLED_TO_STAGE]: ['That\'s me!!', 'Here I go!', 'Wish me luck!', 'My moment!'],
  [STATE.RETURNING_TO_SEAT]: ['Nailed it!', 'That was great!', 'What a rush!', 'Encore!'],
};

const THOUGHTS_RE_SEATED   = ['One more!', 'Again!', 'That was so fun', 'Maybe another?'];
const THOUGHTS_LEAVE_TIRED = ['Too slow...', 'I give up', 'Forget this', 'Done waiting'];
const THOUGHTS_LEAVE_CLOSE = ['Good night!', 'Great time!', 'See ya!', 'Fun night!'];

export class Renderer {
  constructor(canvas, grid) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Compute tile size to fit within max canvas width
    this.ts = Math.min(SIM.MAX_TILE_SIZE, Math.floor(SIM.MAX_CANVAS_W / grid.w));
    this.canvasW = this.ts * grid.w;
    this.canvasH = this.ts * grid.h;

    canvas.width = this.canvasW;
    canvas.height = this.canvasH;

    this.particles = [];

    // HTML overlay for dynamic elements (patrons, KJ, bubbles)
    const container = canvas.parentElement;
    container.style.position = 'relative';

    // Remove old overlay if re-initializing
    const old = container.querySelector('#sim-overlay');
    if (old) old.remove();

    this.overlay = document.createElement('div');
    this.overlay.id = 'sim-overlay';
    container.appendChild(this.overlay);

    // Element pools
    this.patronEls = new Map(); // patronId → DOM element
    this.kjEl = null;
    this.kjBubbleEl = null;

    this._initKJ();
  }

  _initKJ() {
    this.kjEl = document.createElement('div');
    this.kjEl.className = 'entity kj';
    const label = document.createElement('span');
    label.className = 'kj-text';
    label.textContent = 'KJ';
    this.kjEl.appendChild(label);
    this.overlay.appendChild(this.kjEl);

    this.kjBubbleEl = document.createElement('div');
    this.kjBubbleEl.className = 'kj-bubble hidden';
    this.overlay.appendChild(this.kjBubbleEl);
  }

  draw(sim) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvasW, this.canvasH);

    // ── Canvas layers ──
    this._drawGrid(sim.grid);
    this._drawPhaseOverlay(sim);
    this._spawnNotes(sim);
    this._updateAndDrawParticles();

    // ── HTML layers ──
    this._syncPatrons(sim);
    this._syncKJ(sim);
    this._syncBubble(sim);
  }

  // ────────────────────────────────────────────
  // Canvas: Grid
  // ────────────────────────────────────────────

  _drawGrid(grid) {
    const ctx = this.ctx;
    const ts = this.ts;

    for (let y = 0; y < grid.h; y++) {
      for (let x = 0; x < grid.w; x++) {
        const tile = grid.tileAt(x, y);
        const px = x * ts;
        const py = y * ts;

        ctx.fillStyle = TILE_COLORS[tile] || COLORS.FLOOR;
        ctx.fillRect(px, py, ts, ts);

        if (tile === TILE.TABLE) {
          this._drawTable(ctx, px, py, ts);
        } else if (tile === TILE.CHAIR) {
          this._drawChair(ctx, px, py, ts);
        } else if (tile === TILE.STAGE) {
          this._drawStageTile(ctx, px, py, ts);
        } else if (tile === TILE.SIGNUP) {
          this._drawSignupSheet(ctx, px, py, ts);
        } else if (tile === TILE.ENTRANCE) {
          this._drawEntrance(ctx, px, py, ts);
        }

        ctx.strokeStyle = 'rgba(255,255,255,0.025)';
        ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
      }
    }

    if (grid.stageCenter) {
      ctx.fillStyle = 'rgba(180, 140, 240, 0.4)';
      ctx.font = `${Math.max(8, ts * 0.4)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('STAGE', grid.stageCenter.x * ts + ts / 2, grid.stageCenter.y * ts + ts / 2);
    }
  }

  _drawTable(ctx, px, py, ts) {
    const cx = px + ts / 2;
    const cy = py + ts / 2;
    const r = ts / 2 - 3;

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.arc(cx + 1, cy + 1, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5a4a38';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6a5a48';
    ctx.beginPath();
    ctx.arc(cx - 1, cy - 1, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawChair(ctx, px, py, ts) {
    const inset = Math.round(ts * 0.32);
    const size = ts - inset * 2;
    const r = 3;
    ctx.fillStyle = 'rgba(60, 60, 80, 0.35)';
    ctx.beginPath();
    ctx.roundRect(px + inset, py + inset, size, size, r);
    ctx.fill();
  }

  _drawStageTile(ctx, px, py, ts) {
    ctx.fillStyle = 'rgba(140, 100, 200, 0.06)';
    ctx.fillRect(px, py, ts, ts);
  }

  _drawSignupSheet(ctx, px, py, ts) {
    const cx = px + ts / 2;
    const cy = py + ts / 2;

    // Document background
    const w = Math.round(ts * 0.5), h = Math.round(ts * 0.64);
    ctx.fillStyle = '#d8d0c0';
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, cy - h / 2);
    ctx.lineTo(cx + w / 2 - 4, cy - h / 2);
    ctx.lineTo(cx + w / 2, cy - h / 2 + 4);
    ctx.lineTo(cx + w / 2, cy + h / 2);
    ctx.lineTo(cx - w / 2, cy + h / 2);
    ctx.closePath();
    ctx.fill();

    // Folded corner
    ctx.fillStyle = '#b8b0a0';
    ctx.beginPath();
    ctx.moveTo(cx + w / 2 - 4, cy - h / 2);
    ctx.lineTo(cx + w / 2 - 4, cy - h / 2 + 4);
    ctx.lineTo(cx + w / 2, cy - h / 2 + 4);
    ctx.closePath();
    ctx.fill();

    // Text lines
    ctx.strokeStyle = '#888070';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const ly = cy - 4 + i * 4;
      ctx.beginPath();
      ctx.moveTo(cx - 4, ly);
      ctx.lineTo(cx + 4, ly);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  }

  _drawEntrance(ctx, px, py, ts) {
    ctx.fillStyle = 'rgba(100, 180, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(px + ts / 2, py + 6);
    ctx.lineTo(px + ts - 8, py + ts - 6);
    ctx.lineTo(px + 8, py + ts - 6);
    ctx.fill();
  }

  // ────────────────────────────────────────────
  // Canvas: Phase Overlay
  // ────────────────────────────────────────────

  _drawPhaseOverlay(sim) {
    if (sim.phase === PHASE.LAST_CALL) {
      this.ctx.fillStyle = 'rgba(255, 170, 50, 0.04)';
      this.ctx.fillRect(0, 0, this.canvasW, this.canvasH);
    } else if (sim.phase === PHASE.CLOSING || sim.phase === PHASE.ENDED) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      this.ctx.fillRect(0, 0, this.canvasW, this.canvasH);
    }
  }

  // ────────────────────────────────────────────
  // Canvas: Music Note Particles
  // ────────────────────────────────────────────

  _spawnNotes(sim) {
    const ts = this.ts;
    for (const patron of sim.patrons) {
      if (patron.state !== STATE.SINGING) continue;

      const px = patron.visualX * ts + ts / 2;
      const py = patron.visualY * ts + ts / 2;

      if (Math.random() < 0.13) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.4 + Math.random() * 0.6;
        this.particles.push({
          x: px,
          y: py,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          life: 1.0,
          decay: 0.012 + Math.random() * 0.008,
          char: NOTE_CHARS[Math.floor(Math.random() * NOTE_CHARS.length)],
          color: patron.color,
          size: 10 + Math.random() * 6,
        });
      }
    }
  }

  _updateAndDrawParticles() {
    const ctx = this.ctx;
    const alive = [];

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) continue;
      alive.push(p);

      ctx.globalAlpha = p.life * 0.7;
      ctx.fillStyle = p.color;
      ctx.font = `${Math.round(p.size)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.char, p.x, p.y);
    }

    ctx.globalAlpha = 1.0;
    this.particles = alive;
  }

  // ────────────────────────────────────────────
  // HTML: Patron Elements + Thought Bubbles
  // ────────────────────────────────────────────

  _syncPatrons(sim) {
    const ts = this.ts;
    const activeIds = new Set();
    const now = performance.now();
    const halfDot = 10; // patron dot CSS is 20px wide

    for (const patron of sim.patrons) {
      activeIds.add(patron.id);

      let el = this.patronEls.get(patron.id);
      if (!el) {
        el = this._createPatronEl(patron);
        this.patronEls.set(patron.id, el);
        this.overlay.appendChild(el);
      }

      // Position via transform (GPU composited)
      const px = patron.visualX * ts + ts / 2;
      const py = patron.visualY * ts + ts / 2;
      el.style.transform = `translate(${px - halfDot}px, ${py - halfDot}px)`;

      // Singing glow
      const singing = patron.state === STATE.SINGING;
      if (singing !== el._wasSinging) {
        el.classList.toggle('singing', singing);
        el._wasSinging = singing;
      }

      // Queue number
      const numEl = el.querySelector('.queue-num');
      if (patron.state === STATE.SEATED_WAITING || patron.state === STATE.WALKING_BACK) {
        const pos = sim.queue.getPosition(patron.id);
        if (pos >= 0) {
          numEl.textContent = pos + 1;
          numEl.classList.remove('hidden');
        } else {
          numEl.classList.add('hidden');
        }
      } else {
        numEl.classList.add('hidden');
      }

      // ── Thought bubble ──
      const thoughtEl = el._thoughtEl;
      const stateChanged = patron.state !== el._lastState;
      el._lastState = patron.state;

      if (stateChanged) {
        const text = this._pickThought(patron, sim);
        if (text) {
          thoughtEl.textContent = text;
          thoughtEl.classList.remove('hidden');
          el._thoughtExpiry = now + THOUGHT_MS;
        } else {
          // Singing / no-thought states: clear immediately
          thoughtEl.classList.add('hidden');
          el._thoughtExpiry = 0;
        }
      }

      // Expire old thoughts
      if (el._thoughtExpiry > 0 && now > el._thoughtExpiry) {
        thoughtEl.classList.add('hidden');
        el._thoughtExpiry = 0;
      }
    }

    // Remove elements for departed patrons
    for (const [id, el] of this.patronEls) {
      if (!activeIds.has(id)) {
        el.remove();
        this.patronEls.delete(id);
      }
    }
  }

  _pickThought(patron, sim) {
    const s = patron.state;

    // Singing — no thought, music notes are the visual
    if (s === STATE.SINGING) return null;

    // Entering is 1 tick, too brief — skip
    if (s === STATE.ENTERING) return null;

    // Seated after singing vs first time
    if (s === STATE.SEATED) {
      return patron.songsSung > 0 ? pick(THOUGHTS_RE_SEATED) : pick(THOUGHTS[STATE.SEATED]);
    }

    // Leaving: distinguish patience timeout vs closing time
    if (s === STATE.LEAVING) {
      const closing = sim.phase === PHASE.CLOSING || sim.phase === PHASE.ENDED;
      return closing ? pick(THOUGHTS_LEAVE_CLOSE) : pick(THOUGHTS_LEAVE_TIRED);
    }

    // Standard state thoughts
    const options = THOUGHTS[s];
    return options ? pick(options) : null;
  }

  _createPatronEl(patron) {
    const el = document.createElement('div');
    el.className = 'patron';
    el.style.backgroundColor = patron.color;
    el._wasSinging = false;
    el._lastState = -1;
    el._thoughtExpiry = 0;

    const num = document.createElement('span');
    num.className = 'queue-num hidden';
    el.appendChild(num);

    const name = document.createElement('span');
    name.className = 'patron-name';
    name.textContent = patron.name;
    el.appendChild(name);

    const thought = document.createElement('div');
    thought.className = 'thought hidden';
    el.appendChild(thought);
    el._thoughtEl = thought;

    return el;
  }

  // ────────────────────────────────────────────
  // HTML: KJ Element
  // ────────────────────────────────────────────

  _syncKJ(sim) {
    const ts = this.ts;
    const pos = sim.grid.signupPos;
    if (!pos) {
      this.kjEl.classList.add('hidden');
      return;
    }

    this.kjEl.classList.remove('hidden');
    // KJ stands one tile left of the signup sheet
    const px = (pos.x - 1) * ts + ts / 2;
    const py = pos.y * ts + ts / 2;
    this.kjEl.style.transform = `translate(${px - 13}px, ${py - 13}px)`;
  }

  _syncBubble(sim) {
    const ts = this.ts;
    const kj = sim.kj;
    const pos = sim.grid.signupPos;

    if (!kj.announcement || !pos) {
      this.kjBubbleEl.classList.add('hidden');
      return;
    }

    this.kjBubbleEl.classList.remove('hidden');
    this.kjBubbleEl.textContent = kj.announcement;

    // Bubble below the KJ (one tile left of signup)
    const px = (pos.x - 1) * ts + ts / 2;
    const py = pos.y * ts + ts / 2;
    this.kjBubbleEl.style.left = px + 'px';
    this.kjBubbleEl.style.top = (py + 20) + 'px';

    const isNoShow = kj.state === 'NO_SHOW';
    if (isNoShow !== this.kjBubbleEl._wasNoShow) {
      this.kjBubbleEl.classList.toggle('no-show', isNoShow);
      this.kjBubbleEl._wasNoShow = isNoShow;
    }
  }
}
