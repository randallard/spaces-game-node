/**
 * Board scoring utilities
 *
 * Calculates the score a board would earn if played unimpeded
 * (no opponent traps, no collisions). Used for forfeit scoring.
 */

import type { Board } from '@/types';

/**
 * Calculate the score a board would earn played unimpeded.
 * Mirrors the scoring logic in simulateRound():
 * - +1 for first move to each new closest row toward goal
 * - +1 for reaching the goal (final move)
 */
export function calculateBoardScore(board: Board): number {
  let score = 0;
  let currentRow: number | null = null;
  let bestRow = Infinity; // Track closest row to goal (lowest index)

  for (const move of board.sequence) {
    if (move.type === 'piece') {
      if (currentRow !== null && move.position.row < bestRow) {
        score++;
      }
      if (move.position.row < bestRow) {
        bestRow = move.position.row;
      }
      currentRow = move.position.row;
    } else if (move.type === 'final') {
      score++;
    }
    // trap moves don't affect score
  }

  return score;
}
