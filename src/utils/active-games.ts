/**
 * Active games management utilities
 * Tracks in-progress games so players can resume them from the home screen
 */

import type { GameState, GamePhase } from '@/types/game-state';
import type { Opponent } from '@/types/opponent';
import { derivePhase, deriveCurrentRound, derivePlayerScore, deriveOpponentScore } from './derive-state';

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
  archived?: boolean; // If true, hidden from active games list until opponent makes a move
  // Store full state for restoration
  fullState: GameState;
};

const ACTIVE_GAMES_KEY = 'spaces-game-active-games';

/**
 * Get all active games from localStorage (excluding archived by default)
 */
export function getActiveGames(includeArchived = false): ActiveGameInfo[] {
  try {
    const stored = localStorage.getItem(ACTIVE_GAMES_KEY);
    if (!stored) return [];

    const games = JSON.parse(stored) as ActiveGameInfo[];
    // Filter out games that are too old (more than 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentGames = games.filter(game => game.lastUpdated > sevenDaysAgo);

    // If we filtered out old games, update localStorage
    if (recentGames.length !== games.length) {
      localStorage.setItem(ACTIVE_GAMES_KEY, JSON.stringify(recentGames));
    }

    // Filter out archived games unless explicitly requested
    // This is done after saving to localStorage so archived games are kept
    if (!includeArchived) {
      return recentGames.filter(game => !game.archived);
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
  // Only save if we have an opponent
  if (!state.opponent) {
    return;
  }

  // For CPU games, generate a local gameId if one doesn't exist
  // This allows CPU games to appear in active games list
  let gameId = state.gameId;
  if (!gameId && (state.opponent.type === 'cpu' || state.opponent.type === 'remote-cpu')) {
    // Check if we already have an active game with this opponent
    const games = getActiveGames(true); // Include archived
    const existingGame = games.find(g =>
      g.opponent.id === state.opponent?.id &&
      g.boardSize === state.boardSize &&
      g.gameMode === state.gameMode
    );

    if (existingGame) {
      // Reuse existing game ID
      gameId = existingGame.gameId;
    } else {
      // Generate a new stable ID based on opponent, boardSize, and gameMode
      gameId = `cpu-${state.opponent.id}-${state.boardSize}-${state.gameMode}-${Date.now()}`;
    }
  }

  // If still no gameId (shouldn't happen), don't save
  if (!gameId) {
    return;
  }

  // Derive phase, round, and scores from state
  const phase = derivePhase(state);
  const currentRound = deriveCurrentRound(state);
  const playerScore = derivePlayerScore(state.roundHistory);
  const opponentScore = deriveOpponentScore(state.roundHistory);

  // Don't save tutorial, setup, or home phases
  // Note: We DO save game-over phase so completed games appear in Completed Games panel
  if (phase.type === 'user-setup' ||
      phase.type === 'tutorial-intro' ||
      phase.type === 'tutorial-board-creation' ||
      phase.type === 'tutorial-results' ||
      phase.type === 'tutorial-name-entry' ||
      phase.type === 'board-management') {
    return;
  }

  try {
    const games = getActiveGames();

    const activeGame: ActiveGameInfo = {
      gameId,
      opponent: state.opponent,
      currentRound,
      totalRounds: state.gameMode === 'deck' ? 10 : 5,
      playerScore,
      opponentScore,
      phase,
      boardSize: state.boardSize,
      gameMode: state.gameMode,
      lastUpdated: Date.now(),
      fullState: state,
    };

    // Remove existing game with same ID and add updated version
    const filteredGames = games.filter(g => g.gameId !== gameId);
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
 * Archive a game (keep in localStorage but hide from active list)
 */
export function archiveActiveGame(gameId: string): void {
  try {
    const games = getActiveGames(true); // Include archived to find the game
    const gameIndex = games.findIndex(g => g.gameId === gameId);

    if (gameIndex !== -1 && games[gameIndex]) {
      games[gameIndex]!.archived = true;
      localStorage.setItem(ACTIVE_GAMES_KEY, JSON.stringify(games));
    }
  } catch (error) {
    console.error('[ActiveGames] Error archiving active game:', error);
  }
}

/**
 * Unarchive a game (when opponent makes a move)
 */
export function unarchiveActiveGame(gameId: string): void {
  try {
    const games = getActiveGames(true); // Include archived to find the game
    const gameIndex = games.findIndex(g => g.gameId === gameId);

    if (gameIndex !== -1 && games[gameIndex]) {
      games[gameIndex]!.archived = false;
      localStorage.setItem(ACTIVE_GAMES_KEY, JSON.stringify(games));
    }
  } catch (error) {
    console.error('[ActiveGames] Error unarchiving active game:', error);
  }
}

/**
 * Determine if the player is waiting for opponent to choose their board first
 * Based on the alternating board selection pattern:
 * - Round 1: Game creator goes first
 * - Odd rounds (1, 3, 5): Game creator goes first
 * - Even rounds (2, 4, 6): Opponent goes first
 */
export function isWaitingForOpponentBoard(game: ActiveGameInfo): boolean {
  const { fullState, phase } = game;

  // Only relevant for human opponents
  if (fullState.opponent?.type !== 'human') {
    return false;
  }

  // Check if we're in a waiting or review phase after completing our round
  const isWaitingPhase = phase.type === 'waiting-for-opponent' ||
                         phase.type === 'round-review' ||
                         phase.type === 'all-rounds-results';

  if (!isWaitingPhase) {
    return false;
  }

  // Derive current round and board selection from state
  const currentRound = deriveCurrentRound(fullState);

  // Determine who went first in round 1 (game creator)
  const playerWentFirstRound1 = fullState.gameCreatorId === fullState.user.id;

  // Calculate if it's player's turn to go first this round
  const isOddRound = currentRound % 2 === 1;
  const isPlayerTurnToGoFirst = isOddRound === playerWentFirstRound1;

  // Check if opponent has selected board for current round
  const opponentBoard = fullState.roundHistory[currentRound - 1]?.opponentBoard ?? null;

  // If it's opponent's turn to go first and they haven't selected their board yet
  return !isPlayerTurnToGoFirst && !opponentBoard;
}

/**
 * Determine what phase description to show for a game
 */
export function getPhaseDescription(phase: GamePhase, game?: ActiveGameInfo): string {
  // Check if we're waiting for opponent to choose their board first
  if (game && isWaitingForOpponentBoard(game)) {
    return 'Waiting for opponent to choose board';
  }

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
