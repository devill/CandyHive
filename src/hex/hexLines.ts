import { HexCoord, GameBoard } from '../types';
import { coordKey } from './hexUtils';

// The 3 hex axis directions (each line runs along one of these)
const AXES: [number, number][] = [
  [1, 0],   // q-axis
  [0, 1],   // r-axis
  [1, -1],  // s-axis (q-r direction)
];

// Group hex coords into lines along each axis.
// A "line" is a set of cells that share the same perpendicular coordinate.
export function getAllLines(coords: HexCoord[]): HexCoord[][] {
  const lines: HexCoord[][] = [];
  const coordSet = new Set(coords.map(c => coordKey(c.q, c.r)));

  for (const [dq, dr] of AXES) {
    // Group cells by their position perpendicular to this axis
    const groups = new Map<string, HexCoord[]>();

    for (const coord of coords) {
      // For axis (dq, dr), the perpendicular key identifies which line a cell is on.
      // We use the cross product components as the grouping key.
      let groupKey: string;
      if (dq === 1 && dr === 0) {
        // q-axis: group by r
        groupKey = `${dr}:${coord.r}`;
      } else if (dq === 0 && dr === 1) {
        // r-axis: group by q
        groupKey = `${dq}:${coord.q}`;
      } else {
        // s-axis (1,-1): group by q+r (which is -s)
        groupKey = `s:${coord.q + coord.r}`;
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(coord);
    }

    // Sort each group along the axis direction
    for (const group of groups.values()) {
      group.sort((a, b) => {
        // Sort by projection onto the axis direction
        const projA = a.q * dq + a.r * dr;
        const projB = b.q * dq + b.r * dr;
        return projA - projB;
      });
      lines.push(group);
    }
  }

  return lines;
}

// Find all cells that are part of a 3+ run of the same emoji
export function findMatches(board: GameBoard, coords: HexCoord[]): Set<string> {
  const matched = new Set<string>();
  const lines = getAllLines(coords);

  for (const line of lines) {
    // Scan for runs of identical emojis
    let runStart = 0;
    while (runStart < line.length) {
      const startKey = coordKey(line[runStart].q, line[runStart].r);
      const emoji = board.get(startKey);

      if (!emoji) {
        runStart++;
        continue;
      }

      let runEnd = runStart + 1;
      while (runEnd < line.length) {
        const endKey = coordKey(line[runEnd].q, line[runEnd].r);
        if (board.get(endKey) !== emoji) break;
        runEnd++;
      }

      const runLength = runEnd - runStart;
      if (runLength >= 3) {
        for (let i = runStart; i < runEnd; i++) {
          matched.add(coordKey(line[i].q, line[i].r));
        }
      }

      runStart = runEnd;
    }
  }

  return matched;
}
