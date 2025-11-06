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
  phase: { type: 'user-setup' },
  user: mockUser,
  opponent: null,
  gameMode: null,
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

describe('useGameState', () => {
  describe('setPhase', () => {
    it('should update phase', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.setPhase({ type: 'opponent-selection', gameMode: 'round-by-round' });
      });

      expect(result.current.state.phase).toEqual({ type: 'opponent-selection', gameMode: 'round-by-round' });
    });

    it('should preserve other state when updating phase', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.setPhase({ type: 'opponent-selection', gameMode: 'round-by-round' });
      });

      expect(result.current.state.user).toEqual(mockUser);
      expect(result.current.state.currentRound).toBe(1);
    });
  });

  describe('selectOpponent', () => {
    it('should select CPU opponent and transition to board selection', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.selectOpponent(mockCpuOpponent, 'round-by-round');
      });

      expect(result.current.state.opponent).toEqual(mockCpuOpponent);
      expect(result.current.state.phase).toEqual({
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

      expect(result.current.state.playerSelectedBoard).toEqual(mockBoard);
    });

    it('should preserve other state when selecting board', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.selectPlayerBoard(mockBoard);
      });

      expect(result.current.state.user).toEqual(mockUser);
      expect(result.current.state.currentRound).toBe(1);
    });
  });

  describe('selectOpponentBoard', () => {
    it('should select opponent board', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.selectOpponentBoard(mockBoard);
      });

      expect(result.current.state.opponentSelectedBoard).toEqual(mockBoard);
    });
  });

  describe('completeRound', () => {
    it('should add result to history and update player score on player win', () => {
      const { result } = renderHook(() => useGameState(initialState));

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
      expect(result.current.state.playerScore).toBe(1);
      expect(result.current.state.opponentScore).toBe(0);
      expect(result.current.state.phase).toEqual({
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

      expect(result.current.state.playerScore).toBe(0);
      expect(result.current.state.opponentScore).toBe(1);
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

      expect(result.current.state.playerScore).toBe(0);
      expect(result.current.state.opponentScore).toBe(0);
    });
  });

  describe('advanceToNextRound', () => {
    it('should advance to round 2', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.advanceToNextRound();
      });

      expect(result.current.state.currentRound).toBe(2);
      expect(result.current.state.phase).toEqual({
        type: 'board-selection',
        round: 2,
      });
      expect(result.current.state.playerSelectedBoard).toBeNull();
      expect(result.current.state.opponentSelectedBoard).toBeNull();
    });

    it('should end game after round 8 with player win', () => {
      const stateAfter8Rounds: GameState = {
        ...initialState,
        currentRound: 8,
        playerScore: 5,
        opponentScore: 3,
      };

      const { result } = renderHook(() => useGameState(stateAfter8Rounds));

      act(() => {
        result.current.advanceToNextRound();
      });

      expect(result.current.state.currentRound).toBe(9);
      expect(result.current.state.phase).toEqual({
        type: 'game-over',
        winner: 'player',
      });
    });

    it('should end game after round 8 with opponent win', () => {
      const stateAfter8Rounds: GameState = {
        ...initialState,
        currentRound: 8,
        playerScore: 3,
        opponentScore: 5,
      };

      const { result } = renderHook(() => useGameState(stateAfter8Rounds));

      act(() => {
        result.current.advanceToNextRound();
      });

      expect(result.current.state.phase).toEqual({
        type: 'game-over',
        winner: 'opponent',
      });
    });

    it('should end game after round 8 with tie', () => {
      const stateAfter8Rounds: GameState = {
        ...initialState,
        currentRound: 8,
        playerScore: 4,
        opponentScore: 4,
      };

      const { result } = renderHook(() => useGameState(stateAfter8Rounds));

      act(() => {
        result.current.advanceToNextRound();
      });

      expect(result.current.state.phase).toEqual({
        type: 'game-over',
        winner: 'tie',
      });
    });
  });

  describe('endGame', () => {
    it('should end game with player win', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.endGame('player');
      });

      expect(result.current.state.phase).toEqual({
        type: 'game-over',
        winner: 'player',
      });
    });

    it('should end game with opponent win', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.endGame('opponent');
      });

      expect(result.current.state.phase).toEqual({
        type: 'game-over',
        winner: 'opponent',
      });
    });

    it('should end game with tie', () => {
      const { result } = renderHook(() => useGameState(initialState));

      act(() => {
        result.current.endGame('tie');
      });

      expect(result.current.state.phase).toEqual({
        type: 'game-over',
        winner: 'tie',
      });
    });
  });

  describe('resetGame', () => {
    it('should reset game to initial state', () => {
      const modifiedState: GameState = {
        ...initialState,
        opponent: mockCpuOpponent,
        currentRound: 5,
        playerScore: 3,
        opponentScore: 2,
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

      expect(result.current.state.phase).toEqual({ type: 'user-setup' });
      expect(result.current.state.opponent).toBeNull();
      expect(result.current.state.currentRound).toBe(1);
      expect(result.current.state.playerScore).toBe(0);
      expect(result.current.state.opponentScore).toBe(0);
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
        currentRound: 3,
        playerScore: 2,
        opponentScore: 1,
      };

      act(() => {
        result.current.loadState(newState);
      });

      expect(result.current.state).toEqual(newState);
    });

    it('should completely replace state', () => {
      const { result } = renderHook(() => useGameState(initialState));

      const newState: GameState = {
        phase: { type: 'game-over', winner: 'player' },
        user: mockUser,
        opponent: mockHumanOpponent,
        gameMode: null,
        currentRound: 8,
        playerScore: 5,
        opponentScore: 3,
        playerSelectedBoard: mockBoard,
        opponentSelectedBoard: mockBoard,
        playerSelectedDeck: null,
        opponentSelectedDeck: null,
        roundHistory: [],
        checksum: 'abc123',
      };

      act(() => {
        result.current.loadState(newState);
      });

      expect(result.current.state).toEqual(newState);
      expect(result.current.state.checksum).toBe('abc123');
    });
  });
});
