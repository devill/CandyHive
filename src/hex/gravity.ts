import { HexCoord, GameBoard } from '../types';
import { coordKey, distanceFromCenter, getNeighbors } from './hexUtils';

export interface GravityMove {
  from: string;
  to: string;
}

// Apply center-directed gravity: emojis slide toward (0,0).
// Check ALL 6 neighbors of each empty cell and pull from the farthest-from-center
// neighbor that has an emoji. Repeat until stable.
export function applyGravity(
  board: GameBoard,
  coords: HexCoord[]
): { board: GameBoard; moves: GravityMove[] } {
  const newBoard = new Map(board);
  const validKeys = new Set(coords.map(c => coordKey(c.q, c.r)));
  const allMoves: GravityMove[] = [];

  let changed = true;
  let iterations = 0;
  const maxIterations = 30;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // Sort cells by distance from center (process inner cells first)
    const sortedCoords = [...coords].sort(
      (a, b) => distanceFromCenter(a.q, a.r) - distanceFromCenter(b.q, b.r)
    );

    for (const coord of sortedCoords) {
      const key = coordKey(coord.q, coord.r);
      if (newBoard.get(key) !== null) continue; // not empty

      const cellDist = distanceFromCenter(coord.q, coord.r);

      // Look at ALL 6 neighbors — pull from the farthest one that has an emoji
      const neighbors = getNeighbors(coord.q, coord.r);
      let bestKey: string | null = null;
      let bestDist = -1;

      for (const n of neighbors) {
        const nKey = coordKey(n.q, n.r);
        if (!validKeys.has(nKey)) continue;

        const nDist = distanceFromCenter(n.q, n.r);
        if (nDist <= cellDist) continue; // must be farther from center

        const nEmoji = newBoard.get(nKey);
        if (nEmoji !== null && nEmoji !== undefined && nDist > bestDist) {
          bestKey = nKey;
          bestDist = nDist;
        }
      }

      if (bestKey) {
        newBoard.set(key, newBoard.get(bestKey)!);
        newBoard.set(bestKey, null);
        allMoves.push({ from: bestKey, to: key });
        changed = true;
      }
    }
  }

  return { board: newBoard, moves: allMoves };
}
