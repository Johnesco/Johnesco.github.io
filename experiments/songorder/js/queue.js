// Rule-based queue — a single queue class that sorts entries
// based on active rotation rules (replaces the old 3-class system)

export class RuleBasedQueue {
  constructor(rules) {
    this.rules = { ...rules };
    this.entries = [];
    this.history = [];
  }

  submit(patronId, tick, patronName = '?', songsSung = 0) {
    this.entries.push({ patronId, patronName, songsSung, submittedAtTick: tick });
  }

  // Sort entries by active rules, returning priority-ordered list
  _sorted() {
    return [...this.entries].sort((a, b) => {
      // 1. First-timer priority: songsSung === 0 goes before > 0
      if (this.rules.firstTimerPriority) {
        const aNew = a.songsSung === 0 ? 0 : 1;
        const bNew = b.songsSung === 0 ? 0 : 1;
        if (aNew !== bNew) return aNew - bNew;
      }

      // 2. Fair rotation: fewer songs sung goes first
      if (this.rules.fairRotation) {
        if (a.songsSung !== b.songsSung) return a.songsSung - b.songsSung;
      }

      // 3. FIFO fallback — earlier submission goes first
      return a.submittedAtTick - b.submittedAtTick;
    });
  }

  peekNext() {
    const sorted = this._sorted();
    return sorted.length > 0 ? sorted[0] : null;
  }

  remove(patronId) {
    this.entries = this.entries.filter(e => e.patronId !== patronId);
  }

  getPosition(patronId) {
    return this._sorted().findIndex(e => e.patronId === patronId);
  }

  size() {
    return this.entries.length;
  }

  getEntries() {
    return this._sorted();
  }

  recordCall(entry, tick, noShow = false) {
    const waitTicks = tick - entry.submittedAtTick;
    this.history.push({
      patronId: entry.patronId,
      patronName: entry.patronName,
      submittedAtTick: entry.submittedAtTick,
      calledAtTick: tick,
      waitTicks,
      noShow,
    });
    return { ...entry, waitTicks };
  }
}
