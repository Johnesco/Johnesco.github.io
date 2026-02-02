import { TRAINING } from '../config.js';

const STORAGE_KEY = 'neuralpong_save';

export function saveState(population, heatmapData) {
  try {
    const data = {
      population: population.toJSON(),
      heatmap: heatmapData.map(row => Array.from(row)),
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('Failed to save state:', e);
    return false;
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Restore heatmap as Float32Arrays
    if (data.heatmap) {
      data.heatmap = data.heatmap.map(row => new Float32Array(row));
    }
    return data;
  } catch (e) {
    console.warn('Failed to load state:', e);
    return null;
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasSavedState() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
