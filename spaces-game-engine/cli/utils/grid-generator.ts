import type { Board, BoardMove, CellContent } from '../../src/types/board.js';

/**
 * Generate a 2D grid from a sequence of moves
 *
 * Key rules:
 * - Grid is auto-generated from sequence only
 * - Traps override piece waypoints at same position
 * - Final moves (goal) are represented at row -1 (virtual row)
 *
 * @param sequence - Ordered list of moves
 * @param boardSize - Size of the board (NxN)
 * @returns 2D grid array
 */
export function generateGrid(sequence: BoardMove[], boardSize: number): CellContent[][] {
  // Initialize empty grid
  const grid: CellContent[][] = Array(boardSize)
    .fill(null)
    .map(() => Array(boardSize).fill('empty'));

  // Track positions where traps are placed
  const trapPositions = new Set<string>();

  // First pass: identify trap positions
  for (const move of sequence) {
    if (move.type === 'trap' && move.position.row >= 0) {
      const key = `${move.position.row},${move.position.col}`;
      trapPositions.add(key);
    }
  }

  // Second pass: place pieces and traps
  // Traps override pieces at the same position
  for (const move of sequence) {
    // Skip final moves (row -1) - they're off the board
    if (move.type === 'final' || move.position.row < 0) {
      continue;
    }

    const { row, col } = move.position;
    const key = `${row},${col}`;

    // If there's a trap at this position, it takes precedence
    if (trapPositions.has(key)) {
      grid[row][col] = 'trap';
    } else if (move.type === 'piece' && grid[row][col] === 'empty') {
      // Only place piece if cell is still empty (not overridden)
      grid[row][col] = 'piece';
    } else if (move.type === 'trap') {
      grid[row][col] = 'trap';
    }
  }

  return grid;
}

/**
 * Create a complete Board object from sequence
 *
 * @param sequence - Ordered list of moves
 * @param boardSize - Size of the board (NxN)
 * @returns Complete Board object with grid
 */
export function createBoardFromSequence(sequence: BoardMove[], boardSize: number): Board {
  const grid = generateGrid(sequence, boardSize);

  return {
    boardSize,
    grid,
    sequence,
  };
}

/**
 * Get the current piece position at a given step in the sequence
 *
 * @param sequence - Ordered list of moves
 * @param stepNumber - Step number to check (1-indexed)
 * @returns Position of piece at that step, or null if no piece yet
 */
export function getCurrentPosition(sequence: BoardMove[], stepNumber: number): { row: number; col: number } | null {
  // Find the most recent piece move up to the given step
  const movesUpToStep = sequence
    .filter(move => move.order <= stepNumber)
    .sort((a, b) => a.order - b.order);

  // Find last piece move (excluding final)
  for (let i = movesUpToStep.length - 1; i >= 0; i--) {
    if (movesUpToStep[i].type === 'piece') {
      return movesUpToStep[i].position;
    }
  }

  return null;
}
