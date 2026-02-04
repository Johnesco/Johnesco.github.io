export class StatsDisplay {
  constructor() {
    this.attemptEl = document.getElementById('stat-attempt');
    this.charsEl = document.getElementById('stat-chars');
    this.streakEl = document.getElementById('stat-streak');
    this.bestStreakEl = document.getElementById('stat-best-streak');
    this.probEl = document.getElementById('probability-explanation');
  }

  update(simulation) {
    const s = simulation.getStats();
    this.attemptEl.textContent = s.totalAttempts.toLocaleString();
    this.charsEl.textContent = s.totalChars.toLocaleString();
    this.streakEl.textContent = s.position;
    this.bestStreakEl.textContent = s.bestStreak;
  }

  updateProbability(simulation) {
    const p = simulation.getProbability();
    const oneInX = p.oneInX;

    let formattedOdds;
    if (oneInX > 1e12) {
      formattedOdds = oneInX.toExponential(2);
    } else {
      formattedOdds = oneInX.toLocaleString();
    }

    const monkeyMinutes = oneInX / 5;
    let monkeyTime;
    if (monkeyMinutes < 60) {
      monkeyTime = Math.round(monkeyMinutes) + ' minutes';
    } else if (monkeyMinutes < 60 * 24) {
      monkeyTime = Math.round(monkeyMinutes / 60) + ' hours';
    } else if (monkeyMinutes < 60 * 24 * 365) {
      monkeyTime = Math.round(monkeyMinutes / (60 * 24)) + ' days';
    } else {
      const years = monkeyMinutes / (60 * 24 * 365);
      if (years > 1e6) {
        monkeyTime = years.toExponential(1) + ' years';
      } else {
        monkeyTime = Math.round(years).toLocaleString() + ' years';
      }
    }

    this.probEl.innerHTML = `
      <p>Each random character has a <span class="highlight">1/${p.alphabetSize}</span> chance of matching.</p>
      <span class="formula">(1/${p.alphabetSize})<sup>${p.targetLength}</sup> = 1 in ${formattedOdds}</span>
      <p>Expected attempts to type "<span class="highlight">${simulation.target}</span>": ~<span class="highlight">${formattedOdds}</span></p>
      <p style="margin-top: 8px;">A real monkey typing ~5 chars/min would need ~<span class="highlight">${monkeyTime}</span>.</p>
    `;
  }
}
