/**
 * Board-related types
 */

export type CellContent = 'empty' | 'piece' | 'trap' | 'final';

export type Position = {
  row: number;
  col: number;
};

export type BoardMove = {
  position: Position;
  type: 'piece' | 'trap' | 'final'; // 'final' = goal reached (top row)
  order: number; // Sequence order (1, 2, 3, etc.)
};

export type BoardSize = number;

// Board size constraints
export const MIN_BOARD_SIZE = 2;
export const MAX_BOARD_SIZE = 99;

// Simple validation
export function isValidBoardSize(size: number): boolean {
  return Number.isInteger(size) && size >= MIN_BOARD_SIZE && size <= MAX_BOARD_SIZE;
}

export type Board = {
  id: string; // UUID
  name: string;
  boardSize: BoardSize; // Grid size (2x2 or 3x3)
  grid: CellContent[][]; // NxN grid
  sequence: BoardMove[]; // Ordered list of moves
  thumbnail: string; // SVG data URI
  createdAt: number; // timestamp
};

/**
 * Grid utilities
 */
export type GridSize = {
  rows: number;
  cols: number;
};
