export interface HexCoord {
  q: number;
  r: number;
}

export type GameBoard = Map<string, string | null>;

export interface GameState {
  board: GameBoard;
  selectedCell: string | null;
  score: number;
  moveCount: number;
  gameWon: boolean;
}
