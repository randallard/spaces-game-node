import { isBoardPlayable } from '../../src/simulation.js';
import type { Board } from '../../src/types/board.js';

/**
 * Validation result with user-friendly error messages
 */
export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

/**
 * Validate a board using the engine's validation logic
 *
 * This is a thin wrapper around isBoardPlayable() that provides
 * user-friendly error messages for CLI display.
 *
 * IMPORTANT: Uses exact same validation as RL/ML training.
 * DO NOT add additional validation logic here.
 *
 * @param board - Board to validate
 * @returns Validation result with error messages
 */
export function validateBoard(board: Board): ValidationResult {
  const isValid = isBoardPlayable(board);

  if (isValid) {
    return {
      valid: true,
      errors: [],
    };
  }

  // Board is invalid - provide user-friendly error message
  // Note: isBoardPlayable() doesn't return specific error reasons,
  // so we provide a generic message pointing to common issues
  return {
    valid: false,
    errors: [
      'Board validation failed. Common issues:',
      '  • Diagonal or jump moves (only orthogonal moves allowed)',
      '  • Piece moving into a trap',
      '  • Trap placed non-adjacent to piece position',
      '  • Supermove without immediate piece movement',
      '  • Sequence pointing to empty cells',
      '  • Invalid board size or out-of-bounds positions',
      '',
      'Run with verbose mode to see full board details.',
    ],
  };
}

/**
 * Validate a board and throw an error if invalid
 *
 * @param board - Board to validate
 * @throws Error if board is invalid
 */
export function validateBoardOrThrow(board: Board): void {
  const result = validateBoard(board);

  if (!result.valid) {
    throw new Error(result.errors.join('\n'));
  }
}

/**
 * Check if a move is orthogonally adjacent to current position
 *
 * Used for real-time validation during interactive board building.
 *
 * @param from - Current position
 * @param to - Target position
 * @returns True if move is valid (1 square orthogonally)
 */
export function isAdjacentOrthogonal(
  from: { row: number; col: number },
  to: { row: number; col: number }
): boolean {
  const rowDiff = Math.abs(to.row - from.row);
  const colDiff = Math.abs(to.col - from.col);

  // Must move exactly 1 square in one direction
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Check if a position is within board bounds
 *
 * @param position - Position to check
 * @param boardSize - Board size
 * @returns True if position is valid
 */
export function isPositionInBounds(
  position: { row: number; col: number },
  boardSize: number
): boolean {
  // Allow row -1 for final/goal position
  return (
    position.row >= -1 &&
    position.row < boardSize &&
    position.col >= 0 &&
    position.col < boardSize
  );
}

/**
 * Validate a move during interactive building
 *
 * Provides immediate feedback before adding to sequence.
 *
 * @param currentPosition - Current piece position
 * @param nextPosition - Proposed next position
 * @param moveType - Type of move ('piece' or 'trap')
 * @param boardSize - Board size
 * @param existingTraps - Set of existing trap positions
 * @returns Validation result
 */
export function validateInteractiveMove(
  currentPosition: { row: number; col: number } | null,
  nextPosition: { row: number; col: number },
  moveType: 'piece' | 'trap',
  boardSize: number,
  existingTraps: Set<string>
): ValidationResult {
  const errors: string[] = [];

  // Check bounds
  if (!isPositionInBounds(nextPosition, boardSize)) {
    errors.push('Position is out of bounds');
  }

  // Check move validity
  if (currentPosition && moveType === 'piece') {
    // Piece move must be adjacent and orthogonal
    if (!isAdjacentOrthogonal(currentPosition, nextPosition)) {
      errors.push('Piece must move exactly 1 square orthogonally (up/down/left/right)');
    }

    // Piece cannot move into trap
    const trapKey = `${nextPosition.row},${nextPosition.col}`;
    if (existingTraps.has(trapKey)) {
      errors.push('Piece cannot move into a trap');
    }
  }

  if (currentPosition && moveType === 'trap') {
    // Trap must be adjacent OR at current position (supermove)
    const samePosition =
      nextPosition.row === currentPosition.row && nextPosition.col === currentPosition.col;

    if (!samePosition && !isAdjacentOrthogonal(currentPosition, nextPosition)) {
      errors.push('Trap must be placed adjacent to current position or at current position (supermove)');
    }

    // Warn about supermove
    if (samePosition) {
      errors.push('⚠️  SUPERMOVE: Piece must move out of this space on the very next step');
    }
  }

  return {
    valid: errors.filter(e => !e.startsWith('⚠️')).length === 0,
    errors,
  };
}
