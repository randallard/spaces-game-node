/**
 * Client-side utility for saving lot game results to the server (Vercel KV).
 * Called when a lot game reaches game-over so townage can fetch results
 * even if the user doesn't click "Return to Townage".
 */

import { getApiEndpoint } from '@/config/api';

export interface LotResultPayload {
  sessionId: string;
  npcId: string;
  boardSize: number;
  playerScore: number;
  opponentScore: number;
  winner: 'player' | 'opponent' | 'tie';
  rounds: Array<{
    round: number;
    playerPoints: number;
    opponentPoints: number;
    winner: string;
  }>;
  completedAt: number;
}

const LOCAL_FALLBACK_KEY = 'spaces-game-pending-lot-results';

/**
 * Save a lot game result to the server (Vercel KV).
 * Also saves to localStorage as a fallback in case the API call fails.
 */
export async function saveLotResultToServer(result: LotResultPayload): Promise<void> {
  // Always save to localStorage as fallback
  saveLotResultLocally(result);

  try {
    const response = await fetch(getApiEndpoint('/api/lot-results'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });

    if (!response.ok) {
      console.error('[LotResults] Failed to save to server:', response.status);
      return;
    }

    console.log('[LotResults] Result saved to server for session:', result.sessionId);
  } catch (error) {
    console.error('[LotResults] Error saving to server:', error);
  }
}

function saveLotResultLocally(result: LotResultPayload): void {
  try {
    const stored = localStorage.getItem(LOCAL_FALLBACK_KEY);
    const results: LotResultPayload[] = stored ? JSON.parse(stored) : [];
    // Replace existing result for same session, or add new
    const filtered = results.filter(r => r.sessionId !== result.sessionId);
    filtered.push(result);
    localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(filtered));
  } catch {
    // localStorage full or unavailable
  }
}

/**
 * Get locally saved pending lot results (fallback for when KV is unavailable).
 */
export function getLocalPendingResults(): LotResultPayload[] {
  try {
    const stored = localStorage.getItem(LOCAL_FALLBACK_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Clear a locally saved pending result after it's been consumed.
 */
export function clearLocalPendingResult(sessionId: string): void {
  try {
    const stored = localStorage.getItem(LOCAL_FALLBACK_KEY);
    if (!stored) return;
    const results: LotResultPayload[] = JSON.parse(stored);
    const filtered = results.filter(r => r.sessionId !== sessionId);
    localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(filtered));
  } catch {
    // localStorage full or unavailable
  }
}
