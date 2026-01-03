/**
 * Tests for active games utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getActiveGames,
  saveActiveGame,
  removeActiveGame,
  clearActiveGames,
  getPhaseDescription,
  type ActiveGameInfo,
} from './active-games';
import type { GameState } from '@/types/game-state';
import type { Opponent } from '@/types/opponent';

describe('active-games utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  const createMockOpponent = (): Opponent => ({
    id: 'test-opponent-1',
    name: 'Test Opponent',
    type: 'human',
    wins: 0,
    losses: 0,
  });

  const createMockGameState = (gameId: string, phase: GameState['phase'] = { type: 'board-selection', round: 1 }): GameState => ({
    phase,
    user: {
      id: 'test-user',
      name: 'Test User',
      playerCreature: 'bug',
      createdAt: Date.now(),
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      },
    },
    opponent: createMockOpponent(),
    gameId,
    gameMode: 'round-by-round',
    boardSize: 2,
    currentRound: 1,
    playerScore: 0,
    opponentScore: 0,
    playerSelectedBoard: null,
    opponentSelectedBoard: null,
    playerSelectedDeck: null,
    opponentSelectedDeck: null,
    roundHistory: [],
    checksum: '',
  });

  describe('getActiveGames', () => {
    it('should return empty array when no games are stored', () => {
      const games = getActiveGames();
      expect(games).toEqual([]);
    });

    it('should return stored games', () => {
      const state = createMockGameState('game-1');
      saveActiveGame(state);

      const games = getActiveGames();
      expect(games).toHaveLength(1);
      expect(games[0]?.gameId).toBe('game-1');
      expect(games[0]?.opponent.name).toBe('Test Opponent');
    });

    it('should filter out games older than 7 days', () => {
      const oldTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
      const recentTimestamp = Date.now();

      const oldGame: ActiveGameInfo = {
        gameId: 'old-game',
        opponent: createMockOpponent(),
        currentRound: 1,
        totalRounds: 5,
        playerScore: 0,
        opponentScore: 0,
        phase: { type: 'board-selection', round: 1 },
        boardSize: 2,
        gameMode: 'round-by-round',
        lastUpdated: oldTimestamp,
        fullState: createMockGameState('old-game'),
      };

      const recentGame: ActiveGameInfo = {
        gameId: 'recent-game',
        opponent: createMockOpponent(),
        currentRound: 1,
        totalRounds: 5,
        playerScore: 0,
        opponentScore: 0,
        phase: { type: 'board-selection', round: 1 },
        boardSize: 2,
        gameMode: 'round-by-round',
        lastUpdated: recentTimestamp,
        fullState: createMockGameState('recent-game'),
      };

      localStorage.setItem('spaces-game-active-games', JSON.stringify([oldGame, recentGame]));

      const games = getActiveGames();
      expect(games).toHaveLength(1);
      expect(games[0]?.gameId).toBe('recent-game');
    });

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('spaces-game-active-games', 'invalid-json');
      const games = getActiveGames();
      expect(games).toEqual([]);
    });
  });

  describe('saveActiveGame', () => {
    it('should save a game with gameId and opponent', () => {
      const state = createMockGameState('game-1');
      saveActiveGame(state);

      const games = getActiveGames();
      expect(games).toHaveLength(1);
      expect(games[0]?.gameId).toBe('game-1');
      expect(games[0]?.currentRound).toBe(1);
      expect(games[0]?.totalRounds).toBe(5);
    });

    it('should update existing game with same gameId', () => {
      const state1 = createMockGameState('game-1');
      saveActiveGame(state1);

      const state2 = createMockGameState('game-1', { type: 'round-results', round: 2, result: {} as any });
      state2.currentRound = 2;
      state2.playerScore = 1;
      saveActiveGame(state2);

      const games = getActiveGames();
      expect(games).toHaveLength(1);
      expect(games[0]?.currentRound).toBe(2);
      expect(games[0]?.playerScore).toBe(1);
    });

    it('should not save if gameId is null', () => {
      const state = createMockGameState('game-1');
      state.gameId = null;
      saveActiveGame(state);

      const games = getActiveGames();
      expect(games).toHaveLength(0);
    });

    it('should not save if opponent is null', () => {
      const state = createMockGameState('game-1');
      state.opponent = null;
      saveActiveGame(state);

      const games = getActiveGames();
      expect(games).toHaveLength(0);
    });

    it('should not save tutorial phases', () => {
      const state = createMockGameState('game-1', { type: 'tutorial-intro' });
      saveActiveGame(state);

      const games = getActiveGames();
      expect(games).toHaveLength(0);
    });

    it('should remove game when phase is game-over', () => {
      const state = createMockGameState('game-1');
      saveActiveGame(state);

      expect(getActiveGames()).toHaveLength(1);

      state.phase = { type: 'game-over', winner: 'player' };
      saveActiveGame(state);

      expect(getActiveGames()).toHaveLength(0);
    });

    it('should save deck mode games with 10 rounds', () => {
      const state = createMockGameState('game-1');
      state.gameMode = 'deck';
      saveActiveGame(state);

      const games = getActiveGames();
      expect(games[0]?.totalRounds).toBe(10);
    });

    it('should add new games to the beginning of the list', () => {
      const state1 = createMockGameState('game-1');
      saveActiveGame(state1);

      const state2 = createMockGameState('game-2');
      saveActiveGame(state2);

      const games = getActiveGames();
      expect(games[0]?.gameId).toBe('game-2');
      expect(games[1]?.gameId).toBe('game-1');
    });
  });

  describe('removeActiveGame', () => {
    it('should remove a game by gameId', () => {
      const state1 = createMockGameState('game-1');
      const state2 = createMockGameState('game-2');
      saveActiveGame(state1);
      saveActiveGame(state2);

      expect(getActiveGames()).toHaveLength(2);

      removeActiveGame('game-1');

      const games = getActiveGames();
      expect(games).toHaveLength(1);
      expect(games[0]?.gameId).toBe('game-2');
    });

    it('should handle removing non-existent game', () => {
      const state = createMockGameState('game-1');
      saveActiveGame(state);

      removeActiveGame('non-existent');

      const games = getActiveGames();
      expect(games).toHaveLength(1);
    });
  });

  describe('clearActiveGames', () => {
    it('should clear all games', () => {
      const state1 = createMockGameState('game-1');
      const state2 = createMockGameState('game-2');
      saveActiveGame(state1);
      saveActiveGame(state2);

      expect(getActiveGames()).toHaveLength(2);

      clearActiveGames();

      expect(getActiveGames()).toHaveLength(0);
    });
  });

  describe('getPhaseDescription', () => {
    it('should return correct descriptions for each phase', () => {
      expect(getPhaseDescription({ type: 'board-selection', round: 1 })).toBe('Selecting board');
      expect(getPhaseDescription({ type: 'round-results', round: 1, result: {} as any })).toBe('Viewing results');
      expect(getPhaseDescription({ type: 'waiting-for-opponent', round: 1 })).toBe('Waiting for opponent');
      expect(getPhaseDescription({ type: 'share-challenge', round: 1 })).toBe('Share challenge');
      expect(getPhaseDescription({ type: 'round-review', round: 1 })).toBe('Reviewing rounds');
      expect(getPhaseDescription({ type: 'deck-selection' })).toBe('Selecting deck');
      expect(getPhaseDescription({ type: 'all-rounds-results', results: [] })).toBe('Viewing all results');
      expect(getPhaseDescription({ type: 'share-final-results' })).toBe('Share results');
      expect(getPhaseDescription({ type: 'board-management' })).toBe('In progress');
    });
  });
});
