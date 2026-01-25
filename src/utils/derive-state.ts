/**
 * State derivation utilities
 *
 * These functions compute derived values from the game state's source of truth (roundHistory).
 * This prevents state synchronization bugs by ensuring phase, scores, and selections
 * are always computed from actual game history rather than stored separately.
 *
 * See GAME_PHASES.md lines 944-973 for derivation patterns.
 */

import type { GameState, GamePhase, RoundResult, Board } from '@/types';
import { GAME_RULES } from '@/constants/game-rules';

/**
 * Get board selection for a specific round and player
 *
 * @param history - Complete round history
 * @param round - Round number (1-based)
 * @param side - Which player's board to get
 * @returns Board if selected, null otherwise
 */
export function getBoardForRound(
  history: RoundResult[],
  round: number,
  side: 'player' | 'opponent'
): Board | null {
  const result = history[round - 1];
  if (!result) return null;

  return side === 'player' ? result.playerBoard : result.opponentBoard;
}

/**
 * Determine if a round result is complete (both boards + simulation done)
 *
 * @param result - Round result to check
 * @returns True if round has both boards and simulation results
 */
export function isRoundComplete(result: RoundResult | undefined): boolean {
  if (!result) return false;
  return !!(
    result.playerBoard &&
    result.opponentBoard &&
    result.winner !== undefined &&
    result.playerPoints !== undefined &&
    result.opponentPoints !== undefined
  );
}

/**
 * Determine if a round is partially complete (at least one board selected)
 *
 * @param result - Round result to check
 * @returns True if round has at least one board but isn't complete
 */
export function isRoundPartial(result: RoundResult | undefined): boolean {
  if (!result) return false;
  return !!(
    (result.playerBoard || result.opponentBoard) &&
    !isRoundComplete(result)
  );
}

/**
 * Derive current round number from history
 *
 * Finds the first incomplete round. If all rounds are complete, returns TOTAL_ROUNDS + 1.
 *
 * @param state - Complete game state
 * @returns Current round number (1-based)
 */
export function deriveCurrentRound(state: GameState): number {
  // Check each round in sequence
  for (let round = 1; round <= GAME_RULES.TOTAL_ROUNDS; round++) {
    const result = state.roundHistory[round - 1];
    if (!isRoundComplete(result)) {
      return round;
    }
  }

  // All rounds complete
  return GAME_RULES.TOTAL_ROUNDS + 1;
}

/**
 * Derive player's total score from history
 *
 * @param history - Complete round history
 * @returns Total points scored by player
 */
export function derivePlayerScore(history: RoundResult[]): number {
  return history.reduce((sum, result) => {
    return sum + (result.playerPoints ?? 0);
  }, 0);
}

/**
 * Derive opponent's total score from history
 *
 * @param history - Complete round history
 * @returns Total points scored by opponent
 */
export function deriveOpponentScore(history: RoundResult[]): number {
  return history.reduce((sum, result) => {
    return sum + (result.opponentPoints ?? 0);
  }, 0);
}

/**
 * Derive game winner from final scores
 *
 * @param state - Complete game state
 * @returns Winner ('player', 'opponent', or 'tie')
 */
export function deriveWinner(state: GameState): 'player' | 'opponent' | 'tie' {
  const playerScore = derivePlayerScore(state.roundHistory);
  const opponentScore = deriveOpponentScore(state.roundHistory);

  if (playerScore > opponentScore) return 'player';
  if (opponentScore > playerScore) return 'opponent';
  return 'tie';
}

/**
 * Determine who should move first in a given round
 *
 * Based on game rules:
 * - Odd rounds (1, 3, 5): Game creator goes first
 * - Even rounds (2, 4): Opponent goes first
 *
 * @param round - Round number (1-based)
 * @param userId - Current user's ID
 * @param gameCreatorId - ID of the user who created the game
 * @returns 'player' if current user moves first, 'opponent' otherwise
 */
export function deriveWhoMovesFirst(
  round: number,
  userId: string,
  gameCreatorId: string | null
): 'player' | 'opponent' {
  // If no game creator set, default to player first
  if (!gameCreatorId) return 'player';

  const isUserCreator = userId === gameCreatorId;
  const isOddRound = round % 2 === 1;

  // Odd rounds: creator goes first
  // Even rounds: non-creator goes first
  if (isOddRound) {
    return isUserCreator ? 'player' : 'opponent';
  } else {
    return isUserCreator ? 'opponent' : 'player';
  }
}

/**
 * Derive current game phase from state properties
 *
 * This is the core derivation function that eliminates stored phase bugs.
 * Phase is computed from actual state properties, so it can never get out of sync.
 *
 * UI-only phases (board-management, add-opponent, deck-management, tutorial-*, share-final-results)
 * use phaseOverride since they can't be derived from game state.
 *
 * @param state - Complete game state
 * @returns Computed game phase (or override if set)
 */
