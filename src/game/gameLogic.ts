import { HexCoord, GameBoard } from '../types';
import { coordKey, areAdjacent, parseKey } from '../hex/hexUtils';
import { findMatches } from '../hex/hexLines';
import { applyGravity } from '../hex/gravity';
import { EMOJIS } from '../constants';

export function createBoard(coords: HexCoord[]): GameBoard {
  const board: GameBoard = new Map();
  for (const { q, r } of coords) {
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    board.set(coordKey(q, r), emoji);
  }
  return board;
}

export function swapCells(board: GameBoard, keyA: string, keyB: string): GameBoard {
  const a = parseKey(keyA);
  const b = parseKey(keyB);
  if (!areAdjacent(a, b)) return board;

  const newBoard = new Map(board);
  const valA = board.get(keyA);
  const valB = board.get(keyB);
  newBoard.set(keyA, valB ?? null);
  newBoard.set(keyB, valA ?? null);
  return newBoard;
}

// Process the board: find matches, clear, apply gravity, repeat.
// Returns the new board and total cells cleared.
export function processBoard(
  board: GameBoard,
  coords: HexCoord[]
): { board: GameBoard; cleared: number } {
  let current = new Map(board);
  let totalCleared = 0;

  let iterations = 0;
  while (iterations < 50) {
    iterations++;
    const matches = findMatches(current, coords);
    if (matches.size === 0) break;

    totalCleared += matches.size;

    // Clear matched cells
    for (const key of matches) {
      current.set(key, null);
    }

    // Apply gravity
    current = applyGravity(current, coords);
  }

  return { board: current, cleared: totalCleared };
}

export function checkWin(board: GameBoard): boolean {
  for (const value of board.values()) {
    if (value !== null) return false;
  }
  return true;
}
