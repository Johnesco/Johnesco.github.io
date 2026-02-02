import { NetworkGraph } from './network-graph.js';
import { InputPanel } from './input-panel.js';
import { FitnessChart } from './fitness-chart.js';
import { SpeciesChart } from './species-chart.js';
import { Heatmap } from './heatmap.js';

export class Dashboard {
  constructor() {
    this.networkGraph = new NetworkGraph(document.getElementById('network-canvas'));
    this.inputPanel = new InputPanel(document.getElementById('input-canvas'));
    this.fitnessChart = new FitnessChart(document.getElementById('fitness-canvas'));
    this.speciesChart = new SpeciesChart(document.getElementById('species-canvas'));
    this.heatmap = new Heatmap(document.getElementById('heatmap-canvas'));
  }

  update(vizData, population) {
    // Network graph - show current genome being evaluated or best genome
    if (vizData.genome) {
      this.networkGraph.draw(vizData.genome);
    }

    // Input activations
    this.inputPanel.draw(vizData.inputs);

    // Fitness chart (update less frequently)
    this.fitnessChart.draw(population.history);

    // Species chart
    this.speciesChart.draw(population.history.speciesCounts);

    // Heatmap
    this.heatmap.draw(vizData.heatmap);
  }

  updateStats(population, genomeIndex) {
    const gen = document.getElementById('stat-gen');
    const pop = document.getElementById('stat-pop');
    const speciesEl = document.getElementById('stat-species');
    const bestEl = document.getElementById('stat-best');
    const avgEl = document.getElementById('stat-avg');
    const genomeEl = document.getElementById('stat-genome');

    gen.textContent = population.generation;
    pop.textContent = population.genomes.length;
    speciesEl.textContent = population.species.length;
    bestEl.textContent = population.bestFitnessEver.toFixed(1);

    const lastAvg = population.history.avg.length > 0
      ? population.history.avg[population.history.avg.length - 1]
      : 0;
    avgEl.textContent = lastAvg.toFixed(1);
    genomeEl.textContent = `${genomeIndex + 1}/${population.genomes.length}`;
  }
}
