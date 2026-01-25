/**
 * Tests for useGameState hook
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from './useGameState';
import type { GameState, UserProfile, Opponent, Board, RoundResult } from '@/types';

// Test fixtures
const mockUser: UserProfile = {
  id: 'user-1',
  name: 'Alice',
  createdAt: Date.now(),
  stats: {
    totalGames: 0,
    wins: 0,
    losses: 0,
    ties: 0,
  },
};

const mockCpuOpponent: Opponent = {
  type: 'cpu',
  id: 'cpu-opponent',
  name: 'CPU',
  wins: 0,
  losses: 0,
};

const mockHumanOpponent: Opponent = {
  type: 'human',
  id: 'user-2',
  name: 'Bob',
  wins: 0,
  losses: 0,
};

const mockBoard: Board = {
  id: 'board-1',
  name: 'Test Board',
  boardSize: 2,
  grid: [
    ['piece', 'empty'],
    ['empty', 'trap'],
  ],
  sequence: [
    { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
    { position: { row: 1, col: 1 }, type: 'trap', order: 2 },
  ],
  thumbnail: 'data:image/svg+xml,...',
  createdAt: Date.now(),
};

const initialState: GameState = {
  phaseOverride: { type: 'user-setup' },
  user: mockUser,
  opponent: null,
  gameId: null,
        gameCreatorId: null,
  gameMode: null,
  boardSize: null,
  playerSelectedDeck: null,
  opponentSelectedDeck: null,
  roundHistory: [],
      lastDiscordNotificationTime: null,
  checksum: '',
};

describe('useGameState', () => {
  describe('setPhase', () => {
    it('should update phase', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.setPhase({ type: 'opponent-selection', gameMode: 'round-by-round' });
      });

      expect(result.current.phase).toEqual({ type: 'opponent-selection', gameMode: 'round-by-round' });
    });

    it('should preserve other state when updating phase', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.setPhase({ type: 'opponent-selection', gameMode: 'round-by-round' });
      });

      expect(result.current.state.user).toEqual(mockUser);
      expect(result.current.currentRound).toBe(1);
    });
  });

  describe('selectOpponent', () => {
    it('should select CPU opponent and transition to board selection', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.selectOpponent(mockCpuOpponent, 'round-by-round');
      });

      expect(result.current.state.opponent).toEqual(mockCpuOpponent);
      expect(result.current.phase).toEqual({
        type: 'board-selection',
        round: 1,
      });
    });

    it('should select human opponent', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.selectOpponent(mockHumanOpponent, 'round-by-round');
      });

      expect(result.current.state.opponent).toEqual(mockHumanOpponent);
    });
  });

  describe('selectPlayerBoard', () => {
    it('should select player board', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.selectPlayerBoard(mockBoard);
      });

      expect(result.current.playerSelectedBoard).toEqual(mockBoard);
    });

    it('should preserve other state when selecting board', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.selectPlayerBoard(mockBoard);
      });

      expect(result.current.state.user).toEqual(mockUser);
      expect(result.current.currentRound).toBe(1);
    });
  });

  describe('selectOpponentBoard', () => {
    it('should select opponent board', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.selectOpponentBoard(mockBoard);
      });

      expect(result.current.opponentSelectedBoard).toEqual(mockBoard);
    });
  });

  describe('completeRound', () => {
    it('should add result to history and update player score on player win', () => {
      // Set up game state with opponent and game mode
      const stateWithGame: GameState = {
        ...initialState,
        phaseOverride: null, // Allow phase to be derived
        opponent: mockCpuOpponent,
        gameMode: 'round-by-round',
        boardSize: 2,
      };
      const { result } = renderHook(() => useGameState(stateWithGame));

      const roundResult: RoundResult = {
        round: 1,
        winner: 'player',
        playerBoard: mockBoard,
        opponentBoard: mockBoard,
        playerFinalPosition: { row: 0, col: 0 },
        opponentFinalPosition: { row: 1, col: 1 },
        playerPoints: 1,
        opponentPoints: 0,
      };

      act(() => {
        result.current.completeRound(roundResult);
      });

      expect(result.current.state.roundHistory).toHaveLength(1);
      expect(result.current.state.roundHistory[0]).toEqual(roundResult);
      expect(result.current.playerScore).toBe(1);
      expect(result.current.opponentScore).toBe(0);
      expect(result.current.phase).toEqual({
        type: 'round-results',
        round: 1,
        result: roundResult,
      });
    });

    it('should update opponent score on opponent win', () => {
      const { result } = renderHook(() => useGameState(initialState));

      const roundResult: RoundResult = {
        round: 1,
        winner: 'opponent',
        playerBoard: mockBoard,
        opponentBoard: mockBoard,
        playerFinalPosition: { row: 1, col: 1 },
        opponentFinalPosition: { row: 0, col: 0 },
        playerPoints: 0,
        opponentPoints: 1,
      };

      act(() => {
        result.current.completeRound(roundResult);
      });

      expect(result.current.playerScore).toBe(0);
      expect(result.current.opponentScore).toBe(1);
    });

    it('should handle tie result', () => {
      const { result } = renderHook(() => useGameState(initialState));

      const roundResult: RoundResult = {
        round: 1,
        winner: 'tie',
        playerBoard: mockBoard,
        opponentBoard: mockBoard,
        playerFinalPosition: { row: 0, col: 0 },
        opponentFinalPosition: { row: 0, col: 1 },
      };

      act(() => {
        result.current.completeRound(roundResult);
      });

      expect(result.current.playerScore).toBe(0);
      expect(result.current.opponentScore).toBe(0);
    });

    it('should update existing round entry instead of creating duplicate', () => {
      const { result } = renderHook(() => useGameState(initialState));

      // First, add a partial round entry (e.g., from receiving a challenge)
      const partialResult: RoundResult = {
        round: 1,
        winner: undefined as any,
        playerBoard: null as any,
        opponentBoard: mockBoard,
        playerFinalPosition: { row: 0, col: 0 },
        opponentFinalPosition: { row: 0, col: 0 },
      };

      act(() => {
        result.current.loadState({
          ...result.current.state,
          roundHistory: [partialResult],
        });
      });

      expect(result.current.state.roundHistory).toHaveLength(1);
      expect(result.current.state.roundHistory[0]?.playerBoard).toBeNull();

      // Now complete the round (should update, not add new)
      const completeResult: RoundResult = {
        round: 1,
        winner: 'player',
        playerBoard: mockBoard,
        opponentBoard: mockBoard,
        playerFinalPosition: { row: 0, col: 0 },
        opponentFinalPosition: { row: 1, col: 1 },
        playerPoints: 1,
        opponentPoints: 0,
      };

      act(() => {
        result.current.completeRound(completeResult);
      });

      // Should still have only 1 round entry (updated, not duplicated)
      expect(result.current.state.roundHistory).toHaveLength(1);
      expect(result.current.state.roundHistory[0]).toEqual(completeResult);
      expect(result.current.state.roundHistory[0]?.playerBoard).toEqual(mockBoard);
      expect(result.current.playerScore).toBe(1);
    });
  });

//   describe('advanceToNextRound', () => {
//     it('should advance to round 2 with board-selection phase when no round history', () => {
//       const { result } = renderHook(() => useGameState(initialState));
// 
//       act(() => {
//         result.current.advanceToNextRound();
//       });
// 
//       expect(result.current.currentRound).toBe(2);
//       expect(result.current.phase).toEqual({
//         type: 'board-selection',
//         round: 2,
//       });
//       expect(result.current.playerSelectedBoard).toBeNull();
//       expect(result.current.opponentSelectedBoard).toBeNull();
//     });
// 
//     it('should advance to round-review phase when round history exists', () => {
//       const mockRoundResult: RoundResult = {
//         round: 1,
//         winner: 'player',
//         playerBoard: mockBoard,
//         opponentBoard: mockBoard,
//         playerFinalPosition: { row: 0, col: 0 },
//         opponentFinalPosition: { row: 1, col: 1 },
//         playerOutcome: 'won',
//         playerPoints: 1,
//         opponentPoints: 0,
//       };
// 
//       const stateWithHistory: GameState = {
//         ...initialState,
//         roundHistory: [mockRoundResult],
//       };
// 
//       const { result } = renderHook(() => useGameState(stateWithHistory));
// 
//       act(() => {
//         result.current.advanceToNextRound();
//       });
// 
//       expect(result.current.currentRound).toBe(2);
//       expect(result.current.phase).toEqual({
//         type: 'round-review',
//         round: 2,
//       });
//       expect(result.current.playerSelectedBoard).toBeNull();
//       expect(result.current.opponentSelectedBoard).toBeNull();
//     });
// 
//     it('should end game after round 8 with player win', () => {
//       const stateAfter8Rounds: GameState = {
//         ...initialState,
//       };
// 
//       const { result } = renderHook(() => useGameState(stateAfter8Rounds));
// 
//       act(() => {
//         result.current.advanceToNextRound();
//       });
// 
//       expect(result.current.currentRound).toBe(9);
//       expect(result.current.phase).toEqual({
//         type: 'game-over',
//         winner: 'player',
//       });
//     });
// 
//     it('should end game after round 8 with opponent win', () => {
//       const stateAfter8Rounds: GameState = {
//         ...initialState,
//       };
// 
//       const { result } = renderHook(() => useGameState(stateAfter8Rounds));
// 
//       act(() => {
//         result.current.advanceToNextRound();
//       });
// 
//       expect(result.current.phase).toEqual({
//         type: 'game-over',
//         winner: 'opponent',
//       });
//     });
// 
//     it('should end game after round 8 with tie', () => {
//       const stateAfter8Rounds: GameState = {
//         ...initialState,
//       };
// 
//       const { result } = renderHook(() => useGameState(stateAfter8Rounds));
// 
//       act(() => {
//         result.current.advanceToNextRound();
//       });
// 
//       expect(result.current.phase).toEqual({
//         type: 'game-over',
//         winner: 'tie',
//       });
//     });
//   });

  describe('endGame', () => {
    it('should update stats when player wins', () => {
      // Set up game state with 5 complete rounds (game is over)
      const completedRounds: RoundResult[] = Array.from({ length: 5 }, (_, i) => ({
        round: i + 1,
        winner: 'player' as const,
        playerBoard: mockBoard,
        opponentBoard: mockBoard,
        playerFinalPosition: { row: 0, col: 0 },
        opponentFinalPosition: { row: 1, col: 1 },
        playerPoints: 2,
        opponentPoints: 1,
      }));

      const stateWithGame: GameState = {
        ...initialState,
        phaseOverride: null, // Allow phase to be derived
        opponent: mockCpuOpponent,
        gameMode: 'round-by-round',
        boardSize: 2,
        roundHistory: completedRounds,
      };
      const { result } = renderHook(() => useGameState(stateWithGame));

      // Verify game-over phase is derived
      expect(result.current.phase.type).toBe('game-over');
      expect(result.current.phase).toEqual({
        type: 'game-over',
        winner: 'player',
      });

      act(() => {
        result.current.endGame('player');
      });

      // Verify stats were updated
      expect(result.current.state.user.stats.totalGames).toBe(1);
      expect(result.current.state.user.stats.wins).toBe(1);
      expect(result.current.state.user.stats.losses).toBe(0);
    });

    it('should update stats when opponent wins', () => {
      // Set up game state with 5 complete rounds (game is over)
      const completedRounds: RoundResult[] = Array.from({ length: 5 }, (_, i) => ({
        round: i + 1,
        winner: 'opponent' as const,
        playerBoard: mockBoard,
        opponentBoard: mockBoard,
        playerFinalPosition: { row: 1, col: 1 },
        opponentFinalPosition: { row: 0, col: 0 },
        playerPoints: 1,
        opponentPoints: 2,
      }));

      const stateWithGame: GameState = {
        ...initialState,
        phaseOverride: null,
        opponent: mockCpuOpponent,
        gameMode: 'round-by-round',
        boardSize: 2,
        roundHistory: completedRounds,
      };
      const { result } = renderHook(() => useGameState(stateWithGame));

      expect(result.current.phase).toEqual({
        type: 'game-over',
        winner: 'opponent',
      });

      act(() => {
        result.current.endGame('opponent');
      });

      expect(result.current.state.user.stats.totalGames).toBe(1);
      expect(result.current.state.user.stats.wins).toBe(0);
      expect(result.current.state.user.stats.losses).toBe(1);
    });

    it('should update stats when game ends in tie', () => {
      // Set up game state with 5 complete rounds (2-2-1 tie)
      const completedRounds: RoundResult[] = [
        ...Array.from({ length: 2 }, (_, i) => ({
          round: i + 1,
          winner: 'player' as const,
          playerBoard: mockBoard,
          opponentBoard: mockBoard,
          playerFinalPosition: { row: 0, col: 0 },
          opponentFinalPosition: { row: 1, col: 1 },
          playerPoints: 2,
          opponentPoints: 1,
        })),
        ...Array.from({ length: 2 }, (_, i) => ({
          round: i + 3,
          winner: 'opponent' as const,
          playerBoard: mockBoard,
          opponentBoard: mockBoard,
          playerFinalPosition: { row: 1, col: 1 },
          opponentFinalPosition: { row: 0, col: 0 },
          playerPoints: 1,
          opponentPoints: 2,
        })),
        {
          round: 5,
          winner: 'tie' as const,
          playerBoard: mockBoard,
          opponentBoard: mockBoard,
          playerFinalPosition: { row: 0, col: 0 },
          opponentFinalPosition: { row: 0, col: 0 },
          playerPoints: 1,
          opponentPoints: 1,
        },
      ];

      const stateWithGame: GameState = {
        ...initialState,
        phaseOverride: null,
        opponent: mockCpuOpponent,
        gameMode: 'round-by-round',
        boardSize: 2,
        roundHistory: completedRounds,
      };
      const { result } = renderHook(() => useGameState(stateWithGame));

      expect(result.current.phase).toEqual({
        type: 'game-over',
        winner: 'tie',
      });

      act(() => {
        result.current.endGame('tie');
      });

      expect(result.current.state.user.stats.totalGames).toBe(1);
      expect(result.current.state.user.stats.wins).toBe(0);
      expect(result.current.state.user.stats.ties).toBe(1);
    });
  });

  describe('resetGame', () => {
    it('should reset game to initial state', () => {
      const modifiedState: GameState = {
        ...initialState,
        phaseOverride: null, // Start with null so phase is derived
        opponent: mockCpuOpponent,
        gameMode: 'round-by-round',
        boardSize: 2,
        roundHistory: [
          {
            round: 1,
            winner: 'player',
            playerBoard: mockBoard,
            opponentBoard: mockBoard,
            playerFinalPosition: { row: 0, col: 0 },
            opponentFinalPosition: { row: 1, col: 1 },
          },
        ],
      };

      const { result } = renderHook(() => useGameState(modifiedState));

      act(() => {
        result.current.resetGame();
      });

      // After reset, with no opponent/gameMode, phase derives to game-mode-selection
      expect(result.current.phase.type).toBe('game-mode-selection');
      expect(result.current.state.opponent).toBeNull();
      expect(result.current.currentRound).toBe(1);
      expect(result.current.playerScore).toBe(0);
      expect(result.current.opponentScore).toBe(0);
      expect(result.current.state.roundHistory).toEqual([]);
    });

    it('should preserve user profile on reset', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.resetGame();
      });

      expect(result.current.state.user).toEqual(mockUser);
    });
  });

  describe('loadState', () => {
    it('should load new state', () => {
      const { result } = renderHook(() => useGameState(initialState));

      const newState: GameState = {
        ...initialState,
        opponent: mockCpuOpponent,
      };

      act(() => {
        result.current.loadState(newState);
      });

      expect(result.current.state).toEqual(newState);
    });

    it('should completely replace state', () => {
      const { result } = renderHook(() => useGameState(initialState));

      const newState: GameState = {
        phaseOverride: { type: 'game-over', winner: 'player' },
        user: mockUser,
        opponent: mockHumanOpponent,
        gameId: null,
        gameCreatorId: null,
        gameMode: null,
        boardSize: null,
        playerSelectedDeck: null,
        opponentSelectedDeck: null,
        roundHistory: [],
      lastDiscordNotificationTime: null,
        checksum: 'abc123',
      };

      act(() => {
        result.current.loadState(newState);
      });

      expect(result.current.state).toEqual(newState);
      expect(result.current.state.checksum).toBe('abc123');
    });
  });

  describe('setGameMode', () => {
    it('should set game mode to round-by-round', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.setGameMode('round-by-round');
      });

      expect(result.current.state.gameMode).toBe('round-by-round');
    });

    it('should set game mode to deck', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.setGameMode('deck');
      });

      expect(result.current.state.gameMode).toBe('deck');
    });

    it('should preserve other state when setting game mode', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.setGameMode('deck');
      });

      expect(result.current.state.user).toEqual(mockUser);
      expect(result.current.currentRound).toBe(1);
    });
  });

  describe('setBoardSize', () => {
    it('should set board size to 2', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.setBoardSize(2);
      });

      expect(result.current.state.boardSize).toBe(2);
    });

    it('should set board size to 3', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.setBoardSize(3);
      });

      expect(result.current.state.boardSize).toBe(3);
    });

    it('should set board size to 4', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.setBoardSize(4);
      });

      expect(result.current.state.boardSize).toBe(4);
    });
  });

  describe('selectOpponent - deck mode', () => {
    it('should select opponent and transition to deck selection in deck mode', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.selectOpponent(mockCpuOpponent, 'deck');
      });

      expect(result.current.state.opponent).toEqual(mockCpuOpponent);
      expect(result.current.state.gameMode).toBe('deck');
      expect(result.current.phase).toEqual({
        type: 'deck-selection',
      });
      expect(result.current.currentRound).toBe(1);
    });
  });

  describe('selectPlayerDeck', () => {
    it('should select player deck', () => {
      const mockDeck = {
        id: 'deck-1',
        name: 'Test Deck',
        boards: [mockBoard, mockBoard, mockBoard],
        createdAt: Date.now(),
      };

      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.selectPlayerDeck(mockDeck);
      });

      expect(result.current.state.playerSelectedDeck).toEqual(mockDeck);
    });

    it('should preserve other state when selecting player deck', () => {
      const mockDeck = {
        id: 'deck-1',
        name: 'Test Deck',
        boards: [mockBoard],
        createdAt: Date.now(),
      };

      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.selectPlayerDeck(mockDeck);
      });

      expect(result.current.state.user).toEqual(mockUser);
      expect(result.current.currentRound).toBe(1);
    });
  });

  describe('selectOpponentDeck', () => {
    it('should select opponent deck', () => {
      const mockDeck = {
        id: 'deck-2',
        name: 'Opponent Deck',
        boards: [mockBoard, mockBoard],
        createdAt: Date.now(),
      };

      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.selectOpponentDeck(mockDeck);
      });

      expect(result.current.state.opponentSelectedDeck).toEqual(mockDeck);
    });
  });

  describe('completeAllRounds', () => {
    it('should complete all rounds with player win', () => {
      const results: RoundResult[] = [
        {
          round: 1,
          winner: 'player',
          playerBoard: mockBoard,
          opponentBoard: mockBoard,
          playerFinalPosition: { row: 0, col: 0 },
          opponentFinalPosition: { row: 1, col: 1 },
          playerPoints: 2,
          opponentPoints: 1,
        },
        {
          round: 2,
          winner: 'player',
          playerBoard: mockBoard,
          opponentBoard: mockBoard,
          playerFinalPosition: { row: 0, col: 0 },
          opponentFinalPosition: { row: 1, col: 1 },
          playerPoints: 3,
          opponentPoints: 0,
        },
      ];

      // Set up game state with opponent and deck mode (for all-rounds-results)
      // Need decks selected for all-rounds-results phase to be derived
      const mockDeck = {
        id: 'deck-1',
        name: 'Test Deck',
        boards: [mockBoard],
        createdAt: Date.now(),
      };

      const stateWithDeckMode: GameState = {
        ...initialState,
        phaseOverride: null, // Allow phase to be derived
        opponent: mockCpuOpponent,
        gameMode: 'deck',
        boardSize: 2,
        playerSelectedDeck: mockDeck,
        opponentSelectedDeck: mockDeck,
      };

      const { result } = renderHook(() => useGameState(stateWithDeckMode));

      act(() => {
        result.current.completeAllRounds(results);
      });

      expect(result.current.state.roundHistory).toEqual(results);
      expect(result.current.playerScore).toBe(5);
      expect(result.current.opponentScore).toBe(1);
      expect(result.current.phase).toEqual({
        type: 'all-rounds-results',
        results,
      });
      expect(result.current.state.user.stats.totalGames).toBe(1);
      expect(result.current.state.user.stats.wins).toBe(1);
      expect(result.current.state.user.stats.losses).toBe(0);
      expect(result.current.state.user.stats.ties).toBe(0);
    });

    it('should complete all rounds with opponent win', () => {
      const results: RoundResult[] = [
        {
          round: 1,
          winner: 'opponent',
          playerBoard: mockBoard,
          opponentBoard: mockBoard,
          playerFinalPosition: { row: 1, col: 1 },
          opponentFinalPosition: { row: 0, col: 0 },
          playerPoints: 0,
          opponentPoints: 2,
        },
        {
          round: 2,
          winner: 'opponent',
          playerBoard: mockBoard,
          opponentBoard: mockBoard,
          playerFinalPosition: { row: 1, col: 1 },
          opponentFinalPosition: { row: 0, col: 0 },
          playerPoints: 1,
          opponentPoints: 3,
        },
      ];

      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.completeAllRounds(results);
      });

      expect(result.current.playerScore).toBe(1);
      expect(result.current.opponentScore).toBe(5);
      expect(result.current.state.user.stats.totalGames).toBe(1);
      expect(result.current.state.user.stats.wins).toBe(0);
      expect(result.current.state.user.stats.losses).toBe(1);
      expect(result.current.state.user.stats.ties).toBe(0);
    });

    it('should complete all rounds with tie', () => {
      const results: RoundResult[] = [
        {
          round: 1,
          winner: 'player',
          playerBoard: mockBoard,
          opponentBoard: mockBoard,
          playerFinalPosition: { row: 0, col: 0 },
          opponentFinalPosition: { row: 1, col: 1 },
          playerPoints: 2,
          opponentPoints: 1,
        },
        {
          round: 2,
          winner: 'opponent',
          playerBoard: mockBoard,
          opponentBoard: mockBoard,
          playerFinalPosition: { row: 1, col: 1 },
          opponentFinalPosition: { row: 0, col: 0 },
          playerPoints: 1,
          opponentPoints: 2,
        },
      ];

      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.completeAllRounds(results);
      });

      expect(result.current.playerScore).toBe(3);
      expect(result.current.opponentScore).toBe(3);
      expect(result.current.state.user.stats.totalGames).toBe(1);
      expect(result.current.state.user.stats.wins).toBe(0);
      expect(result.current.state.user.stats.losses).toBe(0);
      expect(result.current.state.user.stats.ties).toBe(1);
    });

    it('should handle results with undefined points', () => {
      const results: RoundResult[] = [
        {
          round: 1,
          winner: 'tie',
          playerBoard: mockBoard,
          opponentBoard: mockBoard,
          playerFinalPosition: { row: 0, col: 0 },
          opponentFinalPosition: { row: 0, col: 1 },
          // No points defined
        },
      ];

      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.completeAllRounds(results);
      });

      expect(result.current.playerScore).toBe(0);
      expect(result.current.opponentScore).toBe(0);
    });
  });

  describe('User stats updates', () => {
    it('should update stats when player wins via endGame', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.endGame('player');
      });

      expect(result.current.state.user.stats.totalGames).toBe(1);
      expect(result.current.state.user.stats.wins).toBe(1);
      expect(result.current.state.user.stats.losses).toBe(0);
      expect(result.current.state.user.stats.ties).toBe(0);
    });

    it('should update stats when opponent wins via endGame', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.endGame('opponent');
      });

      expect(result.current.state.user.stats.totalGames).toBe(1);
      expect(result.current.state.user.stats.wins).toBe(0);
      expect(result.current.state.user.stats.losses).toBe(1);
      expect(result.current.state.user.stats.ties).toBe(0);
    });

    it('should update stats when game ends in tie via endGame', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.endGame('tie');
      });

      expect(result.current.state.user.stats.totalGames).toBe(1);
      expect(result.current.state.user.stats.wins).toBe(0);
      expect(result.current.state.user.stats.losses).toBe(0);
      expect(result.current.state.user.stats.ties).toBe(1);
    });

//     it('should update stats when player wins via advanceToNextRound', () => {
//       const stateAfter8Rounds: GameState = {
//         ...initialState,
//       };
// 
//       const { result } = renderHook(() => useGameState(stateAfter8Rounds));
// 
//       act(() => {
//         result.current.advanceToNextRound();
//       });
// 
//       expect(result.current.state.user.stats.totalGames).toBe(1);
//       expect(result.current.state.user.stats.wins).toBe(1);
//       expect(result.current.state.user.stats.losses).toBe(0);
//       expect(result.current.state.user.stats.ties).toBe(0);
//     });
// 
//     it('should update stats when opponent wins via advanceToNextRound', () => {
//       const stateAfter8Rounds: GameState = {
//         ...initialState,
//       };
// 
//       const { result } = renderHook(() => useGameState(stateAfter8Rounds));
// 
//       act(() => {
//         result.current.advanceToNextRound();
//       });
// 
//       expect(result.current.state.user.stats.totalGames).toBe(1);
//       expect(result.current.state.user.stats.wins).toBe(0);
//       expect(result.current.state.user.stats.losses).toBe(1);
//       expect(result.current.state.user.stats.ties).toBe(0);
//     });
// 
//     it('should update stats when game ends in tie via advanceToNextRound', () => {
//       const stateAfter8Rounds: GameState = {
//         ...initialState,
//       };
// 
//       const { result } = renderHook(() => useGameState(stateAfter8Rounds));
// 
//       act(() => {
//         result.current.advanceToNextRound();
//       });
// 
//       expect(result.current.state.user.stats.totalGames).toBe(1);
//       expect(result.current.state.user.stats.wins).toBe(0);
//       expect(result.current.state.user.stats.losses).toBe(0);
//       expect(result.current.state.user.stats.ties).toBe(1);
//     });

    it('should accumulate stats across multiple games', () => {
      const stateWithExistingStats: GameState = {
        ...initialState,
        user: {
          ...mockUser,
          stats: {
            totalGames: 5,
            wins: 3,
            losses: 1,
            ties: 1,
          },
        },
      };

      const { result } = renderHook(() => useGameState(stateWithExistingStats));

      act(() => {
        result.current.endGame('player');
      });

      expect(result.current.state.user.stats.totalGames).toBe(6);
      expect(result.current.state.user.stats.wins).toBe(4);
      expect(result.current.state.user.stats.losses).toBe(1);
      expect(result.current.state.user.stats.ties).toBe(1);
    });
  });
});
