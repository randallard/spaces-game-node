/**
 * Board validation utilities
 * Rules based on game requirements:
 * - Exactly 1 piece required
 * - 0-3 traps allowed
 * - Total sequence items: minimum 2, maximum 8
 * - Sequence numbers must be consecutive 1..N with no duplicates
 * - Each sequence item must correspond to a cell on the board
 */

import type { Board, BoardMove, CellContent } from '@/types';

export type ValidationError = {
  field: string;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};

/**
 * Validate a complete board
 */
export function validateBoard(board: Board): ValidationResult {
  const errors: ValidationError[] = [];

  // Check piece count
  // NOTE: If board has a final move, the piece is removed from grid (count = 0)
  const pieceCount = countCellType(board.grid, 'piece');
  const hasFinalMove = board.sequence.some(m => m.type === 'final');
  const expectedPieceCount = hasFinalMove ? 0 : 1;

  if (pieceCount !== expectedPieceCount) {
    errors.push({
      field: 'piece',
      message: hasFinalMove
        ? `Board with final move should have 0 pieces in grid (found ${pieceCount})`
        : `Board must have exactly 1 piece (found ${pieceCount})`,
    });
  }

  // Check trap count
  const trapCount = countCellType(board.grid, 'trap');
  if (trapCount > 3) {
    errors.push({
      field: 'trap',
      message: `Board can have maximum 3 traps (found ${trapCount})`,
    });
  }

  // Check sequence count
  const sequenceCount = board.sequence.length;
  if (sequenceCount < 2) {
    errors.push({
      field: 'sequence',
      message: `Board must have at least 2 sequence items (found ${sequenceCount})`,
    });
  }
  if (sequenceCount > 8) {
    errors.push({
      field: 'sequence',
      message: `Board can have maximum 8 sequence items (found ${sequenceCount})`,
    });
  }

  // Check that sequence count matches grid content
  // NOTE: Final moves are in sequence but not in grid, so we need to account for them
  const finalMoveCount = board.sequence.filter(m => m.type === 'final').length;
  const totalItems = pieceCount + trapCount + finalMoveCount;
  if (sequenceCount !== totalItems) {
    errors.push({
      field: 'sequence',
      message: `Sequence length (${sequenceCount}) must match total pieces + traps + final moves (${totalItems})`,
    });
  }

  // Validate sequence order (must be 1, 2, 3, ..., N)
  const sequenceValidation = validateSequenceOrder(board.sequence);
  if (!sequenceValidation.valid) {
    errors.push(...sequenceValidation.errors);
  }

  // Validate that each sequence item corresponds to correct grid cell
  const gridValidation = validateSequenceMatchesGrid(board);
  if (!gridValidation.valid) {
    errors.push(...gridValidation.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Count cells of a specific type in the grid
 */
function countCellType(
  grid: CellContent[][],
  type: CellContent
): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell === type) count++;
    }
  }
  return count;
}

/**
 * Validate that sequence order numbers are consecutive 1..N with no duplicates
 */
function validateSequenceOrder(
  sequence: BoardMove[]
): ValidationResult {
  const errors: ValidationError[] = [];

  if (sequence.length === 0) {
    return { valid: true, errors: [] };
  }

  // Extract order numbers and check for duplicates
  const orders = sequence.map((move) => move.order);
  const uniqueOrders = new Set(orders);

  if (uniqueOrders.size !== orders.length) {
    errors.push({
      field: 'sequence',
      message: 'Sequence order numbers must be unique (no duplicates)',
    });
  }

  // Check that orders are consecutive starting from 1
  const sortedOrders = [...orders].sort((a, b) => a - b);
  for (let i = 0; i < sortedOrders.length; i++) {
    const expected = i + 1;
    const actual = sortedOrders[i];
    if (actual !== expected) {
      errors.push({
        field: 'sequence',
        message: `Sequence order must be consecutive 1..${sequence.length} (found ${actual} at position ${i + 1})`,
      });
      break; // Only report first mismatch
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that each sequence item corresponds to the correct cell in the grid
 * NOTE: 'final' moves are in sequence but NOT in grid (they mark goal reached)
 */
function validateSequenceMatchesGrid(board: Board): ValidationResult {
  const errors: ValidationError[] = [];

  for (const move of board.sequence) {
    const { row, col } = move.position;

    // Skip 'final' moves - they're in sequence but not in grid (goal reached marker)
    if (move.type === 'final') {
      // Validate that final move is at row 0 (top row)
      if (row !== 0) {
        errors.push({
          field: 'sequence',
          message: `Final move (item ${move.order}) must be at row 0 (top row), found at row ${row}`,
        });
      }
      continue;
    }

    // Check bounds
    if (row < 0 || row >= board.grid.length) {
      errors.push({
        field: 'sequence',
        message: `Sequence item ${move.order} has invalid row ${row}`,
      });
      continue;
    }

    const gridRow = board.grid[row];
    if (!gridRow || col < 0 || col >= gridRow.length) {
      errors.push({
        field: 'sequence',
        message: `Sequence item ${move.order} has invalid col ${col}`,
      });
      continue;
    }

    // Check that cell content matches sequence type
    const cellContent = gridRow[col];
    const expectedContent: CellContent = move.type === 'piece' ? 'piece' : 'trap';

    if (cellContent !== expectedContent) {
      errors.push({
        field: 'sequence',
        message: `Sequence item ${move.order} at (${row}, ${col}) expects ${expectedContent} but found ${cellContent}`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Quick validation checks (returns true/false)
 */
export function isValidBoard(board: Board): boolean {
  return validateBoard(board).valid;
}

export function hasExactlyOnePiece(board: Board): boolean {
  return countCellType(board.grid, 'piece') === 1;
}

export function hasTooManyTraps(board: Board): boolean {
  return countCellType(board.grid, 'trap') > 3;
}

export function hasValidSequenceCount(board: Board): boolean {
  const count = board.sequence.length;
  return count >= 2 && count <= 8;
}

export function hasConsecutiveSequence(board: Board): boolean {
  return validateSequenceOrder(board.sequence).valid;
}
