export class Renderer {
  constructor() {
    this.targetDisplay = document.getElementById('target-display');
    this.typingTrack = document.getElementById('typing-track');
    this.attemptDisplay = document.getElementById('attempt-display');
    this.bestAttemptEl = document.getElementById('best-attempt');
    this.milestoneHistoryEl = document.getElementById('milestone-history');
    this.stage = document.getElementById('stage');
    this.charEls = [];
    this.typingChars = [];
    this.WINDOW_SIZE = 20;
    this.recordTimeout = null;
    this.displayedMilestoneCount = 0;
  }

  buildTargetDisplay(target) {
    this.targetDisplay.innerHTML = '';
    this.charEls = [];
    for (let i = 0; i < target.length; i++) {
      const span = document.createElement('span');
      span.className = 'char ' + (i === 0 ? 'active' : 'pending');
      span.textContent = target[i];
      this.targetDisplay.appendChild(span);
      this.charEls.push(span);
    }
  }

  updateTarget(position, target) {
    for (let i = 0; i < this.charEls.length; i++) {
      const el = this.charEls[i];
      el.classList.remove('matched', 'active', 'pending', 'matched-pop');
      if (i < position) {
        el.classList.add('matched');
        if (i === position - 1) {
          el.classList.add('matched-pop');
        }
      } else if (i === position) {
        el.classList.add('active');
      } else {
        el.classList.add('pending');
      }
    }
  }

  appendTypingChar(char, matched, pop) {
    const span = document.createElement('span');
    span.className = 'typing-char ' + (matched ? 'char-match' : 'char-miss');
    if (pop && matched) {
      span.classList.add('char-match-pop');
    }
    span.textContent = char;
    this.typingTrack.appendChild(span);
    this.typingChars.push(span);

    while (this.typingChars.length > this.WINDOW_SIZE) {
      const old = this.typingChars.shift();
      old.remove();
    }
  }

  showKeypress(result) {
    this.appendTypingChar(result.char, result.matched, result.matched);
  }

  batchUpdateKey(char, wasMatch) {
    this.appendTypingChar(char, wasMatch, false);
  }

  updateAttempt(matched) {
    this.attemptDisplay.textContent = matched;
  }

  clearAttempt() {
    this.attemptDisplay.textContent = '';
  }

  clearKey() {
    this.typingTrack.innerHTML = '';
    this.typingChars = [];
  }

  getCharElement(index) {
    return this.charEls[index] || null;
  }

  updateBestAttempt(milestones) {
    if (!milestones || milestones.length === 0) {
      if (this.displayedMilestoneCount > 0) {
        this.bestAttemptEl.innerHTML = '';
        this.milestoneHistoryEl.innerHTML = '';
        this.displayedMilestoneCount = 0;
      }
      return;
    }
    if (milestones.length === this.displayedMilestoneCount) return;
    this.displayedMilestoneCount = milestones.length;

    const best = milestones[0];
    this.bestAttemptEl.innerHTML = '';
    const num = document.createElement('span');
    num.className = 'attempt-num';
    num.textContent = '#' + best.attemptNumber;
    const matched = document.createElement('span');
    matched.className = 'matched-part';
    matched.textContent = best.matchedPortion;
    this.bestAttemptEl.appendChild(num);
    this.bestAttemptEl.appendChild(matched);
    if (best.failedChar) {
      const failed = document.createElement('span');
      failed.className = 'failed-char';
      failed.textContent = best.failedChar;
      this.bestAttemptEl.appendChild(failed);
    }

    this.milestoneHistoryEl.innerHTML = '';
    for (let i = 1; i < milestones.length; i++) {
      const m = milestones[i];
      const entry = document.createElement('div');
      entry.className = 'milestone-entry';
      const entryNum = document.createElement('span');
      entryNum.className = 'attempt-num';
      entryNum.textContent = '#' + m.attemptNumber;
      const entryMatched = document.createElement('span');
      entryMatched.className = 'matched-part';
      entryMatched.textContent = m.matchedPortion;
      entry.appendChild(entryNum);
      entry.appendChild(entryMatched);
      if (m.failedChar) {
        const entryFailed = document.createElement('span');
        entryFailed.className = 'failed-char';
        entryFailed.textContent = m.failedChar;
        entry.appendChild(entryFailed);
      }
      this.milestoneHistoryEl.appendChild(entry);
    }
  }

  showCompletion(simulation) {
    this.removeCompletion();
    const banner = document.createElement('div');
    banner.className = 'completion-banner';
    banner.id = 'completion-banner';
    banner.innerHTML = `
      <h2>SUCCESS!</h2>
      <p>"${simulation.target}" found in ${simulation.totalAttempts.toLocaleString()} attempts<br>
      (${simulation.totalChars.toLocaleString()} characters typed)</p>
    `;
    this.stage.appendChild(banner);
  }

  removeCompletion() {
    const existing = document.getElementById('completion-banner');
    if (existing) existing.remove();
    const badge = document.getElementById('record-badge');
    if (badge) badge.remove();
  }

  triggerWave() {
    this.charEls.forEach((el, i) => {
      el.style.animationDelay = (i * 0.1) + 's';
      el.classList.add('wave');
      setTimeout(() => {
        el.classList.remove('wave');
        el.style.animationDelay = '';
      }, 600 + i * 100);
    });
  }

  showRecordBadge() {
    const existing = document.getElementById('record-badge');
    if (existing) existing.remove();
    const badge = document.createElement('div');
    badge.className = 'record-badge';
    badge.id = 'record-badge';
    badge.textContent = 'NEW RECORD!';
    this.stage.appendChild(badge);
    clearTimeout(this.recordTimeout);
    this.recordTimeout = setTimeout(() => badge.remove(), 1500);
  }
}
