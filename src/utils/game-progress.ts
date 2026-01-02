/**
 * Game progress tracking utilities
 *
 * Tracks which rounds have been completed for each game to prevent replay attacks
 */

/**
 * Game progress entry stored in localStorage
 */
export interface GameProgress {
  gameId: string;
  opponentId: string;
  opponentName: string;
  /** Highest round number completed (player has selected and shared their board) */
  lastCompletedRound: number;
  /** Round where player selected a board but hasn't shared it yet */
  pendingRound: number | null;
  /** Timestamp of last update */
  lastUpdated: number;
}

const STORAGE_KEY = 'spaces-game-progress';
const MAX_GAMES_TRACKED = 100; // Keep only the most recent 100 games

/**
 * Load all game progress from localStorage
 */
function loadAllProgress(): GameProgress[] {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json);
  } catch (error) {
    console.error('[GameProgress] Failed to load progress:', error);
    return [];
  }
}

/**
 * Save all game progress to localStorage
 */
function saveAllProgress(progress: GameProgress[]): void {
  try {
    // Keep only the most recent games
    const trimmed = progress
      .sort((a, b) => b.lastUpdated - a.lastUpdated)
      .slice(0, MAX_GAMES_TRACKED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('[GameProgress] Failed to save progress:', error);
  }
}

/**
 * Get progress for a specific game
 */
export function getGameProgress(gameId: string): GameProgress | null {
  const allProgress = loadAllProgress();
  return allProgress.find(p => p.gameId === gameId) || null;
}

/**
 * Mark a round as completed (player has selected and shared their board)
 */
export function markRoundCompleted(
  gameId: string,
  round: number,
  opponentId: string,
  opponentName: string
): void {
  const allProgress = loadAllProgress();
  const existingIndex = allProgress.findIndex(p => p.gameId === gameId);

  if (existingIndex >= 0) {
    // Update existing progress
    const existing = allProgress[existingIndex];
    if (existing) {
      allProgress[existingIndex] = {
        ...existing,
        lastCompletedRound: Math.max(existing.lastCompletedRound, round),
        pendingRound: existing.pendingRound === round ? null : existing.pendingRound,
        lastUpdated: Date.now(),
      };
    }
  } else {
    // Create new progress entry
    allProgress.push({
      gameId,
      opponentId,
      opponentName,
      lastCompletedRound: round,
      pendingRound: null,
      lastUpdated: Date.now(),
    });
  }

  saveAllProgress(allProgress);
}

/**
 * Mark a round as pending (player has selected a board but not shared yet)
 */
export function markRoundPending(
  gameId: string,
  round: number,
  opponentId: string,
  opponentName: string
): void {
  const allProgress = loadAllProgress();
  const existingIndex = allProgress.findIndex(p => p.gameId === gameId);

  if (existingIndex >= 0) {
    // Update existing progress
    const existing = allProgress[existingIndex];
    if (existing) {
      allProgress[existingIndex] = {
        ...existing,
        pendingRound: round,
        lastUpdated: Date.now(),
      };
    }
  } else {
    // Create new progress entry
    allProgress.push({
      gameId,
      opponentId,
      opponentName,
      lastCompletedRound: 0,
      pendingRound: round,
      lastUpdated: Date.now(),
    });
  }

  saveAllProgress(allProgress);
}

/**
 * Check if a player has already completed a specific round
 */
export function hasCompletedRound(gameId: string, round: number): boolean {
  const progress = getGameProgress(gameId);
  if (!progress) return false;
  return round <= progress.lastCompletedRound;
}

/**
 * Check if a round is pending (selected but not shared)
 */
export function isRoundPending(gameId: string, round: number): boolean {
  const progress = getGameProgress(gameId);
  if (!progress) return false;
  return progress.pendingRound === round;
}

/**
 * Clear progress for a specific game (e.g., when game is finished)
 */
export function clearGameProgress(gameId: string): void {
  const allProgress = loadAllProgress();
  const filtered = allProgress.filter(p => p.gameId !== gameId);
  saveAllProgress(filtered);
}

/**
 * Clear all game progress (for testing/debugging)
 */
export function clearAllProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[GameProgress] Failed to clear progress:', error);
  }
}
