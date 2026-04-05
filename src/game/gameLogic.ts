import { HexCoord, GameBoard } from '../types';
import { coordKey, areAdjacent, parseKey } from '../hex/hexUtils';
import { findMatches } from '../hex/hexLines';
import { applyGravity, GravityMove } from '../hex/gravity';
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

// Check if swapping two cells would produce at least one match
export function wouldSwapMatch(
  board: GameBoard,
  keyA: string,
  keyB: string,
  coords: HexCoord[]
): boolean {
  const swapped = swapCells(board, keyA, keyB);
  return findMatches(swapped, coords).size > 0;
}

// One step of processing: find matches, clear them, apply gravity.
// Returns null if no matches found.
export interface ProcessStep {
  matched: Set<string>;
  gravityMoves: GravityMove[];
  boardAfterClear: GameBoard;
  boardAfterGravity: GameBoard;
}

export function processStep(
  board: GameBoard,
  coords: HexCoord[]
): ProcessStep | null {
  const matched = findMatches(board, coords);
  if (matched.size === 0) return null;

  const boardAfterClear = new Map(board);
  for (const key of matched) {
    boardAfterClear.set(key, null);
  }

  const gravResult = applyGravity(boardAfterClear, coords);

  return {
    matched,
    gravityMoves: gravResult.moves,
    boardAfterClear,
    boardAfterGravity: gravResult.board,
  };
}

// Process all cascading matches synchronously (used for initial board setup)
export function processBoard(
  board: GameBoard,
  coords: HexCoord[]
): { board: GameBoard; cleared: number } {
  let current = new Map(board);
  let totalCleared = 0;

  let iterations = 0;
  while (iterations < 50) {
    iterations++;
    const step = processStep(current, coords);
    if (!step) break;

    totalCleared += step.matched.size;
    current = step.boardAfterGravity;
  }

  return { board: current, cleared: totalCleared };
}

export function checkWin(board: GameBoard): boolean {
  for (const value of board.values()) {
    if (value !== null) return false;
  }
  return true;
}
