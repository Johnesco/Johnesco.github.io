import { STATE, SPAWN, DEFAULT_RULES, DEFAULT_VENUE_SIZE, PHASE, SESSION, KJ as KJ_CFG, getArrivalRate, sec } from './config.js';
import { Grid } from './grid.js';
import { Rng } from './rng.js';
import { RuleBasedQueue } from './queue.js';
import { Patron, resetPatronIds } from './patron.js';

export class Simulation {
  constructor(seed, rules = DEFAULT_RULES, venueSize = DEFAULT_VENUE_SIZE) {
    this.seed = seed;
    this.rules = { ...rules };
    this.venueSize = venueSize;
    this.rng = new Rng(seed);
    this.grid = new Grid(venueSize);
    this.queue = new RuleBasedQueue(this.rules);
    this.maxPatrons = Math.max(10, Math.round(this.grid.totalChairs() * 0.55));
    this.patrons = [];
    this.departed = []; // patrons who left (for analytics)
    this.tick = 0;
    this.currentSingerId = null;
    this.stageOccupiedTicks = 0;
    this.totalPatronsSpawned = 0;

    // Night lifecycle
    this.nightNumber = 1;
    this.phase = PHASE.OPEN;
    this.nightDurationTicks = SESSION.DURATION_TICKS;
    this.lastCallTick = SESSION.LAST_CALL_TICKS;

    // KJ state machine
    this.kj = {
      state: 'IDLE',        // IDLE, CALLING, NO_SHOW
      announcement: '',
      timer: 0,
      currentEntry: null,   // queue entry being processed
    };

    // Signup line — physical queue at the signup sheet
    this.signupLine = [];        // patron IDs in order
    this.patronAtSignup = null;  // ID of patron currently writing on the sheet

    resetPatronIds();
  }

  step() {
    if (this.phase === PHASE.ENDED) return;

    this.tick++;

    // Phase transitions
    this._updatePhase();

    // 1. Spawn new patrons (only during OPEN phase)
    this._trySpawn();

    // 2. Track singer state + KJ handles queue
    this._processQueue();

    // 3. Update all patrons (pass sim so they can check signup line)
    for (const patron of this.patrons) {
      patron.tick(this, this.tick);
    }

    // 4. Manage signup line — advance queue after patron ticks
    this._manageSignupLine();

    // 5. Track stage utilization
    if (this.currentSingerId !== null) {
      this.stageOccupiedTicks++;
    }

    // 6. Handle patience timeouts (patron leaves, but stays in queue — KJ discovers no-show)
    this._handlePatience();

    // 7. Handle closing — force remaining patrons to leave
    if (this.phase === PHASE.CLOSING) {
      this._handleClosing();
    }

    // 8. Clean up departed patrons
    this._cleanup();
  }

  // ── Signup line management ──

  joinSignupLine(patronId) {
    if (!this.signupLine.includes(patronId)) {
      this.signupLine.push(patronId);
    }
    return this.signupLine.indexOf(patronId);
  }

  leaveSignupLine(patronId) {
    const idx = this.signupLine.indexOf(patronId);
    if (idx >= 0) this.signupLine.splice(idx, 1);
    if (this.patronAtSignup === patronId) this.patronAtSignup = null;
  }

  getSignupLineLength() {
    return this.signupLine.length + (this.patronAtSignup !== null ? 1 : 0);
  }

  isSignupFree() {
    return this.patronAtSignup === null;
  }

  isFirstInLine(patronId) {
    return this.signupLine.length > 0 && this.signupLine[0] === patronId;
  }

  // Queue positions: line forms right of signup, turns down at the wall
  getSignupQueuePos(index) {
    const base = this.grid.signupPos;
    if (!base) return { x: 0, y: 0 };

    const startX = base.x + 2;           // first slot right of active signer
    const maxX = this.grid.w - 2;        // last floor col before wall
    const rightSlots = maxX - startX + 1; // slots going right

    if (index < rightSlots) {
      return { x: startX + index, y: base.y };
    }
    // Turn downward along the right wall
    const downIndex = index - rightSlots;
    return { x: maxX, y: base.y + 1 + downIndex };
  }

