import { NEAT } from '../config.js';
import { NodeGene, ConnectionGene, NODE_TYPE } from './gene.js';
import { activate } from './activations.js';

let nextGenomeId = 0;

export class Genome {
  constructor() {
    this.id = nextGenomeId++;
    this.nodes = new Map();    // id -> NodeGene
    this.connections = [];     // ConnectionGene[]
    this.fitness = 0;
    this.adjustedFitness = 0;
    this.species = null;
  }

  static resetIdCounter(val = 0) {
    nextGenomeId = val;
  }

  // Create a minimal genome with all inputs connected to all outputs
  static createMinimal(numInputs, numOutputs, innovationTracker) {
    const g = new Genome();
    let nodeId = 0;

    // Bias node
    const bias = new NodeGene(nodeId++, NODE_TYPE.BIAS, 0);
    g.nodes.set(bias.id, bias);

    // Input nodes
    const inputIds = [];
    for (let i = 0; i < numInputs; i++) {
      const n = new NodeGene(nodeId++, NODE_TYPE.INPUT, 0);
      g.nodes.set(n.id, n);
      inputIds.push(n.id);
    }

    // Output nodes
    const outputIds = [];
    for (let i = 0; i < numOutputs; i++) {
      const n = new NodeGene(nodeId++, NODE_TYPE.OUTPUT, 1);
      g.nodes.set(n.id, n);
      outputIds.push(n.id);
    }

    // Connect all inputs + bias to all outputs
    for (const outId of outputIds) {
      // bias -> output
      const bInno = innovationTracker.getInnovation(bias.id, outId);
      g.connections.push(new ConnectionGene(bias.id, outId, (Math.random() * 2 - 1) * 0.5, bInno));

      for (const inId of inputIds) {
        const inno = innovationTracker.getInnovation(inId, outId);
        g.connections.push(new ConnectionGene(inId, outId, (Math.random() * 2 - 1) * 0.5, inno));
      }
    }

    return g;
  }

  clone() {
    const g = new Genome();
    g.id = this.id;
    for (const [id, node] of this.nodes) {
      g.nodes.set(id, node.clone());
    }
    g.connections = this.connections.map(c => c.clone());
    g.fitness = this.fitness;
    return g;
  }

  // Feedforward activation
  activate(inputs) {
    // Set input activations
    const inputNodes = this.getNodesByType(NODE_TYPE.INPUT);
    const biasNodes = this.getNodesByType(NODE_TYPE.BIAS);

    for (let i = 0; i < inputs.length; i++) {
      if (inputNodes[i]) inputNodes[i].activation = inputs[i];
    }
    for (const b of biasNodes) {
      b.activation = 1.0;
    }

    // Sort nodes by layer for feedforward
    const sortedNodes = [...this.nodes.values()].sort((a, b) => a.layer - b.layer);

    // Calculate activations layer by layer
    for (const node of sortedNodes) {
      if (node.type === NODE_TYPE.INPUT || node.type === NODE_TYPE.BIAS) continue;

      let sum = 0;
      for (const conn of this.connections) {
        if (conn.outNode === node.id && conn.enabled) {
          const inNode = this.nodes.get(conn.inNode);
          if (inNode) {
            sum += inNode.activation * conn.weight;
          }
        }
      }
      node.activation = activate(sum);
    }

    // Read output activations
    const outputNodes = this.getNodesByType(NODE_TYPE.OUTPUT);
    return outputNodes.map(n => n.activation);
  }

  getNodesByType(type) {
    return [...this.nodes.values()]
      .filter(n => n.type === type)
      .sort((a, b) => a.id - b.id);
  }

  // --- Mutation ---

  mutate(innovationTracker) {
    if (Math.random() < NEAT.WEIGHT_MUTATE_RATE) {
      this.mutateWeights();
    }
    if (Math.random() < NEAT.ADD_CONNECTION_RATE) {
      this.mutateAddConnection(innovationTracker);
    }
    if (Math.random() < NEAT.ADD_NODE_RATE) {
      this.mutateAddNode(innovationTracker);
    }
    if (Math.random() < NEAT.DISABLE_RATE) {
      this.mutateToggleEnable(false);
    }
    if (Math.random() < NEAT.ENABLE_RATE) {
      this.mutateToggleEnable(true);
    }
  }

  mutateWeights() {
    for (const conn of this.connections) {
      if (Math.random() < NEAT.WEIGHT_PERTURB_RATE) {
        conn.weight += (Math.random() * 2 - 1) * NEAT.WEIGHT_PERTURB_STRENGTH;
      } else {
        conn.weight = (Math.random() * 2 - 1) * NEAT.WEIGHT_RESET_RANGE;
      }
    }
  }

  mutateAddConnection(innovationTracker) {
    const nodesArr = [...this.nodes.values()];

    // Try up to 20 times to find a valid connection
    for (let attempt = 0; attempt < 20; attempt++) {
      const a = nodesArr[Math.floor(Math.random() * nodesArr.length)];
      const b = nodesArr[Math.floor(Math.random() * nodesArr.length)];

      if (a.id === b.id) continue;

      // Determine direction: lower layer -> higher layer
      let inNode, outNode;
      if (a.layer < b.layer) {
        inNode = a; outNode = b;
      } else if (b.layer < a.layer) {
        inNode = b; outNode = a;
      } else {
        continue; // Same layer, skip
      }

      // Can't connect to input/bias
      if (outNode.type === NODE_TYPE.INPUT || outNode.type === NODE_TYPE.BIAS) continue;

      // Check if connection already exists
      const exists = this.connections.some(
        c => c.inNode === inNode.id && c.outNode === outNode.id
      );
      if (exists) continue;

      const inno = innovationTracker.getInnovation(inNode.id, outNode.id);
      this.connections.push(
        new ConnectionGene(inNode.id, outNode.id, (Math.random() * 2 - 1), inno)
      );
      return;
    }
  }

