import { SIM, COLORS } from './config.js';

export class Analytics {
  constructor() {
    this.queueLengthHistory = []; // { tick, length }
    this.sampleInterval = 30;    // record queue length every N ticks
    this.nightBoundaries = [];   // { tick, night } — for drawing dividers on timeline
    this.globalTickOffset = 0;   // cumulative ticks across nights
  }

  update(sim) {
    // Sample queue length using global tick (cumulative across nights)
    const globalTick = this.globalTickOffset + sim.tick;
    if (sim.tick % this.sampleInterval === 0) {
      this.queueLengthHistory.push({ tick: globalTick, length: sim.queue.size() });
      // Keep reasonable size
      if (this.queueLengthHistory.length > 2000) {
        this.queueLengthHistory = this.queueLengthHistory.filter((_, i) => i % 2 === 0);
        this.sampleInterval *= 2;
      }
    }
  }

  markNightEnd(tick, nightNumber) {
    const globalTick = this.globalTickOffset + tick;
    this.nightBoundaries.push({ tick: globalTick, night: nightNumber });
    this.globalTickOffset = globalTick;
  }

  getWaitStats(sim) {
    const history = sim.queue.history;
    if (history.length === 0) return { avg: 0, median: 0, count: 0 };

    const waits = history.map(h => h.waitTicks);
    waits.sort((a, b) => a - b);

    const avg = waits.reduce((s, w) => s + w, 0) / waits.length;
    const median = waits.length % 2 === 0
      ? (waits[waits.length / 2 - 1] + waits[waits.length / 2]) / 2
      : waits[Math.floor(waits.length / 2)];

    return { avg, median, count: waits.length };
  }

  getCohortStats(sim, numCohorts = 4) {
    const all = sim.getAllPatrons().filter(p => p.signupTick !== null);
    if (all.length < numCohorts) return [];

    // Sort by arrival
    all.sort((a, b) => a.arrivalTick - b.arrivalTick);
    const size = Math.ceil(all.length / numCohorts);

    const cohorts = [];
    for (let i = 0; i < numCohorts; i++) {
      const group = all.slice(i * size, (i + 1) * size);
      if (group.length === 0) continue;

      const withSing = group.filter(p => p.singStartTick !== null);
      const avgWait = withSing.length > 0
        ? withSing.reduce((s, p) => s + (p.singStartTick - p.signupTick), 0) / withSing.length
        : null;

      const avgSongs = group.reduce((s, p) => s + p.songsSung, 0) / group.length;
      const dropouts = group.filter(p => p.departedTick !== null && p.songsSung === 0).length;

      cohorts.push({
        label: `Q${i + 1}`,
        count: group.length,
        avgWait,
        avgSongs,
        dropoutRate: dropouts / group.length,
      });
    }

    return cohorts;
  }

  getDropoutRate(sim) {
    const all = sim.getAllPatrons();
    if (all.length === 0) return 0;
    const dropouts = all.filter(p => p.departedTick !== null && p.songsSung === 0).length;
    return dropouts / all.length;
  }

  getGini(sim) {
    const history = sim.queue.history;
    if (history.length < 2) return 0;

    const waits = history.map(h => h.waitTicks).sort((a, b) => a - b);
    const n = waits.length;
    const mean = waits.reduce((s, w) => s + w, 0) / n;
    if (mean === 0) return 0;

    let sumDiff = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        sumDiff += Math.abs(waits[i] - waits[j]);
      }
    }

    return sumDiff / (2 * n * n * mean);
  }

  // Draw cohort bar chart
  drawFairnessChart(canvas, sim) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const cohorts = this.getCohortStats(sim);
    if (cohorts.length === 0) {
      ctx.fillStyle = '#3a3a4a';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('waiting for data...', w / 2, h / 2);
      return;
    }

    const maxWait = Math.max(...cohorts.map(c => c.avgWait ?? 0), 1);
    const barW = Math.floor((w - 40) / cohorts.length) - 8;
    const chartH = h - 30;

    ctx.font = '9px monospace';
    ctx.textAlign = 'center';

    cohorts.forEach((c, i) => {
      const x = 20 + i * (barW + 8) + 4;
      const barH = c.avgWait !== null ? (c.avgWait / maxWait) * (chartH - 20) : 0;
      const y = chartH - barH;

      // Bar
      const hue = 140 - (i / (cohorts.length - 1)) * 100; // green to yellow
      ctx.fillStyle = `hsl(${hue}, 60%, 55%)`;
      ctx.fillRect(x, y, barW, barH);

      // Label
      ctx.fillStyle = COLORS.TEXT_DIM;
      ctx.fillText(c.label, x + barW / 2, h - 4);

      // Value
      if (c.avgWait !== null) {
        ctx.fillStyle = COLORS.TEXT;
        const totalSecs = c.avgWait / SIM.TPS;
        const label = totalSecs < 60
          ? `${Math.round(totalSecs)}s`
          : `${Math.floor(totalSecs / 60)}:${String(Math.floor(totalSecs % 60)).padStart(2, '0')}`;
        ctx.fillText(label, x + barW / 2, y - 4);
      }
    });
  }

  // Draw queue length timeline
  drawTimelineChart(canvas, sim) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const data = this.queueLengthHistory;
    if (data.length < 2) {
      ctx.fillStyle = '#3a3a4a';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('waiting for data...', w / 2, h / 2);
      return;
    }

    const maxLen = Math.max(...data.map(d => d.length), 1);
    const maxTick = data[data.length - 1].tick || 1;
    const chartH = h - 16;

    // Draw line
    ctx.strokeStyle = COLORS.ACCENT;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = (d.tick / maxTick) * (w - 20) + 10;
      const y = chartH - (d.length / maxLen) * (chartH - 10) + 5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Night boundary dividers
    if (this.nightBoundaries.length > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      for (const b of this.nightBoundaries) {
        const bx = (b.tick / maxTick) * (w - 20) + 10;
        if (bx > 10 && bx < w - 10) {
          ctx.beginPath();
          ctx.moveTo(bx, 5);
          ctx.lineTo(bx, chartH);
          ctx.stroke();
          // Night label
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.font = '7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`N${b.night}`, bx, chartH + 10);
        }
      }
      ctx.setLineDash([]);
    }

    // Y axis label
    ctx.fillStyle = COLORS.TEXT_DIM;
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`max: ${maxLen}`, 4, 10);
  }

  reset() {
    this.queueLengthHistory = [];
    this.sampleInterval = 30;
    this.nightBoundaries = [];
    this.globalTickOffset = 0;
  }
}