  _manageSignupLine() {
    // Clean departed/leaving patrons from the line
    this.signupLine = this.signupLine.filter(id => {
      const p = this.getPatron(id);
      return p && p.state !== STATE.LEAVING;
    });

    // Check if current signup user is done
    if (this.patronAtSignup !== null) {
      const p = this.getPatron(this.patronAtSignup);
      if (!p || p.state !== STATE.AT_SIGNUP) {
        this.patronAtSignup = null;
      }
    }

    // Advance next in line if signup is free
    if (this.patronAtSignup === null && this.signupLine.length > 0) {
      const nextId = this.signupLine[0];
      const next = this.getPatron(nextId);
      if (next && next.state === STATE.QUEUING_AT_SIGNUP) {
        // Check they're close enough to the signing position (within 3 tiles)
        const signup = this.grid.signupPos;
        const signX = signup.x + 1; // signing position is one right of sheet
        const dist = Math.abs(next.x - signX) + Math.abs(next.y - signup.y);
        if (dist <= 3) {
          this.signupLine.shift();
          next.advanceToSignup(this.grid);
          this.patronAtSignup = next.id;
        }
      }
    }
  }

  // ── Phase management ──

  _updatePhase() {
    if (this.phase === PHASE.OPEN && this.tick >= this.lastCallTick) {
      this.phase = PHASE.LAST_CALL;
    }

    if (this.phase === PHASE.LAST_CALL) {
      const stageEmpty = this.currentSingerId === null;
      const queueEmpty = this.queue.size() === 0;
      const pastClose = this.tick >= this.nightDurationTicks;
      if ((stageEmpty && queueEmpty) || pastClose) {
        this.phase = PHASE.CLOSING;
        this.kj.state = 'IDLE';
        this.kj.announcement = '';
        this.kj.currentEntry = null;
      }
    }

    if (this.phase === PHASE.CLOSING && this.patrons.length === 0) {
      this.phase = PHASE.ENDED;
    }
  }

  _trySpawn() {
    if (this.phase !== PHASE.OPEN) return;
    if (this.patrons.length >= this.maxPatrons) return;

    const progress = this.tick / this.nightDurationTicks;
    const multiplier = getArrivalRate(progress);
    const rate = multiplier * SPAWN.PEAK_RATE;

    if (rate > 0 && this.rng.chance(rate)) {
      const patron = new Patron(this.rng, this.grid, this.tick, this.nightNumber);
      this.patrons.push(patron);
      this.totalPatronsSpawned++;
    }
  }

  _processQueue() {
    if (this.currentSingerId !== null) {
      const singer = this.getPatron(this.currentSingerId);
      if (!singer || (singer.state !== STATE.SINGING && singer.state !== STATE.CALLED_TO_STAGE)) {
        this.currentSingerId = null;
      }
    }

    if (this.currentSingerId === null) {
      const onStage = this.patrons.find(p => p.state === STATE.SINGING || p.state === STATE.CALLED_TO_STAGE);
      if (onStage) {
        this.currentSingerId = onStage.id;
        return;
      }
    }

    this._updateKJ();
  }