  mutateAddNode(innovationTracker) {
    const enabledConns = this.connections.filter(c => c.enabled);
    if (enabledConns.length === 0) return;

    const conn = enabledConns[Math.floor(Math.random() * enabledConns.length)];
    conn.enabled = false;

    const inNode = this.nodes.get(conn.inNode);
    const outNode = this.nodes.get(conn.outNode);
    const newLayer = (inNode.layer + outNode.layer) / 2;

    const newNodeId = Math.max(...[...this.nodes.keys()]) + 1;
    const newNode = new NodeGene(newNodeId, NODE_TYPE.HIDDEN, newLayer);
    this.nodes.set(newNodeId, newNode);

    const inno1 = innovationTracker.getInnovation(conn.inNode, newNodeId);
    const inno2 = innovationTracker.getInnovation(newNodeId, conn.outNode);

    this.connections.push(new ConnectionGene(conn.inNode, newNodeId, 1.0, inno1));
    this.connections.push(new ConnectionGene(newNodeId, conn.outNode, conn.weight, inno2));
  }

  mutateToggleEnable(enable) {
    const candidates = this.connections.filter(c => c.enabled !== enable);
    if (candidates.length === 0) return;
    candidates[Math.floor(Math.random() * candidates.length)].enabled = enable;
  }

  // --- Crossover ---
  static crossover(parent1, parent2) {
    // parent1 should be more fit
    let p1 = parent1, p2 = parent2;
    if (p2.fitness > p1.fitness) {
      [p1, p2] = [p2, p1];
    }

    const child = new Genome();

    // Copy all nodes from fitter parent
    for (const [id, node] of p1.nodes) {
      child.nodes.set(id, node.clone());
    }

    // Build innovation map for parent2
    const p2Map = new Map();
    for (const conn of p2.connections) {
      p2Map.set(conn.innovation, conn);
    }

    // Align connections by innovation number
    for (const conn of p1.connections) {
      const matching = p2Map.get(conn.innovation);
      if (matching) {
        // Matching gene: randomly inherit
        const chosen = Math.random() < 0.5 ? conn : matching;
        const c = chosen.clone();
        // If either parent has it disabled, 75% chance disabled
        if (!conn.enabled || !matching.enabled) {
          c.enabled = Math.random() > 0.75;
        }
        child.connections.push(c);
      } else {
        // Excess/disjoint from fitter parent: inherit
        child.connections.push(conn.clone());
      }
    }

    // Ensure child has all referenced nodes
    for (const conn of child.connections) {
      if (!child.nodes.has(conn.inNode)) {
        const node = p2.nodes.get(conn.inNode);
        if (node) child.nodes.set(conn.inNode, node.clone());
      }
      if (!child.nodes.has(conn.outNode)) {
        const node = p2.nodes.get(conn.outNode);
        if (node) child.nodes.set(conn.outNode, node.clone());
      }
    }

    return child;
  }

  // --- Compatibility distance ---
  static compatibility(g1, g2) {
    const conns1 = g1.connections;
    const conns2 = g2.connections;

    if (conns1.length === 0 && conns2.length === 0) return 0;

    const maxInno1 = conns1.length > 0 ? Math.max(...conns1.map(c => c.innovation)) : 0;
    const maxInno2 = conns2.length > 0 ? Math.max(...conns2.map(c => c.innovation)) : 0;
    const maxInno = Math.max(maxInno1, maxInno2);

    const map1 = new Map();
    for (const c of conns1) map1.set(c.innovation, c);
    const map2 = new Map();
    for (const c of conns2) map2.set(c.innovation, c);

    let excess = 0, disjoint = 0, matching = 0, weightDiff = 0;
    const threshold = Math.min(maxInno1, maxInno2);

    const allInnos = new Set([...map1.keys(), ...map2.keys()]);
    for (const inno of allInnos) {
      const in1 = map1.has(inno);
      const in2 = map2.has(inno);

      if (in1 && in2) {
        matching++;
        weightDiff += Math.abs(map1.get(inno).weight - map2.get(inno).weight);
      } else if (inno > threshold) {
        excess++;
      } else {
        disjoint++;
      }
    }

    const N = Math.max(conns1.length, conns2.length, 1);
    const avgWeightDiff = matching > 0 ? weightDiff / matching : 0;

    return (
      (NEAT.EXCESS_COEFF * excess) / N +
      (NEAT.DISJOINT_COEFF * disjoint) / N +
      NEAT.WEIGHT_COEFF * avgWeightDiff
    );
  }

  // --- Serialization ---
  toJSON() {
    return {
      id: this.id,
      nodes: [...this.nodes.values()].map(n => n.toJSON()),
      connections: this.connections.map(c => c.toJSON()),
      fitness: this.fitness,
    };
  }

  static fromJSON(obj) {
    const g = new Genome();
    g.id = obj.id;
    g.fitness = obj.fitness || 0;
    for (const n of obj.nodes) {
      const node = NodeGene.fromJSON(n);
      g.nodes.set(node.id, node);
    }
    g.connections = obj.connections.map(c => ConnectionGene.fromJSON(c));
    nextGenomeId = Math.max(nextGenomeId, g.id + 1);
    return g;
  }
}
