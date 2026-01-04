/**
 * Helper functions for App component
 * Extracted for testability and reusability
 */

import type { UserProfile, Opponent, GameState } from '@/types';
import {
  CPU_TOUGHER_OPPONENT_ID,
  CPU_TOUGHER_OPPONENT_NAME,
} from '@/constants/game-rules';

/**
 * Get opponent icon based on opponent type and ID/name
 *
 * @param opponent - The opponent to get icon for
 * @returns Emoji string representing the opponent
 *
 * @example
 * ```ts
 * getOpponentIcon({ type: 'cpu', id: 'cpu-sam', ... }) // '🤖'
 * getOpponentIcon({ type: 'cpu', id: CPU_TOUGHER_OPPONENT_ID, ... }) // '🦾'
 * getOpponentIcon({ type: 'remote-cpu', ... }) // '🌐'
 * getOpponentIcon({ type: 'human', ... }) // '👤'
 * ```
 */
export function getOpponentIcon(opponent: Opponent): string {
  if (opponent.type === 'cpu') {
    // CPU Tougher gets the strong arm emoji
    if (
      opponent.id === CPU_TOUGHER_OPPONENT_ID ||
      opponent.name === CPU_TOUGHER_OPPONENT_NAME
    ) {
      return '🦾';
    }
    // CPU Sam gets the robot emoji
    return '🤖';
  }
  if (opponent.type === 'remote-cpu') {
    // Remote CPU gets the globe emoji
    return '🌐';
  }
  // Human opponents get the person emoji
  return '👤';
}

/**
 * Create an empty user profile for game state initialization
 *
 * @returns Empty user profile with default values
 *
 * @example
 * ```ts
 * const emptyUser = createEmptyUser();
 * // { id: '', name: '', createdAt: <timestamp>, stats: { ... } }
 * ```
 */
export function createEmptyUser(): UserProfile {
  return {
    id: '',
    name: '',
    createdAt: Date.now(),
    stats: {
      totalGames: 0,
      wins: 0,
      losses: 0,
      ties: 0,
    },
  };
}

/**
 * Create initial game state based on saved user
 *
 * Logic:
 * - If user exists with a name: start in 'board-management' phase
 * - If no user or no name: start in 'tutorial-intro' phase
 *
 * @param user - Saved user profile or null
 * @returns Initial game state
 *
 * @example
 * ```ts
 * // New user - starts tutorial
 * const state1 = createInitialState(null);
 * // state1.phase.type === 'tutorial-intro'
 *
 * // Existing user - goes to board management
 * const state2 = createInitialState({ name: 'Alice', ... });
 * // state2.phase.type === 'board-management'
 * ```
 */
export function createInitialState(user: UserProfile | null): GameState {
  // If we have a saved user with a name, go to board management
  // Otherwise start with tutorial
  const phase: GameState['phase'] =
    user && user.name ? { type: 'board-management' } : { type: 'tutorial-intro' };

  return {
    phase,
    user: user || createEmptyUser(),
    opponent: null,
    gameId: null,
    gameCreatorId: null,
    gameMode: null,
    boardSize: null,
    currentRound: 1,
    playerScore: 0,
    opponentScore: 0,
    playerSelectedBoard: null,
    opponentSelectedBoard: null,
    playerSelectedDeck: null,
    opponentSelectedDeck: null,
    roundHistory: [],
    checksum: '',
  };
}
