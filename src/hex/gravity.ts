import { HexCoord, GameBoard } from '../types';
import { coordKey, distanceFromCenter, directionTowardCenter } from './hexUtils';

// Apply center-directed gravity: emojis slide toward (0,0)
// Process from inside out — if a cell is empty, pull from the next cell outward.
// Repeat until stable.
export function applyGravity(board: GameBoard, coords: HexCoord[]): GameBoard {
  const newBoard = new Map(board);
  const validKeys = new Set(coords.map(c => coordKey(c.q, c.r)));

  let changed = true;
  let iterations = 0;
  const maxIterations = 20;

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

      // This cell is empty — look for an emoji to pull from the outward direction
      const dir = directionTowardCenter(coord.q, coord.r);
      if (!dir) continue; // center cell

      // The outward direction is the opposite of toward-center
      const outQ = coord.q - dir[0];
      const outR = coord.r - dir[1];
      const outKey = coordKey(outQ, outR);

      if (!validKeys.has(outKey)) continue;

      const outEmoji = newBoard.get(outKey);
      if (outEmoji !== null && outEmoji !== undefined) {
        // Pull emoji inward
        newBoard.set(key, outEmoji);
        newBoard.set(outKey, null);
        changed = true;
      }
    }
  }

  return newBoard;
}