  _updateKJ() {
    const kj = this.kj;

    if (this.phase === PHASE.CLOSING || this.phase === PHASE.ENDED) {
      if (kj.state !== 'IDLE') {
        kj.state = 'IDLE';
        kj.announcement = '';
        kj.currentEntry = null;
      }
      return;
    }

    switch (kj.state) {
      case 'IDLE': {
        if (this.currentSingerId !== null) break;
        if (this.queue.size() === 0) break;

        const entry = this.queue.peekNext();
        if (!entry) break;

        kj.currentEntry = entry;

        const patron = this.getPatron(entry.patronId);
        const isPresent = patron && patron.state !== STATE.LEAVING;

        if (isPresent) {
          const template = this.rng.pick(KJ_CFG.CALLOUTS);
          kj.announcement = template.replace('$', entry.patronName);
          kj.state = 'CALLING';
          kj.timer = sec(KJ_CFG.CALL_DELAY_S);
        } else {
          kj.announcement = `${entry.patronName}? Are you here?`;
          kj.state = 'NO_SHOW';
          kj.timer = sec(KJ_CFG.NO_SHOW_WAIT_S);
        }
        break;
      }

      case 'CALLING': {
        kj.timer--;
        if (kj.timer <= 0) {
          const entry = kj.currentEntry;
          const patron = this.getPatron(entry.patronId);

          if (patron && patron.state !== STATE.LEAVING) {
            this.queue.remove(entry.patronId);
            this.queue.recordCall(entry, this.tick);
            patron.callToStage(this.grid);
            this.currentSingerId = patron.id;
          } else {
            kj.announcement = `${entry.patronName}? Are you here?`;
            kj.state = 'NO_SHOW';
            kj.timer = sec(KJ_CFG.NO_SHOW_WAIT_S);
            break;
          }

          kj.state = 'IDLE';
          kj.announcement = '';
          kj.currentEntry = null;
        }
        break;
      }

      case 'NO_SHOW': {
        kj.timer--;
        const total = sec(KJ_CFG.NO_SHOW_WAIT_S);
        const progress = 1 - kj.timer / total;

        if (progress < 0.35) {
          kj.announcement = `${kj.currentEntry.patronName}? Are you here?`;
        } else if (progress < 0.65) {
          kj.announcement = 'Going once...';
        } else if (progress < 0.90) {
          kj.announcement = 'Going twice...';
        } else {
          kj.announcement = `Skipping ${kj.currentEntry.patronName}!`;
        }

        if (kj.timer <= 0) {
          const entry = kj.currentEntry;
          this.queue.remove(entry.patronId);
          this.queue.recordCall(entry, this.tick, true);

          kj.state = 'IDLE';
          kj.announcement = '';
          kj.currentEntry = null;
        }
        break;
      }
    }
  }

  _handlePatience() {
    for (const patron of this.patrons) {
      if (patron.state === STATE.SEATED_WAITING) {
        if (patron.patienceRemaining <= 0) {
          patron.hasSubmittedSong = false;
          patron.startLeaving(this);
          patron.departedTick = this.tick;
        }
      }
    }
  }

  _handleClosing() {
    for (const patron of this.patrons) {
      if (patron.state === STATE.SINGING || patron.state === STATE.CALLED_TO_STAGE || patron.state === STATE.LEAVING) {
        continue;
      }
      patron.hasSubmittedSong = false;
      patron.departedTick = patron.departedTick ?? this.tick;
      patron.startLeaving(this);
    }
  }

  _cleanup() {
    const staying = [];
    for (const patron of this.patrons) {
      if (patron.state === STATE.LEAVING && patron.isAtEntrance(this.grid) && patron._atTarget()) {
        patron.departedTick = patron.departedTick ?? this.tick;
        this.departed.push(patron);
        this.leaveSignupLine(patron.id);
        if (this.currentSingerId === patron.id) {
          this.currentSingerId = null;
        }
      } else {
        staying.push(patron);
      }
    }
    this.patrons = staying;
  }

  advanceNight() {
    this.nightNumber++;
    this.tick = 0;
    this.phase = PHASE.OPEN;
    this.currentSingerId = null;

    // Reset KJ
    this.kj = { state: 'IDLE', announcement: '', timer: 0, currentEntry: null };

    // Reset signup line
    this.signupLine = [];
    this.patronAtSignup = null;

    // Reset grid but keep the same layout
    this.grid.resetOccupancy();

    // Reset queue entries but keep history for analytics
    const history = this.queue.history;
    this.queue = new RuleBasedQueue(this.rules);
    this.queue.history = history;

    // Clear active patrons (departed are kept for analytics)
    this.patrons = [];
  }

  isNightOver() {
    return this.phase === PHASE.ENDED;
  }

  getWallClock() {
    const totalSeconds = this.tick / 60;
    const totalHours = totalSeconds / 3600;
    const hour24 = (SESSION.OPEN_HOUR + totalHours) % 24;
    const h = Math.floor(hour24);
    const m = Math.floor((hour24 - h) * 60);
    const hour12 = h % 12 || 12;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  getPatron(id) {
    return this.patrons.find(p => p.id === id) || null;
  }

  findPatron(id) {
    return this.patrons.find(p => p.id === id) || this.departed.find(p => p.id === id) || null;
  }

  getAllPatrons() {
    return [...this.patrons, ...this.departed];
  }

  getStageUtilization() {
    if (this.tick === 0) return 0;
    return this.stageOccupiedTicks / this.tick;
  }
}
