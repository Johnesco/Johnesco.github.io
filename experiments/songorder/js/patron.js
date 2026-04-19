import { STATE, PATRON as P, SIM, NAMES, BOARD, sec } from './config.js';
import { findPath } from './pathfinding.js';

let nextId = 0;

export function resetPatronIds() {
  nextId = 0;
}

export class Patron {
  constructor(rng, grid, tick, nightNumber = 1) {
    this.id = nextId++;
    this.name = rng.pick(NAMES);
    this.nightNumber = nightNumber;
    this.color = rng.color();

    // Position — start at entrance
    const ent = grid.entrancePos;
    this.x = ent.x;
    this.y = ent.y;
    this.visualX = this.x;
    this.visualY = this.y;
    this.prevX = this.x;
    this.prevY = this.y;

    // State
    this.state = STATE.ENTERING;
    this.chairPos = null;
    this.path = null;
    this.pathIndex = 0;

    // Timing
    this.arrivalTick = tick;
    this.signupTick = null;
    this.singStartTick = null;
    this.singEndTick = null;
    this.departedTick = null;
    this.songsSung = 0;

    // Walking speed: base ± variance, converted to ticks per tile
    const speedFps = P.WALK_SPEED_FPS + (rng.float() * 2 - 1) * P.WALK_SPEED_VARIANCE_FPS;
    const tilesPerSec = speedFps / SIM.TILE_FEET;
    this.moveTicks = Math.max(2, Math.round(SIM.TPS / tilesPerSec));

    // Song duration: mean ± variance (uniform), converted to ticks
    const songSecs = P.SONG_MEAN_S + (rng.float() * 2 - 1) * P.SONG_VARIANCE_S;
    this.singDuration = sec(Math.max(60, songSecs)); // minimum 1 minute

    // Patience
    const patienceSecs = P.PATIENCE_BASE_S + (rng.float() * 2 - 1) * P.PATIENCE_VARIANCE_S;
    this.patience = sec(patienceSecs);
    this.patienceRemaining = this.patience;

    // Signup behavior
    this.willSignUp = rng.chance(P.SIGNUP_PROBABILITY);
    this.signupDelay = sec(P.FIRST_SIGNUP_MIN_S + rng.float() * (P.FIRST_SIGNUP_MAX_S - P.FIRST_SIGNUP_MIN_S));
    this.resignupDelay = sec(P.RE_SIGNUP_MIN_S + rng.float() * (P.RE_SIGNUP_MAX_S - P.RE_SIGNUP_MIN_S));
    this.signupActionTicks = sec(P.SIGNUP_ACTION_S);

    this.moveCooldown = 0;
    this.ticksInCurrentState = 0;

    // Queue tracking
    this.hasSubmittedSong = false;
    this.singTicksRemaining = 0;
    this._queueTargetKey = null; // tracks current target to detect shifts
  }

  tick(sim, tick) {
    const grid = sim.grid;
    const queue = sim.queue;
    this.ticksInCurrentState++;

    switch (this.state) {
      case STATE.ENTERING:
        this._handleEntering(grid);
        break;
      case STATE.WALKING_TO_SEAT:
        this._handleWalking(grid);
        if (this._atTarget()) this._setState(STATE.SEATED);
        break;
      case STATE.SEATED:
        this._handleSeated(sim, tick);
        break;
      case STATE.WALKING_TO_SIGNUP:
        this._updateSignupTarget(sim);
        this._handleWalking(grid);
        if (this.state === STATE.WALKING_TO_SIGNUP && this._atTarget()) {
          this._arriveAtSignupArea(sim);
        }
        break;
      case STATE.QUEUING_AT_SIGNUP:
        this._handleQueuingAtSignup(sim);
        break;
      case STATE.AT_SIGNUP:
        this._handleAtSignup(sim, tick);
        break;
      case STATE.WALKING_BACK:
        this._handleWalking(grid);
        if (this.state === STATE.WALKING_BACK && this._atTarget()) {
          this._setState(STATE.SEATED_WAITING);
        }
        break;
      case STATE.SEATED_WAITING:
        this._handleWaiting(sim);
        break;
      case STATE.CALLED_TO_STAGE:
        this._handleWalking(grid);
        if (this.state === STATE.CALLED_TO_STAGE && this._atTarget()) {
          this.singTicksRemaining = this.singDuration;
          this.singStartTick = tick;
          this._setState(STATE.SINGING);
        }
        break;
      case STATE.SINGING:
        this.singTicksRemaining--;
        if (this.singTicksRemaining <= 0) {
          this.singEndTick = tick;
          this.songsSung++;
          this.hasSubmittedSong = false;
          if (this.chairPos) {
            // Allow stage so they can walk off the stage tiles
            this.path = findPath(grid, this.x, this.y, this.chairPos.x, this.chairPos.y, { allowStage: true });
            this.pathIndex = 0;
          }
          this._setState(STATE.RETURNING_TO_SEAT);
        }
        break;
      case STATE.RETURNING_TO_SEAT:
        this._handleWalking(grid);
        if (this.state === STATE.RETURNING_TO_SEAT && this._atTarget()) {
          this._setState(STATE.SEATED);
        }
        break;
      case STATE.LEAVING:
        this._handleWalking(grid);
        break;
    }

    this._updateVisual();
  }

