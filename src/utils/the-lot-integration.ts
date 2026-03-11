/**
 * Integration with the-lot game hub.
 *
 * Handles detecting lot mode from URL hash, configuring opponents from
 * NPC config, and returning results back to the-lot.
 */

import LZString from 'lz-string';
import type { Opponent, AiAgentSkillLevel, ModelAssignment } from '../types/opponent';

export interface LotLaunchData {
  sessionId: string;
  npcId: string;
  npcDisplayName: string;
  opponentType: 'ai-agent';
  skillLevel: string;
  modelAssignments: Record<string, { modelId: string; label: string }>;
  returnUrl: string;
}

export interface LotReturnResults {
  sessionId: string;
  npcId: string;
  playerScore: number;
  opponentScore: number;
  winner: 'player' | 'opponent' | 'tie' | 'incomplete';
  rounds: Array<{
    round: number;
    playerPoints: number;
    opponentPoints: number;
    winner: 'player' | 'opponent' | 'tie';
  }>;
}

/**
 * Check if the current URL contains a lot launch parameter.
 */
export function hasLotLaunchInUrl(): boolean {
  const hash = window.location.hash;
  if (!hash) return false;
  return hash.startsWith('#lot=');
}

/**
 * Parse the #lot= hash parameter to extract launch data.
 * Returns null if not present or invalid.
 */
export function parseLotLaunch(): LotLaunchData | null {
  const hash = window.location.hash;
  if (!hash) return null;

  const match = hash.match(/^#lot=(.+)$/);
  if (!match) return null;

  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(match[1]!);
    if (!decompressed) return null;

    const data = JSON.parse(decompressed) as LotLaunchData;

    // Validate required fields
    if (
      !data.sessionId ||
      !data.npcId ||
      !data.opponentType ||
      !data.skillLevel ||
      !data.returnUrl
    ) {
      console.error('[lot] Invalid launch data: missing required fields');
      return null;
    }

    return data;
  } catch (error) {
    console.error('[lot] Failed to parse launch data:', error);
    return null;
  }
}

/**
 * Clear the lot hash from the URL without page reload.
 */
export function clearLotHash(): void {
  if (window.history.replaceState) {
    const urlWithoutHash = window.location.pathname + window.location.search;
    window.history.replaceState({}, document.title, urlWithoutHash);
  } else {
    window.location.hash = '';
  }
}

/**
 * Create an Opponent object from lot launch data.
 */
export function configureLotOpponent(lotData: LotLaunchData): Opponent {
  return {
    id: `lot-npc-${lotData.npcId}`,
    name: lotData.npcDisplayName || lotData.npcId.charAt(0).toUpperCase() + lotData.npcId.slice(1),
    type: 'ai-agent',
    wins: 0,
    losses: 0,
    skillLevel: lotData.skillLevel as AiAgentSkillLevel,
    modelAssignments: lotData.modelAssignments as Record<string, ModelAssignment>,
  };
}

/**
 * Navigate back to the-lot with compressed game results.
 */
export function returnToLot(
  returnUrl: string,
  results: LotReturnResults,
): void {
  const compressed = LZString.compressToEncodedURIComponent(
    JSON.stringify(results),
  );
  window.location.href = `${returnUrl}#r=${compressed}`;
}
