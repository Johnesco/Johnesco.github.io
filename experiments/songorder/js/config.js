// All tunable simulation constants
// TIMING PHILOSOPHY: 1x speed = real time. All durations in seconds, converted to ticks.

export const TILE = {
  FLOOR: 0,
  WALL: 1,
  TABLE: 2,
  CHAIR: 3,
  STAGE: 4,
  SIGNUP: 5,
  ENTRANCE: 6,
};

export const STATE = {
  ENTERING: 0,
  WALKING_TO_SEAT: 1,
  SEATED: 2,
  WALKING_TO_SIGNUP: 3,
  AT_SIGNUP: 4,
  WALKING_BACK: 5,
  SEATED_WAITING: 6,
  CALLED_TO_STAGE: 7,
  SINGING: 8,
  RETURNING_TO_SEAT: 9,
  LEAVING: 10,
  QUEUING_AT_SIGNUP: 11,
};

export const STATE_NAMES = [
  'entering', 'walking to seat', 'seated', 'walking to signup',
  'at signup', 'walking back', 'waiting', 'called to stage',
  'singing', 'returning', 'leaving', 'queuing at signup',
];

export const SIM = {
  MAX_TILE_SIZE: 28,
  MAX_CANVAS_W: 900,
  DEFAULT_SEED: 42,
  TPS: 60,          // ticks per second — 1x speed = real time
  TILE_FEET: 2,     // each tile represents 2 feet
};

// ── Venue size presets ──
// pairsPerRow = groups of 2 tables across, tableRows = rows of tables down
// stageW = stage width in tiles, openFloor = empty rows between tables and entrance
export const VENUE_SIZES = [
  { label: 'Cozy',     pairsPerRow: 1, tableRows: 2, stageW: 4, openFloor: 3 },
  { label: 'Small',    pairsPerRow: 1, tableRows: 3, stageW: 4, openFloor: 4 },
  { label: 'Medium',   pairsPerRow: 2, tableRows: 3, stageW: 6, openFloor: 6 },
  { label: 'Large',    pairsPerRow: 2, tableRows: 4, stageW: 6, openFloor: 6 },
  { label: 'Club',     pairsPerRow: 3, tableRows: 4, stageW: 8, openFloor: 6 },
];

export const DEFAULT_VENUE_SIZE = 2; // Medium

// Helper: seconds → ticks
export function sec(s) { return Math.round(s * SIM.TPS); }

// ── Patron behavior (all values in real-world seconds) ──
export const PATRON = {
  // Walking: ~3 ft/s indoors in a crowded bar = 1.5 tiles/sec
  // ticks per tile step = TPS / (speed_fps / tile_feet) = 60 / 1.5 = 40
  WALK_SPEED_FPS: 3.0,         // feet per second, base
  WALK_SPEED_VARIANCE_FPS: 0.8,// +/- variation (some people amble, some hustle)

  // Song duration: average karaoke song ~3:30, range roughly 2:00 to 5:30
  SONG_MEAN_S: 210,            // 3 minutes 30 seconds
  SONG_VARIANCE_S: 90,         // +/- 1:30 (uniform random)

  // Time at the sign-up station: browse the book, pick a song, fill out the slip
  SIGNUP_ACTION_S: 30,         // 30 seconds

  // How long seated before deciding to go sign up (first time)
  FIRST_SIGNUP_MIN_S: 60,     // 1 minute minimum
  FIRST_SIGNUP_MAX_S: 300,    // 5 minutes maximum

  // How long after returning from singing before re-signing up
  RE_SIGNUP_MIN_S: 120,       // 2 minutes
  RE_SIGNUP_MAX_S: 480,       // 8 minutes

  // Patience: how long they'll wait after submitting before leaving
  PATIENCE_BASE_S: 2400,      // 40 minutes
  PATIENCE_VARIANCE_S: 1200,  // +/- 20 minutes (range: 20-60 min)

  // Probability a patron will ever sign up (some just watch)
  SIGNUP_PROBABILITY: 0.9,

  // Signup line: each person in line multiplies the signup delay
  // e.g. 3 in line → delay × (1 + 3*0.3) = 1.9× normal wait
  SIGNUP_LINE_DISCOURAGE: 0.3,

  // ── Mood / fun system ──
  // Fun is 0-100. Starts at a random level. Decays over time.
  // Singing gives a huge boost. Watching gives a small boost.
  // Below LEAVE_THRESHOLD, patron considers leaving.
  FUN_START_MIN: 40,
  FUN_START_MAX: 80,
  FUN_DECAY_PER_S: 0.15,       // loses ~9 fun per minute while seated idle
  FUN_SING_BOOST: 40,          // huge boost from singing
  FUN_WATCH_BOOST_PER_S: 0.05, // small trickle while someone else is singing
  FUN_SIGNUP_BOOST: 8,         // anticipation boost from submitting a song
  FUN_LEAVE_THRESHOLD: 15,     // below this, patron decides to leave
};

