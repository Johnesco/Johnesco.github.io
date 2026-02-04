export class HistoryTracker {
  constructor() {
    this.milestones = [];
  }

  addAttempt(result) {
    const streakLength = result.streakLength;
    const failedChar = result.char || result.failedChar || '?';
    const matchedPortion = result.matchedPortion || '';

    for (let len = 1; len <= streakLength; len++) {
      if (!this.milestones[len]) {
        this.milestones[len] = {
          attemptNumber: result.attemptNumber,
          streakLength: len,
          matchedPortion: matchedPortion.slice(0, len),
          failedChar: len === streakLength ? failedChar : null,
        };
      }
    }
  }

  addAttempts(resetEvents) {
    for (const event of resetEvents) {
      this.addAttempt(event);
    }
  }

  getMilestones() {
    const result = [];
    for (let i = this.milestones.length - 1; i >= 1; i--) {
      if (this.milestones[i]) result.push(this.milestones[i]);
    }
    return result;
  }

  clear() {
    this.milestones = [];
  }
}
