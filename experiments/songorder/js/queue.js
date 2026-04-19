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
    // Base comparator: fairRotation then FIFO
    const baseSort = (a, b) => {
      if (this.rules.fairRotation && a.songsSung !== b.songsSung) {
        return a.songsSung - b.songsSung;
      }
      return a.submittedAtTick - b.submittedAtTick;
    };

    if (this.rules.firstTimerPriority) {
      // Separate first-timers from repeats, insert at configured position
      const firstTimers = this.entries.filter(e => e.songsSung === 0).sort(baseSort);
      const repeats = this.entries.filter(e => e.songsSung > 0).sort(baseSort);

      const insertAt = Math.min(this.rules.firstTimerInsertPos || 0, repeats.length);
      const result = [...repeats];
      result.splice(insertAt, 0, ...firstTimers);
      return result;
    }

    return [...this.entries].sort(baseSort);
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
