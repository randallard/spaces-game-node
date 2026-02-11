/**
 * Zod schemas for board validation
 */

import { z } from 'zod';
import { MIN_BOARD_SIZE, MAX_BOARD_SIZE } from '@/types';

export const CellContentSchema = z.enum(['empty', 'piece', 'trap', 'final']);

export const BoardSizeSchema = z.number().int().min(MIN_BOARD_SIZE).max(MAX_BOARD_SIZE);

// Dynamic position schema - will be validated based on board size
export const PositionSchema = z.object({
  row: z.number().int().min(-1).max(MAX_BOARD_SIZE - 1), // -1 for final moves, 0 to (size-1) for positions
  col: z.number().int().min(0).max(MAX_BOARD_SIZE - 1),
});

export const BoardMoveSchema = z.object({
  position: PositionSchema,
  type: z.enum(['piece', 'trap', 'final']),
  order: z.number().int().positive(),
});

export const BoardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  boardSize: BoardSizeSchema,
  grid: z.array(z.array(CellContentSchema)), // Dynamic size grid
  sequence: z.array(BoardMoveSchema).min(1), // At least one move
  thumbnail: z.string(), // SVG data URI
  createdAt: z.number().int().positive(),
}).refine(
  (board) => {
    // Validate grid dimensions match boardSize
    const size = board.boardSize;
    if (board.grid.length !== size) return false;
    return board.grid.every((row) => row.length === size);
  },
  { message: 'Grid dimensions must match boardSize' }
).refine(
  (board) => {
    // Validate positions are within bounds
    const maxIndex = board.boardSize - 1;
    return board.sequence.every((move) => {
      if (move.type === 'final') {
        // Final moves should be at row -1
        return move.position.row === -1 && move.position.col >= 0 && move.position.col <= maxIndex;
      }
      // Regular moves should be within grid bounds
      return (
        move.position.row >= 0 &&
        move.position.row <= maxIndex &&
        move.position.col >= 0 &&
        move.position.col <= maxIndex
      );
    });
  },
  { message: 'All positions must be within board bounds' }
);

/**
 * Validates board has exactly one piece
 */
export function validateBoardHasOnePiece(board: z.infer<typeof BoardSchema>): boolean {
  let pieceCount = 0;
  for (const row of board.grid) {
    for (const cell of row) {
      if (cell === 'piece') pieceCount++;
    }
  }
  return pieceCount === 1;
}

/**
 * Validates board trap count does not exceed boardSize - 1
 */
export function validateBoardTrapCount(board: z.infer<typeof BoardSchema>): boolean {
  let trapCount = 0;
  for (const row of board.grid) {
    for (const cell of row) {
      if (cell === 'trap') trapCount++;
    }
  }
  return trapCount >= 0 && trapCount <= board.boardSize - 1;
}
