// Global innovation number tracker
// Map of "inNode->outNode" -> innovationNumber
// Reset per generation so same structural mutations share innovation numbers

export class InnovationTracker {
  constructor() {
    this.counter = 0;
    this.currentGen = new Map(); // key: "in->out", value: innovation number
  }

  getInnovation(inNode, outNode) {
    const key = `${inNode}->${outNode}`;
    if (this.currentGen.has(key)) {
      return this.currentGen.get(key);
    }
    const num = this.counter++;
    this.currentGen.set(key, num);
    return num;
  }

  resetGeneration() {
    this.currentGen.clear();
  }

  setCounter(value) {
    this.counter = value;
  }

  toJSON() {
    return { counter: this.counter };
  }

  static fromJSON(obj) {
    const t = new InnovationTracker();
    t.counter = obj.counter;
    return t;
  }
}
