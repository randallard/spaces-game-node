/**
 * Custom hook for managing game state
 * @module hooks/useGameState
 *
 * IMPORTANT: Always returns complete GameState (never partial updates)
 * Follows kings-cooking pattern of complete state replacement
 */

import { useState, useCallback } from 'react';
import type { GameState, GamePhase, Board, Opponent, RoundResult } from '@/types';

export interface UseGameStateReturn {
  state: GameState;
  setPhase: (phase: GamePhase) => void;
  selectOpponent: (opponent: Opponent) => void;
  selectPlayerBoard: (board: Board) => void;
  selectOpponentBoard: (board: Board) => void;
  completeRound: (result: RoundResult) => void;
  advanceToNextRound: () => void;
  endGame: (winner: 'player' | 'opponent' | 'tie') => void;
  resetGame: () => void;
  loadState: (newState: GameState) => void;
}

/**
 * Hook for managing complete game state.
 *
 * Key principles:
 * - Always return complete GameState object (never partial)
 * - Immutable updates using object spread
 * - Automatic checksum generation on state changes
 * - Type-safe phase transitions
 *
 * @param initialState - Initial game state
 * @returns Game state and actions
 *
 * @example
 * ```tsx
 * const { state, setPhase, selectOpponent } = useGameState(initialState);
 *
 * // Transition to opponent selection
 * setPhase({ type: 'opponent-selection' });
 *
 * // Select opponent
 * selectOpponent(cpuOpponent);
 * ```
 */
export function useGameState(initialState: GameState): UseGameStateReturn {
  const [state, setState] = useState<GameState>(initialState);

  /**
   * Update game phase
   */
  const setPhase = useCallback((phase: GamePhase): void => {
    setState((prev) => ({
      ...prev,
      phase,
      checksum: '', // Checksum managed externally
    }));
  }, []);

  /**
   * Select opponent and transition to board selection
   */
  const selectOpponent = useCallback((opponent: Opponent): void => {
    setState((prev) => ({
      ...prev,
      opponent,
      phase: { type: 'board-selection', round: 1 },
      checksum: '', // Checksum managed externally
    }));
  }, []);

  /**
   * Select player's board for current round
   */
  const selectPlayerBoard = useCallback((board: Board): void => {
    setState((prev) => ({
      ...prev,
      playerSelectedBoard: board,
      checksum: '', // Checksum managed externally
    }));
  }, []);

  /**
   * Select opponent's board for current round
   */
  const selectOpponentBoard = useCallback((board: Board): void => {
    setState((prev) => ({
      ...prev,
      opponentSelectedBoard: board,
      checksum: '', // Checksum managed externally
    }));
  }, []);

  /**
   * Complete current round with result
   */
  const completeRound = useCallback((result: RoundResult): void => {
    setState((prev) => ({
      ...prev,
      roundHistory: [...prev.roundHistory, result],
      playerScore: prev.playerScore + (result.playerPoints ?? 0),
      opponentScore: prev.opponentScore + (result.opponentPoints ?? 0),
      phase: { type: 'round-results', round: prev.currentRound, result },
      checksum: '', // Checksum managed externally
    }));
  }, []);

  /**
   * Advance to next round or end game
   */
  const advanceToNextRound = useCallback((): void => {
    setState((prev) => {
      const nextRound = prev.currentRound + 1;

      // Check if game is over (8 rounds total)
      if (nextRound > 8) {
        // Determine winner
        let winner: 'player' | 'opponent' | 'tie';
        if (prev.playerScore > prev.opponentScore) {
          winner = 'player';
        } else if (prev.opponentScore > prev.playerScore) {
          winner = 'opponent';
        } else {
          winner = 'tie';
        }

        return {
          ...prev,
          currentRound: nextRound,
          phase: { type: 'game-over', winner },
          playerSelectedBoard: null,
          opponentSelectedBoard: null,
          checksum: '', // Checksum managed externally
        };
      }

      // Continue to next round
      return {
        ...prev,
        currentRound: nextRound,
        phase: { type: 'board-selection', round: nextRound },
        playerSelectedBoard: null,
        opponentSelectedBoard: null,
        checksum: '', // Checksum managed externally
      };
    });
  }, []);

  /**
   * End game with winner
   */
  const endGame = useCallback((winner: 'player' | 'opponent' | 'tie'): void => {
    setState((prev) => ({
      ...prev,
      phase: { type: 'game-over', winner },
      checksum: '', // Checksum managed externally
    }));
  }, []);

  /**
   * Reset game to initial state
   */
  const resetGame = useCallback((): void => {
    setState((prev) => ({
      phase: { type: 'user-setup' },
      user: prev.user, // Preserve user profile
      opponent: null,
      currentRound: 1,
      playerScore: 0,
      opponentScore: 0,
      playerSelectedBoard: null,
      opponentSelectedBoard: null,
      roundHistory: [],
      checksum: '', // Checksum managed externally
    }));
  }, []);

  /**
   * Load complete game state (from URL or localStorage)
   */
  const loadState = useCallback((newState: GameState): void => {
    setState(newState);
  }, []);

  return {
    state,
    setPhase,
    selectOpponent,
    selectPlayerBoard,
    selectOpponentBoard,
    completeRound,
    advanceToNextRound,
    endGame,
    resetGame,
    loadState,
  };
}
