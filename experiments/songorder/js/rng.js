// Deterministic xorshift32 PRNG — same seed = same simulation

export class Rng {
  constructor(seed) {
    this.state = (seed | 0) || 1; // must be nonzero
  }

  nextU32() {
    let s = this.state;
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    this.state = s;
    return s >>> 0; // unsigned
  }

  float() {
    return this.nextU32() / 0x100000000; // [0, 1)
  }

  range(lo, hi) {
    return lo + (this.nextU32() % (hi - lo));
  }

  chance(p) {
    return this.float() < p;
  }

  pick(arr) {
    return arr[this.range(0, arr.length)];
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.range(0, i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Generate an HSL color with good saturation and lightness
  color() {
    const h = this.range(0, 360);
    const s = this.range(50, 80);
    const l = this.range(50, 70);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
}
