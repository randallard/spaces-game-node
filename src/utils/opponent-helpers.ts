/**
 * Opponent helper functions
 */

import { v4 as uuidv4 } from 'uuid';
import { CPU_OPPONENT_ID, CPU_OPPONENT_NAME, CPU_TOUGHER_OPPONENT_ID } from '@/constants/game-rules';
import type { Opponent, Board } from '@/types';

/**
 * Generate opponent ID from type and name
 */
export function generateOpponentId(
  type: 'human' | 'cpu',
  _name: string
): string {
  if (type === 'cpu') {
    return CPU_OPPONENT_ID;
  }
  // For human opponents, use UUID for uniqueness
  return `human-${uuidv4()}`;
}

/**
 * Create CPU opponent
 */
export function createCpuOpponent(): Opponent {
  return {
    id: CPU_OPPONENT_ID,
    name: CPU_OPPONENT_NAME,
    type: 'cpu',
    wins: 0,
    losses: 0,
  };
}

/**
 * Create human opponent
 */
export function createHumanOpponent(name: string): Opponent {
  return {
    id: generateOpponentId('human', name),
    name,
    type: 'human',
    wins: 0,
    losses: 0,
  };
}

/**
 * Check if opponent is CPU
 */
export function isCpuOpponent(opponent: Opponent): boolean {
  return (
    opponent.type === 'cpu' ||
    opponent.id === CPU_OPPONENT_ID ||
    opponent.id === CPU_TOUGHER_OPPONENT_ID
  );
}

/**
 * Select random board for CPU opponent
 */
export function selectRandomBoard(boards: Board[]): Board | null {
  if (boards.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * boards.length);
  return boards[randomIndex] || null;
}

/**
 * Update opponent stats after game
 */
export function updateOpponentStats(
  opponent: Opponent,
  won: boolean
): Opponent {
  return {
    ...opponent,
    wins: won ? opponent.wins + 1 : opponent.wins,
    losses: won ? opponent.losses : opponent.losses + 1,
    // Mark human opponents as having completed at least one game
    ...(opponent.type === 'human' && { hasCompletedGame: true }),
  };
}

/**
 * Calculate win rate percentage
 */
export function calculateWinRate(opponent: Opponent): number {
  const totalGames = opponent.wins + opponent.losses;
  if (totalGames === 0) {
    return 0;
  }
  return (opponent.wins / totalGames) * 100;
}

/**
 * Format opponent stats for display
 */
export function formatOpponentStats(opponent: Opponent): string {
  const totalGames = opponent.wins + opponent.losses;
  const winRate = calculateWinRate(opponent);

  if (totalGames === 0) {
    return 'No games played';
  }

  return `${opponent.wins}W - ${opponent.losses}L (${winRate.toFixed(1)}%)`;
}
