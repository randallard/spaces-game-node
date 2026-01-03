/**
 * Active games management utilities
 * Tracks in-progress games so players can resume them from the home screen
 */

import type { GameState, GamePhase } from '@/types/game-state';
import type { Opponent } from '@/types/opponent';

/**
 * Simplified game info for display in the active games list
 */
export type ActiveGameInfo = {
  gameId: string;
  opponent: Opponent;
  currentRound: number;
  totalRounds: number; // 5 for round-by-round, 10 for deck mode
  playerScore: number;
  opponentScore: number;
  phase: GamePhase;
  boardSize: number | null;
  gameMode: 'round-by-round' | 'deck' | null;
  lastUpdated: number; // timestamp
  // Store full state for restoration
  fullState: GameState;
};

const ACTIVE_GAMES_KEY = 'spaces-game-active-games';

/**
 * Get all active games from localStorage
 */
export function getActiveGames(): ActiveGameInfo[] {
  try {
    const stored = localStorage.getItem(ACTIVE_GAMES_KEY);
    if (!stored) return [];

    const games = JSON.parse(stored) as ActiveGameInfo[];
    // Filter out games that are too old (more than 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentGames = games.filter(game => game.lastUpdated > sevenDaysAgo);

    // If we filtered any out, update localStorage
    if (recentGames.length !== games.length) {
      localStorage.setItem(ACTIVE_GAMES_KEY, JSON.stringify(recentGames));
    }

    return recentGames;
  } catch (error) {
    console.error('[ActiveGames] Error loading active games:', error);
    return [];
  }
}

/**
 * Save or update an active game
 */
export function saveActiveGame(state: GameState): void {
  // Only save if we have a gameId and opponent
  if (!state.gameId || !state.opponent) {
    return;
  }

  // Don't save if game is over
  if (state.phase.type === 'game-over') {
    removeActiveGame(state.gameId);
    return;
  }

  // Don't save tutorial or setup phases
  if (state.phase.type === 'user-setup' ||
      state.phase.type === 'tutorial-intro' ||
      state.phase.type === 'tutorial-board-creation' ||
      state.phase.type === 'tutorial-results' ||
      state.phase.type === 'tutorial-name-entry') {
    return;
  }

  try {
    const games = getActiveGames();

    const activeGame: ActiveGameInfo = {
      gameId: state.gameId,
      opponent: state.opponent,
      currentRound: state.currentRound,
      totalRounds: state.gameMode === 'deck' ? 10 : 5,
      playerScore: state.playerScore,
      opponentScore: state.opponentScore,
      phase: state.phase,
      boardSize: state.boardSize,
      gameMode: state.gameMode,
      lastUpdated: Date.now(),
      fullState: state,
    };

    // Remove existing game with same ID and add updated version
    const filteredGames = games.filter(g => g.gameId !== state.gameId);
    filteredGames.unshift(activeGame); // Add to beginning (most recent first)

    localStorage.setItem(ACTIVE_GAMES_KEY, JSON.stringify(filteredGames));
  } catch (error) {
    console.error('[ActiveGames] Error saving active game:', error);
  }
}

/**
 * Remove an active game (when completed or abandoned)
 */
export function removeActiveGame(gameId: string): void {
  try {
    const games = getActiveGames();
    const filteredGames = games.filter(g => g.gameId !== gameId);
    localStorage.setItem(ACTIVE_GAMES_KEY, JSON.stringify(filteredGames));
  } catch (error) {
    console.error('[ActiveGames] Error removing active game:', error);
  }
}

/**
 * Clear all active games
 */
export function clearActiveGames(): void {
  try {
    localStorage.removeItem(ACTIVE_GAMES_KEY);
  } catch (error) {
    console.error('[ActiveGames] Error clearing active games:', error);
  }
}

/**
 * Determine what phase description to show for a game
 */
export function getPhaseDescription(phase: GamePhase): string {
  switch (phase.type) {
    case 'board-selection':
      return 'Selecting board';
    case 'round-results':
      return 'Viewing results';
    case 'waiting-for-opponent':
      return 'Waiting for opponent';
    case 'share-challenge':
      return 'Share challenge';
    case 'round-review':
      return 'Reviewing rounds';
    case 'deck-selection':
      return 'Selecting deck';
    case 'all-rounds-results':
      return 'Viewing all results';
    case 'share-final-results':
      return 'Share results';
    default:
      return 'In progress';
  }
}
