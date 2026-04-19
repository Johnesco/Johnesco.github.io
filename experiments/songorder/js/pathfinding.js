// BFS pathfinding on the small venue grid
// Patrons pass through each other (only tiles block)

export function findPath(grid, sx, sy, gx, gy, { allowStage = false } = {}) {
  if (sx === gx && sy === gy) return [];

  const w = grid.w;
  const h = grid.h;
  const key = (x, y) => y * w + x;
  const visited = new Set();
  const parent = new Map();

  const queue = [{ x: sx, y: sy }];
  visited.add(key(sx, sy));

  const dirs = [
    { dx: 0, dy: -1 }, // up
    { dx: 1, dy: 0 },  // right
    { dx: 0, dy: 1 },  // down
    { dx: -1, dy: 0 }, // left
  ];

  while (queue.length > 0) {
    const cur = queue.shift();

    for (const { dx, dy } of dirs) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const nk = key(nx, ny);

      if (visited.has(nk)) continue;
      if (!grid.isWalkable(nx, ny, allowStage)) continue;

      visited.add(nk);
      parent.set(nk, { x: cur.x, y: cur.y });

      if (nx === gx && ny === gy) {
        // Reconstruct path (excludes start, includes goal)
        const path = [];
        let cx = gx, cy = gy;
        while (cx !== sx || cy !== sy) {
          path.push({ x: cx, y: cy });
          const p = parent.get(key(cx, cy));
          cx = p.x;
          cy = p.y;
        }
        path.reverse();
        return path;
      }

      queue.push({ x: nx, y: ny });
    }
  }

  return null; // no path found
}
