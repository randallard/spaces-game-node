/**
 * Custom hook for managing game state
 * @module hooks/useGameState
 *
 * IMPORTANT: Always returns complete GameState (never partial updates)
 * Follows kings-cooking pattern of complete state replacement
 *
 * NEW: Phase, currentRound, and scores are now derived from roundHistory
 * instead of being stored separately. This prevents state synchronization bugs.
 */

import { useState, useCallback, useMemo } from 'react';
import type { GameState, GamePhase, Board, Opponent, RoundResult, Deck, GameMode } from '@/types';
import {
  derivePhase,
  deriveCurrentRound,
  derivePlayerScore,
  deriveOpponentScore,
  derivePlayerSelectedBoard,
  deriveOpponentSelectedBoard,
  isRoundComplete,
} from '@/utils/derive-state';
import { GAME_RULES } from '@/constants/game-rules';

export interface UseGameStateReturn {
  state: GameState;

  // Derived values (computed from state, not stored)
  phase: GamePhase;
  currentRound: number;
  playerScore: number;
  opponentScore: number;
  playerSelectedBoard: Board | null;
  opponentSelectedBoard: Board | null;

  // Actions
  setPhase: (phase: GamePhase) => void; // Sets phaseOverride for UI-only phases
  clearPhaseOverride: () => void; // Clears phaseOverride to return to derived phase
  setGameMode: (mode: GameMode) => void;
  setBoardSize: (size: number) => void;
  selectOpponent: (opponent: Opponent, gameMode: GameMode) => void;
  selectPlayerBoard: (board: Board) => void;
  selectOpponentBoard: (board: Board) => void;
  selectPlayerDeck: (deck: Deck) => void;
  selectOpponentDeck: (deck: Deck) => void;
  completeRound: (result: RoundResult) => void;
  completeAllRounds: (results: RoundResult[]) => void;
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

  // Derive values from state (memoized for performance)
  const phase = useMemo(() => derivePhase(state), [state]);
  const currentRound = useMemo(() => deriveCurrentRound(state), [state]);
  const playerScore = useMemo(() => derivePlayerScore(state.roundHistory), [state.roundHistory]);
  const opponentScore = useMemo(() => deriveOpponentScore(state.roundHistory), [state.roundHistory]);
  const playerSelectedBoard = useMemo(() => derivePlayerSelectedBoard(state), [state]);
  const opponentSelectedBoard = useMemo(() => deriveOpponentSelectedBoard(state), [state]);

  /**
   * Set phase override for UI-only phases
   * Use this for phases that can't be derived: board-management, add-opponent, deck-management, tutorial-*, share-final-results
   */
  const setPhase = useCallback((phase: GamePhase): void => {
    setState((prev) => ({
      ...prev,
      phaseOverride: phase,
      checksum: '',
    }));
  }, []);

