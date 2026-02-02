// Node types
export const NODE_TYPE = {
  INPUT: 'input',
  OUTPUT: 'output',
  HIDDEN: 'hidden',
  BIAS: 'bias',
};

export class NodeGene {
  constructor(id, type, layer = 0) {
    this.id = id;
    this.type = type;
    this.layer = layer; // 0 = input, 1 = output, fractional = hidden
    this.activation = 0;
  }

  clone() {
    const n = new NodeGene(this.id, this.type, this.layer);
    n.activation = 0;
    return n;
  }

  toJSON() {
    return { id: this.id, type: this.type, layer: this.layer };
  }

  static fromJSON(obj) {
    return new NodeGene(obj.id, obj.type, obj.layer);
  }
}

export class ConnectionGene {
  constructor(inNode, outNode, weight, innovation, enabled = true) {
    this.inNode = inNode;
    this.outNode = outNode;
    this.weight = weight;
    this.innovation = innovation;
    this.enabled = enabled;
  }

  clone() {
    return new ConnectionGene(
      this.inNode, this.outNode,
      this.weight, this.innovation,
      this.enabled
    );
  }

  toJSON() {
    return {
      inNode: this.inNode,
      outNode: this.outNode,
      weight: this.weight,
      innovation: this.innovation,
      enabled: this.enabled,
    };
  }

  static fromJSON(obj) {
    return new ConnectionGene(obj.inNode, obj.outNode, obj.weight, obj.innovation, obj.enabled);
  }
}
