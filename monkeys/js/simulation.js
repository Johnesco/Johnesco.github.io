import { ALPHABET } from './config.js';

export class Simulation {
  constructor(target) {
    this.alphabet = ALPHABET;
    this.target = target.toLowerCase();
    this.position = 0;
    this.totalAttempts = 1;
    this.totalChars = 0;
    this.bestStreak = 0;
    this.completed = false;
    this.lastChar = '';
    this.lastWasMatch = false;
  }

  step() {
    if (this.completed) return null;

    const char = this.alphabet[Math.floor(Math.random() * this.alphabet.length)];
    this.totalChars++;
    this.lastChar = char;

    const matched = char === this.target[this.position];
    this.lastWasMatch = matched;

    if (matched) {
      this.position++;
      if (this.position > this.bestStreak) {
        this.bestStreak = this.position;
      }
      if (this.position === this.target.length) {
        this.completed = true;
        return { char, matched: true, position: this.position, reset: false, completed: true, streakLength: this.position };
      }
      return { char, matched: true, position: this.position, reset: false, completed: false, streakLength: this.position };
    }

    const streakLength = this.position;
    const matchedPortion = this.target.slice(0, this.position);
    this.totalAttempts++;
    this.position = 0;

    return {
      char,
      matched: false,
      position: 0,
      reset: true,
      completed: false,
      streakLength,
      matchedPortion,
      attemptNumber: this.totalAttempts - 1,
    };
  }

  stepN(n) {
    const resetEvents = [];
    let matchEvents = 0;
    let completed = false;
    let prevBestStreak = this.bestStreak;
    let milestone = null;

    for (let i = 0; i < n; i++) {
      const char = this.alphabet[Math.floor(Math.random() * this.alphabet.length)];
      this.totalChars++;

      if (char === this.target[this.position]) {
        this.position++;
        if (this.position > this.bestStreak) {
          this.bestStreak = this.position;
        }
        matchEvents++;
        if (this.position === this.target.length) {
          this.completed = true;
          this.lastChar = char;
          this.lastWasMatch = true;
          completed = true;
          break;
        }
        if (this.position > prevBestStreak) {
          this.lastChar = char;
          this.lastWasMatch = true;
          milestone = { char, position: this.position };
          break;
        }
      } else {
        if (this.position > 0) {
          resetEvents.push({
            matchedPortion: this.target.slice(0, this.position),
            failedChar: char,
            streakLength: this.position,
            attemptNumber: this.totalAttempts,
          });
        }
        this.totalAttempts++;
        this.position = 0;
      }

      this.lastChar = char;
      this.lastWasMatch = (char === this.target[0] && this.position === 1);
    }

    return {
      charsGenerated: n,
      matchEvents,
      resetEvents,
      completed,
      newRecord: this.bestStreak > prevBestStreak,
      milestone,
    };
  }

  getStats() {
    return {
      target: this.target,
      position: this.position,
      totalAttempts: this.totalAttempts,
      totalChars: this.totalChars,
      bestStreak: this.bestStreak,
      completed: this.completed,
    };
  }

  getProbability() {
    const alphabetSize = this.alphabet.length;
    const targetLength = this.target.length;
    const oneInX = Math.pow(alphabetSize, targetLength);
    return {
      alphabetSize,
      targetLength,
      perChar: 1 / alphabetSize,
      total: Math.pow(1 / alphabetSize, targetLength),
      oneInX,
    };
  }

  reset(newTarget) {
    if (newTarget !== undefined) {
      this.target = newTarget.toLowerCase();
    }
    this.position = 0;
    this.totalAttempts = 1;
    this.totalChars = 0;
    this.bestStreak = 0;
    this.completed = false;
    this.lastChar = '';
    this.lastWasMatch = false;
  }
}