export function derivePhase(state: GameState): GamePhase {
  console.log('[derivePhase] === START ===');
  console.log('[derivePhase] phaseOverride:', state.phaseOverride);
  console.log('[derivePhase] user.name:', state.user.name);
  console.log('[derivePhase] gameMode:', state.gameMode);
  console.log('[derivePhase] opponent:', state.opponent?.name, state.opponent?.type);
  console.log('[derivePhase] roundHistory length:', state.roundHistory.length);
  console.log('[derivePhase] roundHistory:', state.roundHistory.map(r => ({
    round: r.round,
    hasPlayerBoard: !!r.playerBoard,
    hasOpponentBoard: !!r.opponentBoard,
    winner: r.winner,
    complete: isRoundComplete(r)
  })));
  console.log('[derivePhase] gameCreatorId:', state.gameCreatorId);
  console.log('[derivePhase] userId:', state.user.id);

  // Check for UI-only phase override first
  if (state.phaseOverride) {
    console.log('[derivePhase] ✅ Returning phaseOverride:', state.phaseOverride);
    return state.phaseOverride;
  }

  // User setup not complete
  if (!state.user.name) {
    console.log('[derivePhase] ✅ Returning user-setup');
    return { type: 'user-setup' };
  }

  // No game mode selected yet
  if (!state.gameMode) {
    console.log('[derivePhase] ✅ Returning game-mode-selection');
    return { type: 'game-mode-selection' };
  }

  // No opponent selected yet
  if (!state.opponent) {
    console.log('[derivePhase] ✅ Returning opponent-selection');
    return { type: 'opponent-selection', gameMode: state.gameMode };
  }

  // Deck mode flow
  if (state.gameMode === 'deck') {
    // Player hasn't selected deck yet
    if (!state.playerSelectedDeck) {
      return { type: 'deck-selection' };
    }

    // Waiting for opponent to select deck
    if (!state.opponentSelectedDeck) {
      return { type: 'deck-selection' };
    }

    // Both decks selected - show all results (filter to only complete rounds)
    const completeRounds = state.roundHistory.filter(r => isRoundComplete(r));
    return { type: 'all-rounds-results', results: completeRounds };
  }

  // Round-by-round mode flow
  // Check each round to find the current state
  console.log('[derivePhase] Checking round-by-round mode...');
  for (let round = 1; round <= GAME_RULES.TOTAL_ROUNDS; round++) {
    const result = state.roundHistory[round - 1];
    const playerBoard = result?.playerBoard ?? null;
    const opponentBoard = result?.opponentBoard ?? null;
    console.log(`[derivePhase] Round ${round}: playerBoard=${!!playerBoard}, opponentBoard=${!!opponentBoard}, complete=${isRoundComplete(result)}`);

    // Round is complete - check if we've already viewed results
    if (isRoundComplete(result)) {
      const nextRound = round + 1;
      const nextResult = state.roundHistory[nextRound - 1];

      // Show results only if next round entry doesn't exist yet
      // (player just completed this round, hasn't clicked continue)
      // Special case: if this is Round 5 and all rounds are complete, go to game-over
      if (!nextResult) {
        if (round === GAME_RULES.TOTAL_ROUNDS) {
          console.log('[derivePhase] ✅ Round 5 complete, all rounds finished, returning game-over');
          return { type: 'game-over', winner: deriveWinner(state) };
        }
        console.log(`[derivePhase] ✅ Returning round-results for round ${round} (next round doesn't exist yet)`);
        return { type: 'round-results', round, result: result! };
      }

      // If next round exists, player has viewed results and moved on
      if (nextRound <= GAME_RULES.TOTAL_ROUNDS) {
        // Continue processing the next round
        console.log(`[derivePhase] Round ${round} complete and player has moved on - continuing`);
        continue;
      } else {
        // This was the last round and player has viewed results (Round 6 marker exists)
        console.log('[derivePhase] ✅ Round 5 complete and viewed, returning game-over');
        return { type: 'game-over', winner: deriveWinner(state) };
      }
    }

    // Round is partial - player selected, opponent hasn't
    if (playerBoard && !opponentBoard) {
      console.log(`[derivePhase] Round ${round} partial: player selected, opponent hasn't. Opponent type: ${state.opponent.type}`);
      if (state.opponent.type === 'human') {
        console.log(`[derivePhase] ✅ Returning share-challenge for round ${round} (player selected, opponent hasn't)`);
        return { type: 'share-challenge', round };
      } else {
        console.log(`[derivePhase] ✅ Returning waiting-for-opponent for round ${round} (CPU opponent)`);
        return { type: 'waiting-for-opponent', round };
      }
    }

    // Round is partial - opponent selected first, player hasn't
    if (!playerBoard && opponentBoard) {
      console.log(`[derivePhase] ✅ Returning board-selection for round ${round} (opponent selected first)`);
      return { type: 'board-selection', round };
    }

    // Both boards selected but round not complete (simulation in progress or failed)
    if (playerBoard && opponentBoard && !isRoundComplete(result)) {
      console.log(`[derivePhase] ✅ Returning board-selection for round ${round} (both boards selected, waiting for simulation)`);
      return { type: 'board-selection', round };
    }

    // Round not started yet
    if (!playerBoard && !opponentBoard) {
      // Show review if there's completed history
      if (round > 1 && state.roundHistory.some(r => isRoundComplete(r))) {
        console.log(`[derivePhase] ✅ Returning round-review for round ${round}`);
        return { type: 'round-review', round };
      }
      // First round or no history - just select board
      console.log(`[derivePhase] ✅ Returning board-selection for round ${round} (first round or no history)`);
      return { type: 'board-selection', round };
    }
  }

  // All rounds complete
  console.log('[derivePhase] ✅ All rounds complete, returning game-over');
  return { type: 'game-over', winner: deriveWinner(state) };
}

/**
 * Get player's selected board for current round
 * Convenience function that combines deriveCurrentRound + getBoardForRound
 *
 * @param state - Complete game state
 * @returns Player's board if selected, null otherwise
 */
export function derivePlayerSelectedBoard(state: GameState): Board | null {
  const currentRound = deriveCurrentRound(state);
  return getBoardForRound(state.roundHistory, currentRound, 'player');
}

/**
 * Get opponent's selected board for current round
 * Convenience function that combines deriveCurrentRound + getBoardForRound
 *
 * @param state - Complete game state
 * @returns Opponent's board if selected, null otherwise
 */
export function deriveOpponentSelectedBoard(state: GameState): Board | null {
  const currentRound = deriveCurrentRound(state);
  return getBoardForRound(state.roundHistory, currentRound, 'opponent');
}
