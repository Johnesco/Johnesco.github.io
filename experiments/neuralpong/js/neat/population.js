import { NEAT } from '../config.js';
import { Genome } from './genome.js';
import { Species } from './species.js';
import { InnovationTracker } from './innovation.js';

export class Population {
  constructor() {
    this.genomes = [];
    this.species = [];
    this.generation = 0;
    this.innovationTracker = new InnovationTracker();
    this.bestGenome = null;
    this.bestFitnessEver = 0;
    this.history = { best: [], avg: [], speciesCounts: [] };
  }

  initialize(size = NEAT.POPULATION_SIZE) {
    this.genomes = [];
    for (let i = 0; i < size; i++) {
      this.genomes.push(Genome.createMinimal(NEAT.INPUTS, NEAT.OUTPUTS, this.innovationTracker));
    }
    this.speciate();
  }

  speciate() {
    // Clear members from existing species
    for (const sp of this.species) {
      sp.chooseNewRepresentative();
      sp.members = [];
    }

    // Assign each genome to a species
    for (const genome of this.genomes) {
      let placed = false;
      for (const sp of this.species) {
        if (sp.isCompatible(genome)) {
          sp.addMember(genome);
          placed = true;
          break;
        }
      }
      if (!placed) {
        const newSp = new Species(genome);
        newSp.addMember(genome);
        this.species.push(newSp);
      }
    }

    // Remove empty species
    this.species = this.species.filter(sp => sp.members.length > 0);

    // Adjust compatibility threshold toward target species count
    if (this.species.length < NEAT.TARGET_SPECIES) {
      NEAT.COMPAT_THRESHOLD -= NEAT.COMPAT_MODIFIER;
    } else if (this.species.length > NEAT.TARGET_SPECIES) {
      NEAT.COMPAT_THRESHOLD += NEAT.COMPAT_MODIFIER;
    }
    NEAT.COMPAT_THRESHOLD = Math.max(0.3, NEAT.COMPAT_THRESHOLD);
  }

  evolve() {
    // Update species staleness and cull
    for (const sp of this.species) {
      sp.updateStaleness();
      sp.calculateAdjustedFitness();
      sp.cull();
    }

    // Remove stagnant species (keep at least the best one)
    if (this.species.length > 1) {
      // Sort by best fitness descending so the best species is first
      this.species.sort((a, b) => b.bestFitness - a.bestFitness);
      const bestSpecies = this.species[0];
      this.species = this.species.filter(sp => sp.staleness < NEAT.STAGNATION_LIMIT);
      if (this.species.length === 0) {
        this.species = [bestSpecies];
      }
    }

    // Track best genome
    let genBest = null;
    let genBestFitness = -Infinity;
    let totalFitness = 0;
    for (const g of this.genomes) {
      totalFitness += g.fitness;
      if (g.fitness > genBestFitness) {
        genBestFitness = g.fitness;
        genBest = g;
      }
    }

    if (genBest && genBestFitness > this.bestFitnessEver) {
      this.bestFitnessEver = genBestFitness;
      this.bestGenome = genBest.clone();
    } else if (!this.bestGenome && genBest) {
      this.bestGenome = genBest.clone();
    }

    const avgFitness = this.genomes.length > 0 ? totalFitness / this.genomes.length : 0;

    // Record history
    this.history.best.push(genBestFitness);
    this.history.avg.push(avgFitness);
    this.history.speciesCounts.push(
      this.species.map(sp => ({ id: sp.id, count: sp.members.length }))
    );

    // Calculate offspring allocation
    const totalAdjusted = this.species.reduce(
      (sum, sp) => sum + sp.members.reduce((s, m) => s + m.adjustedFitness, 0), 0
    );

    const nextGen = [];

    // Elitism: keep best from each species
    for (const sp of this.species) {
      if (sp.members.length > 0) {
        sp.sortByFitness();
        for (let i = 0; i < Math.min(NEAT.ELITISM, sp.members.length); i++) {
          nextGen.push(sp.members[i].clone());
        }
      }
    }

    // Reset innovation tracker for new generation
    this.innovationTracker.resetGeneration();

    // Fill rest through reproduction
    while (nextGen.length < NEAT.POPULATION_SIZE) {
      // Pick a species weighted by adjusted fitness
      const sp = this._selectSpecies(totalAdjusted);
      if (!sp || sp.members.length === 0) continue;

      let child;
      if (sp.members.length === 1 || Math.random() > NEAT.CROSSOVER_RATE) {
        // Mutation only
        child = sp.selectParent().clone();
        child.mutate(this.innovationTracker);
      } else {
        // Crossover + mutation
        const p1 = sp.selectParent();
        let p2;
        if (Math.random() < NEAT.INTERSPECIES_MATE_RATE && this.species.length > 1) {
          const otherSp = this.species[Math.floor(Math.random() * this.species.length)];
          p2 = otherSp.selectParent();
        } else {
          p2 = sp.selectParent();
        }
        child = Genome.crossover(p1, p2);
        child.mutate(this.innovationTracker);
      }
      child.id = nextGen.length;
      nextGen.push(child);
    }

    this.genomes = nextGen;
    this.generation++;
    this.speciate();
  }

  _selectSpecies(totalAdjusted) {
    if (totalAdjusted <= 0) {
      return this.species[Math.floor(Math.random() * this.species.length)];
    }
    let r = Math.random() * totalAdjusted;
    for (const sp of this.species) {
      const spTotal = sp.members.reduce((s, m) => s + m.adjustedFitness, 0);
      r -= spTotal;
      if (r <= 0) return sp;
    }
    return this.species[this.species.length - 1];
  }

  getBestGenome() {
    if (!this.bestGenome) {
      // Return best from current genomes
      let best = this.genomes[0];
      for (const g of this.genomes) {
        if (g.fitness > best.fitness) best = g;
      }
      return best;
    }
    return this.bestGenome;
  }

  toJSON() {
    return {
      genomes: this.genomes.map(g => g.toJSON()),
      generation: this.generation,
      innovation: this.innovationTracker.toJSON(),
      bestGenome: this.bestGenome ? this.bestGenome.toJSON() : null,
      bestFitnessEver: this.bestFitnessEver,
      history: this.history,
    };
  }

  static fromJSON(obj) {
    const pop = new Population();
    pop.generation = obj.generation;
    pop.innovationTracker = InnovationTracker.fromJSON(obj.innovation);
    pop.genomes = obj.genomes.map(g => Genome.fromJSON(g));
    pop.bestFitnessEver = obj.bestFitnessEver || 0;
    if (obj.bestGenome) {
      pop.bestGenome = Genome.fromJSON(obj.bestGenome);
    }
    pop.history = obj.history || { best: [], avg: [], speciesCounts: [] };
    pop.speciate();
    return pop;
  }
}
