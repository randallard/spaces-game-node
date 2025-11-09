/**
 * Custom hook for managing game state
 * @module hooks/useGameState
 *
 * IMPORTANT: Always returns complete GameState (never partial updates)
 * Follows kings-cooking pattern of complete state replacement
 */

import { useState, useCallback } from 'react';
import type { GameState, GamePhase, Board, Opponent, RoundResult, Deck, GameMode } from '@/types';
import { GAME_RULES } from '@/constants/game-rules';

export interface UseGameStateReturn {
  state: GameState;
  setPhase: (phase: GamePhase) => void;
  setGameMode: (mode: GameMode) => void;
  setBoardSize: (size: number) => void;
  selectOpponent: (opponent: Opponent, gameMode: GameMode) => void;
  selectPlayerBoard: (board: Board) => void;
  selectOpponentBoard: (board: Board) => void;
  selectPlayerDeck: (deck: Deck) => void;
  selectOpponentDeck: (deck: Deck) => void;
  completeRound: (result: RoundResult) => void;
  completeAllRounds: (results: RoundResult[]) => void;
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
   * Set game mode
   */
  const setGameMode = useCallback((mode: GameMode): void => {
    setState((prev) => ({
      ...prev,
      gameMode: mode,
      checksum: '', // Checksum managed externally
    }));
  }, []);

  /**
   * Set board size for the current game
   */
  const setBoardSize = useCallback((size: number): void => {
    setState((prev) => ({
      ...prev,
      boardSize: size,
      checksum: '', // Checksum managed externally
    }));
  }, []);

  /**
   * Select opponent and transition based on game mode
   */
  const selectOpponent = useCallback((opponent: Opponent, gameMode: GameMode): void => {
    const nextPhase: GamePhase =
      gameMode === 'deck'
        ? { type: 'deck-selection' }
        : { type: 'board-selection', round: 1 };

    setState((prev) => ({
      ...prev,
      opponent,
      gameMode,
      phase: nextPhase,
      currentRound: 1,
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
   * Select player's deck (deck mode)
   */
  const selectPlayerDeck = useCallback((deck: Deck): void => {
    setState((prev) => ({
      ...prev,
      playerSelectedDeck: deck,
      checksum: '', // Checksum managed externally
    }));
  }, []);

  /**
   * Select opponent's deck (deck mode)
   */
  const selectOpponentDeck = useCallback((deck: Deck): void => {
    setState((prev) => ({
      ...prev,
      opponentSelectedDeck: deck,
      checksum: '', // Checksum managed externally
    }));
  }, []);

  /**
   * Complete current round with result (round-by-round mode)
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
   * Complete all rounds at once (deck mode)
   */
  const completeAllRounds = useCallback((results: RoundResult[]): void => {
    const totalPlayerScore = results.reduce((sum, r) => sum + (r.playerPoints ?? 0), 0);
    const totalOpponentScore = results.reduce((sum, r) => sum + (r.opponentPoints ?? 0), 0);

    setState((prev) => ({
      ...prev,
      roundHistory: results,
      playerScore: totalPlayerScore,
      opponentScore: totalOpponentScore,
      phase: { type: 'all-rounds-results', results },
      checksum: '', // Checksum managed externally
    }));
  }, []);

  /**
   * Advance to next round or end game (round-by-round mode)
   */
  const advanceToNextRound = useCallback((): void => {
    setState((prev) => {
      const nextRound = prev.currentRound + 1;

      // Check if game is over
      if (nextRound > GAME_RULES.TOTAL_ROUNDS) {
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
    setGameMode,
    setBoardSize,
    selectOpponent,
    selectPlayerBoard,
    selectOpponentBoard,
    selectPlayerDeck,
    selectOpponentDeck,
    completeRound,
    completeAllRounds,
    advanceToNextRound,
    endGame,
    resetGame,
    loadState,
  };
}
