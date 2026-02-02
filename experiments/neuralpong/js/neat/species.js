import { NEAT } from '../config.js';
import { Genome } from './genome.js';

let nextSpeciesId = 0;

export class Species {
  constructor(representative) {
    this.id = nextSpeciesId++;
    this.members = [];
    this.representative = representative;
    this.bestFitness = 0;
    this.staleness = 0;
    this.averageFitness = 0;
  }

  static resetIdCounter(val = 0) {
    nextSpeciesId = val;
  }

  addMember(genome) {
    this.members.push(genome);
    genome.species = this.id;
  }

  isCompatible(genome) {
    return Genome.compatibility(genome, this.representative) < NEAT.COMPAT_THRESHOLD;
  }

  calculateAdjustedFitness() {
    const size = this.members.length;
    if (size === 0) return;

    let total = 0;
    for (const m of this.members) {
      m.adjustedFitness = m.fitness / size;
      total += m.adjustedFitness;
    }
    this.averageFitness = total / size;
  }

  sortByFitness() {
    this.members.sort((a, b) => b.fitness - a.fitness);
  }

  updateStaleness() {
    this.sortByFitness();
    if (this.members.length === 0) return;

    const currentBest = this.members[0].fitness;
    if (currentBest > this.bestFitness) {
      this.bestFitness = currentBest;
      this.staleness = 0;
    } else {
      this.staleness++;
    }
  }

  cull() {
    this.sortByFitness();
    const cutoff = Math.max(1, Math.floor(this.members.length * NEAT.SURVIVAL_THRESHOLD));
    this.members = this.members.slice(0, cutoff);
  }

  selectParent() {
    // Tournament selection (size 3)
    const tourney = [];
    for (let i = 0; i < Math.min(3, this.members.length); i++) {
      tourney.push(this.members[Math.floor(Math.random() * this.members.length)]);
    }
    tourney.sort((a, b) => b.fitness - a.fitness);
    return tourney[0];
  }

  chooseNewRepresentative() {
    if (this.members.length > 0) {
      this.representative = this.members[Math.floor(Math.random() * this.members.length)];
    }
  }

  toJSON() {
    return {
      id: this.id,
      representativeId: this.representative ? this.representative.id : null,
      bestFitness: this.bestFitness,
      staleness: this.staleness,
    };
  }
}
