export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

export const SPEED_LEVELS = [
  { label: '1x',   charsPerFrame: 1,     frameDelay: 100 },
  { label: '10x',  charsPerFrame: 10,    frameDelay: 16 },
  { label: '100x', charsPerFrame: 100,   frameDelay: 16 },
  { label: '1Kx',  charsPerFrame: 1000,  frameDelay: 16 },
  { label: 'MAX',  charsPerFrame: 50000, frameDelay: 16 },
];

export const THEME = {
  BG_DARK: '#0a0a14',
  BG_PANEL: '#0f0f20',
  BORDER: '#1a1a3a',
  TEXT_PRIMARY: '#e0d8c8',
  TEXT_MUTED: '#666',
  ACCENT_GOLD: '#d4a537',
  ACCENT_GREEN: '#00ff88',
  ACCENT_RED: '#ff4455',
  ACCENT_BLUE: '#4488ff',
};

export const PARTICLES = {
  MATCH_COUNT: 8,
  SUCCESS_COUNT: 120,
  GRAVITY: 0.15,
  FRICTION: 0.98,
  MAX_ACTIVE: 300,
  DISABLE_ABOVE_SPEED: 3,
};

export const SIMULATION = {
  DEFAULT_TARGET: 'hello',
  MAX_TARGET_LENGTH: 20,
  MILESTONE_DELAY_MIN: 300,
  MILESTONE_DELAY_MAX: 1500,
};