  callToStage(grid) {
    const stage = grid.stageCenter;
    this.path = findPath(grid, this.x, this.y, stage.x, stage.y, { allowStage: true });
    this.pathIndex = 0;
    this._setState(STATE.CALLED_TO_STAGE);
  }

  // Called by simulation when this patron reaches front of signup line
  advanceToSignup(grid) {
    const signup = grid.signupPos;
    // Stand one tile right of the signup sheet
    this.path = findPath(grid, this.x, this.y, signup.x + 1, signup.y);
    this.pathIndex = 0;
    this._setState(STATE.AT_SIGNUP);
  }

  startLeaving(sim) {
    const grid = sim.grid || sim; // handle both sim object and raw grid (backwards compat)
    const ent = grid.entrancePos;
    this.path = findPath(grid, this.x, this.y, ent.x, ent.y);
    this.pathIndex = 0;
    grid.releaseChair(this.id);
    // Leave signup line if we were in it
    if (sim.leaveSignupLine) sim.leaveSignupLine(this.id);
    this._setState(STATE.LEAVING);
  }

  isAtEntrance(grid) {
    const ent = grid.entrancePos;
    return this.x === ent.x && this.y === ent.y;
  }

  _handleEntering(grid) {
    const chair = grid.findEmptyChair(this.x, this.y);
    if (!chair) {
      // No available seats — leave (pass a minimal sim-like object)
      const ent = grid.entrancePos;
      this.path = findPath(grid, this.x, this.y, ent.x, ent.y);
      this.pathIndex = 0;
      grid.releaseChair(this.id);
      this._setState(STATE.LEAVING);
      return;
    }
    grid.occupyChair(chair, this.id);
    this.chairPos = { x: chair.x, y: chair.y };
    this.path = findPath(grid, this.x, this.y, chair.x, chair.y);
    this.pathIndex = 0;
    this._setState(STATE.WALKING_TO_SEAT);
  }

  _handleWalking() {
    if (!this.path || this.pathIndex >= this.path.length) return;
    this.moveCooldown--;
    if (this.moveCooldown > 0) return;
    this.moveCooldown = this.moveTicks;

    const step = this.path[this.pathIndex];
    this.prevX = this.x;
    this.prevY = this.y;
    this.x = step.x;
    this.y = step.y;
    this.pathIndex++;
  }

  _atTarget() {
    return !this.path || this.pathIndex >= this.path.length;
  }

  _handleSeated(sim, tick) {
    if (!this.willSignUp) return;
    if (this.hasSubmittedSong) return;

    // Rule: allow re-signup after singing?
    if (this.songsSung > 0 && !sim.rules.allowResignup) return;

    const baseDelay = this.songsSung > 0 ? this.resignupDelay : this.signupDelay;

    // Signup line discouragement: longer line → longer delay before deciding
    const lineLen = sim.getSignupLineLength();
    const lineMultiplier = 1 + lineLen * P.SIGNUP_LINE_DISCOURAGE;
    const delay = baseDelay * lineMultiplier;

    if (this.ticksInCurrentState >= delay) {
      // Walk toward signup area — DON'T join the line yet.
      // Line position is first-come-first-serve by physical arrival.
      const target = this._getSignupWalkTarget(sim);

      this._queueTargetKey = `${target.x},${target.y}`;
      this.path = findPath(sim.grid, this.x, this.y, target.x, target.y);
      this.pathIndex = 0;
      this._setState(STATE.WALKING_TO_SIGNUP);
    }
  }

  // Target for a patron walking toward signup who is NOT yet in line
  _getSignupWalkTarget(sim) {
    if (sim.isSignupFree() && sim.signupLine.length === 0) {
      // Nobody there — head to signing position (one right of sheet)
      const sp = sim.grid.signupPos;
      return { x: sp.x + 1, y: sp.y };
    }
    // Line exists — target the end of the queue
    return sim.getSignupQueuePos(sim.signupLine.length);
  }