  /**
   * Clear phase override to return to derived phase
   * Call this when returning to the main game flow
   */
  const clearPhaseOverride = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      phaseOverride: null,
      checksum: '',
    }));
  }, []);

  /**
   * Set game mode and clear phase override to return to derived flow
   */
  const setGameMode = useCallback((mode: GameMode): void => {
    setState((prev) => ({
      ...prev,
      gameMode: mode,
      phaseOverride: null, // Clear override to return to derived phase
      checksum: '',
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
   * Select opponent and set game mode
   * Clears phase override - phase is automatically derived from the resulting state
   */
  const selectOpponent = useCallback((opponent: Opponent, gameMode: GameMode): void => {
    setState((prev) => ({
      ...prev,
      opponent,
      gameMode,
      phaseOverride: null, // Clear override to return to derived phase
      checksum: '',
    }));
  }, []);

  /**
   * Select player's board for current round
   * Adds/updates entry in roundHistory for current round
   */
  const selectPlayerBoard = useCallback((board: Board): void => {
    setState((prev) => {
      const currentRound = deriveCurrentRound(prev);
      const newHistory = [...prev.roundHistory];

      // Get or create round entry
      const existingRound = newHistory[currentRound - 1];

      if (existingRound) {
        // Update existing round entry
        newHistory[currentRound - 1] = {
          ...existingRound,
          playerBoard: board,
        };
      } else {
        // Create new partial round entry
        newHistory[currentRound - 1] = {
          round: currentRound,
          winner: undefined as any,
          playerBoard: board,
          opponentBoard: null as any,
          playerFinalPosition: { row: 0, col: 0 },
          opponentFinalPosition: { row: 0, col: 0 },
          // Don't set playerPoints/opponentPoints - leave them undefined (optional)
        };
      }

      return {
        ...prev,
        roundHistory: newHistory,
        phaseOverride: null, // Clear override to allow natural phase derivation
        checksum: '',
      };
    });
  }, []);

  /**
   * Select opponent's board for current round
   * Adds/updates entry in roundHistory for current round
   */
  const selectOpponentBoard = useCallback((board: Board): void => {
    setState((prev) => {
      const currentRound = deriveCurrentRound(prev);
      const newHistory = [...prev.roundHistory];

      // Get or create round entry
      const existingRound = newHistory[currentRound - 1];

      if (existingRound) {
        // Update existing round entry
        newHistory[currentRound - 1] = {
          ...existingRound,
          opponentBoard: board,
        };
      } else {
        // Create new partial round entry
        newHistory[currentRound - 1] = {
          round: currentRound,
          winner: undefined as any,
          playerBoard: null as any,
          opponentBoard: board,
          playerFinalPosition: { row: 0, col: 0 },
          opponentFinalPosition: { row: 0, col: 0 },
          // Don't set playerPoints/opponentPoints - leave them undefined (optional)
        };
      }

      return {
        ...prev,
        roundHistory: newHistory,
        phaseOverride: null, // Clear override to allow natural phase derivation
        checksum: '',
      };
    });
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
   * Updates or adds round result to history - scores and phase are derived
   */
  const completeRound = useCallback((result: RoundResult): void => {
    setState((prev) => {
      const newHistory = [...prev.roundHistory];
      const existingIndex = newHistory.findIndex(r => r.round === result.round);

      if (existingIndex >= 0) {
        // Update existing round entry (e.g., when responding to challenge with partial round)
        newHistory[existingIndex] = result;
      } else {
        // Add new round entry
        newHistory.push(result);
      }

      // Check if all rounds are now complete (game over)
      // Update stats atomically in the same setState to avoid race conditions
      // (derivePhase jumps directly to game-over after the final round,
      //  so handleContinue never fires for the last round)
      const allComplete = newHistory.length >= GAME_RULES.TOTAL_ROUNDS &&
        newHistory.filter(r => isRoundComplete(r)).length >= GAME_RULES.TOTAL_ROUNDS;

      let user = prev.user;
      if (allComplete) {
        const totalPlayerScore = newHistory.reduce((sum, r) => sum + (r.playerPoints ?? 0), 0);
        const totalOpponentScore = newHistory.reduce((sum, r) => sum + (r.opponentPoints ?? 0), 0);
        const winner = totalPlayerScore > totalOpponentScore ? 'player'
          : totalOpponentScore > totalPlayerScore ? 'opponent' : 'tie';

        user = {
          ...prev.user,
          stats: {
            ...prev.user.stats,
            totalGames: prev.user.stats.totalGames + 1,
            wins: prev.user.stats.wins + (winner === 'player' ? 1 : 0),
            losses: prev.user.stats.losses + (winner === 'opponent' ? 1 : 0),
            ties: prev.user.stats.ties + (winner === 'tie' ? 1 : 0),
          },
        };
      }

      return {
        ...prev,
        roundHistory: newHistory,
        user,
        phaseOverride: null, // Clear override to allow natural phase derivation
        checksum: '',
      };
    });
  }, []);

  /**
   * Complete all rounds at once (deck mode)
   * Updates roundHistory - scores and phase are derived
   */
  const completeAllRounds = useCallback((results: RoundResult[]): void => {
    setState((prev) => {
      // Calculate winner from results
      const totalPlayerScore = results.reduce((sum, r) => sum + (r.playerPoints ?? 0), 0);
      const totalOpponentScore = results.reduce((sum, r) => sum + (r.opponentPoints ?? 0), 0);

      let winner: 'player' | 'opponent' | 'tie';
      if (totalPlayerScore > totalOpponentScore) {
        winner = 'player';
      } else if (totalOpponentScore > totalPlayerScore) {
        winner = 'opponent';
      } else {
        winner = 'tie';
      }

      // Update user stats
      const updatedStats = {
        ...prev.user.stats,
        totalGames: prev.user.stats.totalGames + 1,
        wins: prev.user.stats.wins + (winner === 'player' ? 1 : 0),
        losses: prev.user.stats.losses + (winner === 'opponent' ? 1 : 0),
        ties: prev.user.stats.ties + (winner === 'tie' ? 1 : 0),
      };

      return {
        ...prev,
        roundHistory: results,
        user: {
          ...prev.user,
          stats: updatedStats,
        },
        checksum: '',
      };
    });
  }, []);


  /**
   * End game and update user stats
   * Phase is automatically derived as 'game-over' when all rounds are complete
   */
  const endGame = useCallback((winner: 'player' | 'opponent' | 'tie'): void => {
    setState((prev) => {
      // Update user stats
      const updatedStats = {
        ...prev.user.stats,
        totalGames: prev.user.stats.totalGames + 1,
        wins: prev.user.stats.wins + (winner === 'player' ? 1 : 0),
        losses: prev.user.stats.losses + (winner === 'opponent' ? 1 : 0),
        ties: prev.user.stats.ties + (winner === 'tie' ? 1 : 0),
      };

      return {
        ...prev,
        user: {
          ...prev.user,
          stats: updatedStats,
        },
        checksum: '',
      };
    });
  }, []);

  /**
   * Reset game to initial state
   * Phase is derived from the empty state (will be 'user-setup' if name exists, otherwise 'game-mode-selection')
   */
  const resetGame = useCallback((): void => {
    setState((prev) => ({
      user: prev.user, // Preserve user profile
      opponent: null,
      gameId: null,
      gameCreatorId: null,
      gameMode: null,
      boardSize: null,
      playerSelectedDeck: null,
      opponentSelectedDeck: null,
      roundHistory: [],
      phaseOverride: null, // Clear override to return to derived phase
      lastDiscordNotificationTime: null,
      checksum: '',
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

    // Derived values
    phase,
    currentRound,
    playerScore,
    opponentScore,
    playerSelectedBoard,
    opponentSelectedBoard,

    // Actions
    setPhase,
    clearPhaseOverride,
    setGameMode,
    setBoardSize,
    selectOpponent,
    selectPlayerBoard,
    selectOpponentBoard,
    selectPlayerDeck,
    selectOpponentDeck,
    completeRound,
    completeAllRounds,
    endGame,
    resetGame,
    loadState,
  };
}
