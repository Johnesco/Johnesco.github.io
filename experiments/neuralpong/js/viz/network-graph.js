import { NODE_TYPE } from '../neat/gene.js';

export class NetworkGraph {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._sizedOnce = false;
    this._w = 0;
    this._h = 0;
  }

  _syncSize() {
    // Measure once from the panel, then keep that fixed size
    const panel = this.canvas.parentElement;
    const title = panel.querySelector('.panel-title');
    const titleH = title ? title.offsetHeight + 8 : 0;
    const w = panel.clientWidth - 20;
    const h = panel.clientHeight - 20 - titleH;

    if (!this._sizedOnce || Math.abs(w - this._w) > 2 || Math.abs(h - this._h) > 2) {
      this._w = w;
      this._h = h;
      this.canvas.width = w;
      this.canvas.height = h;
      this._sizedOnce = true;
    }
  }

  draw(genome) {
    this._syncSize();
    const { canvas, ctx } = this;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    if (!genome) return;

    const nodes = [...genome.nodes.values()];
    const connections = genome.connections;

    // Group nodes by layer
    const layers = new Map();
    for (const node of nodes) {
      const key = node.layer;
      if (!layers.has(key)) layers.set(key, []);
      layers.get(key).push(node);
    }

    const sortedLayers = [...layers.keys()].sort((a, b) => a - b);
    const numLayers = sortedLayers.length;
    if (numLayers === 0) return;

    // Find the tallest layer to scale node sizes
    let maxLayerSize = 0;
    for (const [, layerNodes] of layers) {
      if (layerNodes.length > maxLayerSize) maxLayerSize = layerNodes.length;
    }

    // Scale radius and font down as network grows
    const baseRadius = 8;
    const scaleFactor = Math.min(1, 10 / Math.max(maxLayerSize, 1), 6 / Math.max(numLayers, 1));
    const radius = Math.max(3, baseRadius * scaleFactor);
    const fontSize = Math.max(7, Math.floor(9 * scaleFactor));

    // Compute positions — everything fits within fixed canvas
    const padding = Math.max(20, radius * 3);
    const positions = new Map();

    for (let li = 0; li < numLayers; li++) {
      const layerKey = sortedLayers[li];
      const layerNodes = layers.get(layerKey);
      const x = padding + (li / Math.max(numLayers - 1, 1)) * (W - padding * 2);

      for (let ni = 0; ni < layerNodes.length; ni++) {
        const y = padding + ((ni + 1) / (layerNodes.length + 1)) * (H - padding * 2);
        positions.set(layerNodes[ni].id, { x, y });
      }
    }

    // Draw connections
    for (const conn of connections) {
      const from = positions.get(conn.inNode);
      const to = positions.get(conn.outNode);
      if (!from || !to) continue;

      const alpha = conn.enabled ? Math.min(Math.abs(conn.weight) * 0.5, 0.9) + 0.1 : 0.05;
      const color = conn.weight >= 0
        ? `rgba(0, 150, 255, ${alpha})`
        : `rgba(255, 60, 60, ${alpha})`;

      ctx.strokeStyle = color;
      ctx.lineWidth = conn.enabled ? Math.min(Math.abs(conn.weight) * 1.5, 3) + 0.5 : 0.5;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }

    // Pre-compute type lists for label lookups
    const inputNodes = nodes.filter(n => n.type === NODE_TYPE.INPUT).sort((a, b) => a.id - b.id);
    const outputNodes = nodes.filter(n => n.type === NODE_TYPE.OUTPUT).sort((a, b) => a.id - b.id);
    const inputLabels = ['bX', 'bY', 'vX', 'vY', 'pY', 'oY', 'dst'];
    const outputLabels = ['UP', 'DN', 'ST'];

    // Draw nodes
    for (const node of nodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;

      const r = node.type === NODE_TYPE.BIAS ? radius * 0.75 : radius;

      // Activation coloring
      const act = Math.max(0, Math.min(1, node.activation));
      let color;
      if (node.type === NODE_TYPE.INPUT || node.type === NODE_TYPE.BIAS) {
        const g = Math.floor(act * 200 + 55);
        color = `rgb(0, ${g}, ${Math.floor(act * 136)})`;
      } else if (node.type === NODE_TYPE.OUTPUT) {
        const intensity = Math.floor(act * 200 + 55);
        color = `rgb(${intensity}, ${Math.floor(act * 68)}, ${Math.floor(act * 136)})`;
      } else {
        const intensity = Math.floor(act * 200 + 55);
        color = `rgb(${Math.floor(act * 100)}, ${intensity}, ${Math.floor(act * 200)})`;
      }

      ctx.fillStyle = color;
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Node labels (only when big enough to read)
      if (fontSize >= 7) {
        ctx.fillStyle = '#888';
        ctx.font = `${fontSize}px monospace`;
        ctx.textAlign = 'center';

        if (node.type === NODE_TYPE.INPUT) {
          const idx = inputNodes.indexOf(node);
          if (idx >= 0 && idx < inputLabels.length) {
            ctx.fillText(inputLabels[idx], pos.x, pos.y + r + fontSize + 2);
          }
        } else if (node.type === NODE_TYPE.OUTPUT) {
          const idx = outputNodes.indexOf(node);
          if (idx >= 0 && idx < outputLabels.length) {
            ctx.fillText(outputLabels[idx], pos.x, pos.y + r + fontSize + 2);
          }
        } else if (node.type === NODE_TYPE.BIAS) {
          ctx.fillText('B', pos.x, pos.y + r + fontSize + 2);
        }
      }
    }
  }
}