  _updateSignupTarget(sim) {
    // Patron is walking toward signup but NOT yet in line.
    // Dynamically update target as the queue changes.
    const target = this._getSignupWalkTarget(sim);
    const targetKey = `${target.x},${target.y}`;

    if (targetKey !== this._queueTargetKey) {
      this._queueTargetKey = targetKey;
      this.path = findPath(sim.grid, this.x, this.y, target.x, target.y);
      this.pathIndex = 0;
    }
  }

  _arriveAtSignupArea(sim) {
    // We physically arrived — NOW join the line (first-come-first-serve)
    if (sim.isSignupFree() && sim.signupLine.length === 0) {
      // Nobody here — go straight to AT_SIGNUP
      sim.patronAtSignup = this.id;

      const signup = sim.grid.signupPos;
      const signX = signup.x + 1;
      if (this.x !== signX || this.y !== signup.y) {
        this.path = findPath(sim.grid, this.x, this.y, signX, signup.y);
        this.pathIndex = 0;
      }
      this._setState(STATE.AT_SIGNUP);
    } else {
      // Line exists or someone is signing up — join the back of the line
      sim.joinSignupLine(this.id);
      const idx = sim.signupLine.indexOf(this.id);
      const target = sim.getSignupQueuePos(idx);
      this._queueTargetKey = `${target.x},${target.y}`;

      if (this.x !== target.x || this.y !== target.y) {
        this.path = findPath(sim.grid, this.x, this.y, target.x, target.y);
        this.pathIndex = 0;
      }
      this._setState(STATE.QUEUING_AT_SIGNUP);
    }
  }

  _handleQueuingAtSignup(sim) {
    const grid = sim.grid;

    // Update our queue position (line may have shifted)
    const idx = sim.signupLine.indexOf(this.id);
    if (idx < 0) {
      // We got removed from the line (closing, etc) — go back to seat
      this._queueTargetKey = null;
      if (this.chairPos) {
        this.path = findPath(grid, this.x, this.y, this.chairPos.x, this.chairPos.y);
        this.pathIndex = 0;
      }
      this._setState(STATE.WALKING_BACK);
      return;
    }

    // Walk to our current queue position — repath immediately if target changed
    const target = sim.getSignupQueuePos(idx);
    const targetKey = `${target.x},${target.y}`;

    if (targetKey !== this._queueTargetKey) {
      // Line shifted — repath now, don't wait to finish old path
      this._queueTargetKey = targetKey;
      if (this.x !== target.x || this.y !== target.y) {
        this.path = findPath(grid, this.x, this.y, target.x, target.y);
        this.pathIndex = 0;
      }
    }

    if (this.x !== target.x || this.y !== target.y) {
      this._handleWalking(grid);
    }

    // Note: actual advancement to AT_SIGNUP is handled by sim._manageSignupLine()
  }

  _handleAtSignup(sim, tick) {
    // Walk to the signing position first (one right of sheet)
    if (!this._atTarget()) {
      this._handleWalking(sim.grid);
      this.ticksInCurrentState = 0; // don't start signup timer while walking
      return;
    }

    if (this.ticksInCurrentState >= this.signupActionTicks) {
      sim.queue.submit(this.id, tick, this.name, this.songsSung);
      this.hasSubmittedSong = true;
      this.signupTick = this.signupTick ?? tick;
      this._queueTargetKey = null;

      // Leave the signup — sim will advance the next person
      sim.patronAtSignup = null;

      if (this.chairPos) {
        this.path = findPath(sim.grid, this.x, this.y, this.chairPos.x, this.chairPos.y);
        this.pathIndex = 0;
      }
      this._setState(STATE.WALKING_BACK);
    }
  }

  _handleWaiting(sim) {
    // Patrons who see their name in the top slots on the board wait much longer
    const pos = sim.queue.getPosition(this.id);
    if (pos >= 0 && pos < BOARD.VISIBLE_SLOTS) {
      // Visible on the board — patience drains slowly
      this.patienceRemaining -= BOARD.PATIENCE_MULTIPLIER;
    } else {
      this.patienceRemaining--;
    }

    // Rule: if mustSingFirst is OFF, allow re-submitting while waiting
    if (!sim.rules.mustSingFirst && this.willSignUp && !this.hasSubmittedSong) {
      // Already sang and submitted flag was cleared — go sign up again
      if (this.ticksInCurrentState >= this.resignupDelay) {
        this._setState(STATE.SEATED);
      }
    }
  }

  _setState(newState) {
    this.state = newState;
    this.ticksInCurrentState = 0;
  }

  _updateVisual() {
    const lerpFactor = 0.18;
    const dx = this.x - this.visualX;
    const dy = this.y - this.visualY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      this.visualX = this.x;
      this.visualY = this.y;
    } else {
      this.visualX += dx * lerpFactor;
      this.visualY += dy * lerpFactor;
    }
  }
}