// ── Session / night timing ──
export const SESSION = {
  OPEN_HOUR: 20,       // 8 PM (24h format)
  CLOSE_HOUR: 2,       // 2 AM next day
  LAST_CALL_MIN: 30,   // 30 min before close, stop new arrivals
};

// Derived: night duration in hours, seconds, ticks
SESSION.DURATION_HOURS = (SESSION.CLOSE_HOUR + 24 - SESSION.OPEN_HOUR) % 24; // 6
SESSION.DURATION_TICKS = SESSION.DURATION_HOURS * 3600 * SIM.TPS;
SESSION.LAST_CALL_TICKS = SESSION.DURATION_TICKS - SESSION.LAST_CALL_MIN * 60 * SIM.TPS;

// Night phases
export const PHASE = {
  OPEN: 'open',
  LAST_CALL: 'last_call',
  CLOSING: 'closing',
  ENDED: 'ended',
};

// ── Arrival curve ──
// Piecewise linear: [nightProgress (0-1), rateMultiplier (0-1)]
const ARRIVAL_CURVE = [
  [0.00, 0.3],   // opening trickle
  [0.10, 0.6],   // warming up
  [0.25, 1.0],   // peak (~2hr in)
  [0.35, 1.0],   // sustained peak
  [0.50, 0.7],   // tapering
  [0.70, 0.3],   // late stragglers
  [0.85, 0.0],   // last call cutoff
  [1.00, 0.0],   // closed
];

// Interpolate the arrival curve
export function getArrivalRate(nightProgress) {
  if (nightProgress <= 0) return ARRIVAL_CURVE[0][1];
  if (nightProgress >= 1) return 0;
  for (let i = 1; i < ARRIVAL_CURVE.length; i++) {
    if (nightProgress <= ARRIVAL_CURVE[i][0]) {
      const [x0, y0] = ARRIVAL_CURVE[i - 1];
      const [x1, y1] = ARRIVAL_CURVE[i];
      const t = (nightProgress - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return 0;
}

// ── Arrival rate ──
export const SPAWN = {
  // Peak rate: ~1 patron every 30s at peak = P(spawn per tick) ≈ 1/1800
  PEAK_RATE: 1 / (30 * SIM.TPS),
  MAX_PATRONS: 50,
};

// ── KJ (Karaoke Jockey) ──
export const KJ = {
  CALL_DELAY_S: 5,        // seconds the KJ announces before patron walks up
  NO_SHOW_WAIT_S: 15,     // total going-once/going-twice wait
  CALLOUTS: [
    'Next up, $!',
    'Give it up for $!',
    '$, you\'re up!',
    'Come on up, $!',
    'Let\'s hear it for $!',
    'Put your hands together for $!',
    'Alright, $ is next!',
  ],
};

// ── Queue Board (right wall display) ──
export const BOARD = {
  VISIBLE_SLOTS: 3,          // top N entries patrons can read — they wait longer
  MAX_DISPLAY: 20,           // max entries shown on the board
  PATIENCE_MULTIPLIER: 0.35, // patience drains at 35% speed when visible (big boost)
};

// ── Queue modes (kept for backward compat) ──
export const QUEUE_MODE = {
  FIFO: 'fifo',
  ROTATION: 'rotation',
  NEW_PRIORITY: 'new_priority',
};

// ── Rotation rules (individual toggles) ──
export const DEFAULT_RULES = {
  firstTimerPriority: false, // new singers go before repeat singers
  fairRotation: false,       // everyone sings before anyone repeats
  mustSingFirst: true,       // can't re-submit until you've sung
  allowResignup: true,       // can sign up again after singing
};

// ── Rendering colors ──
export const COLORS = {
  BG: '#0a0a1a',
  FLOOR: '#22222e',
  WALL: '#14141e',
  TABLE: '#4a3d2e',
  CHAIR: '#2e2e3a',
  CHAIR_OPEN: '#363646',
  STAGE: '#3a2d4a',
  STAGE_HIGHLIGHT: '#4a3860',
  SIGNUP: '#2d4a3a',
  ENTRANCE: '#2a3a4a',
  ACCENT: '#00ff88',
  ACCENT_DIM: '#00aa5c',
  TEXT: '#c9d1d9',
  TEXT_DIM: '#6a7280',
  GRID_LINE: 'rgba(255,255,255,0.03)',
  QUEUE_NUM: '#ffcc44',
  SINGING_GLOW: 'rgba(255, 200, 60, 0.35)',
};

// First names for patron generation
export const NAMES = [
  'Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Quinn', 'Avery',
  'Blake', 'Drew', 'Ellis', 'Finley', 'Gray', 'Harper', 'Indigo', 'Jesse',
  'Kai', 'Lane', 'Marley', 'Nico', 'Oakley', 'Pat', 'Reese', 'Sage',
  'Tatum', 'Val', 'Wren', 'Zion', 'Ash', 'Brook', 'Cedar', 'Dale',
  'Eden', 'Fern', 'Glen', 'Haven', 'Iris', 'Jade', 'Kit', 'Lark',
];
