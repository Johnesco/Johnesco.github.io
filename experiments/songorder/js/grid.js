import { TILE, VENUE_SIZES, DEFAULT_VENUE_SIZE } from './config.js';

const CHAR_MAP = {
  'W': TILE.WALL,
  '.': TILE.FLOOR,
  'T': TILE.TABLE,
  'C': TILE.CHAIR,
  'S': TILE.STAGE,
  'U': TILE.SIGNUP,
  'E': TILE.ENTRANCE,
};

// Generate a venue layout string array from a VENUE_SIZES preset
function generateLayout(config) {
  const { pairsPerRow, tableRows, stageW, openFloor } = config;

  // ── Width calculation ──
  const tableBlockW = 3 + 2 + 3;           // one pair: CCC..CCC = 8
  const aisleW = 5;                         // aisle between pairs
  const tablePad = 1;                       // floor padding each side of tables
  const tablesWidth = pairsPerRow * tableBlockW + (pairsPerRow - 1) * aisleW;

  // Minimum width: stage + gap + signup + queue room + walls
  const stageMinWidth = stageW + 2 + 1 + 6; // stage + gap + signup + queue/pad
  const innerW = Math.max(tablesWidth + tablePad * 2, stageMinWidth);
  const gridW = innerW + 2; // add walls

  // ── Height calculation ──
  const stageH = 2;
  const tableBlockH = tableRows * 3 + (tableRows - 1); // 3 per row + gaps between
  const gridH = 1 + stageH + 1 + tableBlockH + openFloor + 1;
  //           wall  stage  gap   tables       open       wall+entrance

  // ── Build rows ──
  const rows = [];

  // Helper: create a floor row with walls
  const floorRow = () => {
    const r = Array(gridW).fill('.');
    r[0] = 'W';
    r[gridW - 1] = 'W';
    return r;
  };

  // Row 0: top wall
  rows.push(Array(gridW).fill('W'));

  // ── Stage + signup rows ──
  // Place signup left-of-center so there's plenty of room for the queue line to the right
  const signupX = Math.min(gridW - 6, Math.floor(gridW * 0.55));
  const stageStartX = Math.max(2, signupX - stageW - 2);

  for (let r = 0; r < stageH; r++) {
    const row = floorRow();
    // Place stage
    for (let c = stageStartX; c < stageStartX + stageW; c++) {
      row[c] = 'S';
    }
    // Signup on second stage row
    if (r === stageH - 1) {
      row[signupX] = 'U';
    }
    rows.push(row);
  }

  // Gap after stage
  rows.push(floorRow());

  // ── Table rows ──
  // Center the table block horizontally
  const tableAreaStart = 1 + Math.floor((innerW - tablesWidth) / 2) + 1;

  for (let tr = 0; tr < tableRows; tr++) {
    // 3 sub-rows per table row (CCC / CTC / CCC)
    for (let subRow = 0; subRow < 3; subRow++) {
      const row = floorRow();
      let x = tableAreaStart;

      for (let p = 0; p < pairsPerRow; p++) {
        if (p > 0) x += aisleW;

        // First table of pair
        for (let c = 0; c < 3; c++) {
          row[x + c] = (subRow === 1 && c === 1) ? 'T' : 'C';
        }
        x += 3 + 2; // table + gap

        // Second table of pair
        for (let c = 0; c < 3; c++) {
          row[x + c] = (subRow === 1 && c === 1) ? 'T' : 'C';
        }
        x += 3;
      }

      rows.push(row);
    }

    // Gap between table rows (not after last)
    if (tr < tableRows - 1) {
      rows.push(floorRow());
    }
  }

  // Open floor rows
  for (let r = 0; r < openFloor; r++) {
    rows.push(floorRow());
  }

  // ── Bottom wall with entrance ──
  const bottomRow = Array(gridW).fill('W');
  const entranceW = 3;
  const entranceStart = Math.floor((gridW - entranceW) / 2);

  // Floor padding around entrance for connectivity
  if (entranceStart > 0) bottomRow[entranceStart - 1] = '.';
  for (let c = entranceStart; c < entranceStart + entranceW; c++) {
    bottomRow[c] = 'E';
  }
  if (entranceStart + entranceW < gridW) bottomRow[entranceStart + entranceW] = '.';

  rows.push(bottomRow);

  return { layout: rows.map(r => r.join('')), w: gridW, h: rows.length };
}

export class Grid {
  constructor(venueSizeIndex = DEFAULT_VENUE_SIZE) {
    const config = VENUE_SIZES[venueSizeIndex] || VENUE_SIZES[DEFAULT_VENUE_SIZE];
    const { layout, w, h } = generateLayout(config);

    this.w = w;
    this.h = h;
    this.tiles = new Uint8Array(w * h);
    this.chairs = [];
    this.stageCenter = null;
    this.signupPos = null;
    this.entrancePos = null;

    this._parse(layout);
  }

  _parse(layout) {
    const entranceTiles = [];
    const stageTiles = [];

    for (let y = 0; y < this.h; y++) {
      const row = layout[y];
      for (let x = 0; x < this.w; x++) {
        const ch = row[x];
        const tile = CHAR_MAP[ch] ?? TILE.FLOOR;
        this.tiles[y * this.w + x] = tile;

        if (tile === TILE.CHAIR) {
          this.chairs.push({ x, y, occupant: null });
        }
        if (tile === TILE.STAGE) {
          stageTiles.push({ x, y });
        }
        if (tile === TILE.SIGNUP) {
          this.signupPos = { x, y };
        }
        if (tile === TILE.ENTRANCE) {
          entranceTiles.push({ x, y });
        }
      }
    }

    if (stageTiles.length) {
      const sx = stageTiles.reduce((s, t) => s + t.x, 0) / stageTiles.length;
      const sy = stageTiles.reduce((s, t) => s + t.y, 0) / stageTiles.length;
      this.stageCenter = { x: Math.round(sx), y: Math.round(sy) };
    }

    if (entranceTiles.length) {
      const ex = entranceTiles.reduce((s, t) => s + t.x, 0) / entranceTiles.length;
      const ey = entranceTiles.reduce((s, t) => s + t.y, 0) / entranceTiles.length;
      this.entrancePos = { x: Math.round(ex), y: Math.round(ey) };
    }
  }

  tileAt(x, y) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return TILE.WALL;
    return this.tiles[y * this.w + x];
  }

  isWalkable(x, y, allowStage = false) {
    const t = this.tileAt(x, y);
    if (t === TILE.WALL || t === TILE.TABLE) return false;
    if (t === TILE.STAGE && !allowStage) return false;
    return true;
  }

  findEmptyChair(fromX, fromY) {
    let best = null;
    let bestDist = Infinity;
    for (const chair of this.chairs) {
      if (chair.occupant !== null) continue;
      const d = Math.abs(chair.x - fromX) + Math.abs(chair.y - fromY);
      if (d < bestDist) {
        bestDist = d;
        best = chair;
      }
    }
    return best;
  }

  occupyChair(chair, patronId) {
    chair.occupant = patronId;
  }

  releaseChair(patronId) {
    for (const chair of this.chairs) {
      if (chair.occupant === patronId) {
        chair.occupant = null;
        return;
      }
    }
  }

  getChairFor(patronId) {
    return this.chairs.find(c => c.occupant === patronId) || null;
  }

  resetOccupancy() {
    for (const chair of this.chairs) {
      chair.occupant = null;
    }
  }

  totalChairs() {
    return this.chairs.length;
  }

  occupiedChairs() {
    return this.chairs.filter(c => c.occupant !== null).length;
  }
}
