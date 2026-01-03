/**
 * Challenge URL generation and parsing utilities
 *
 * Handles encoding game state into shareable URLs for peer-to-peer challenges
 */

import LZString from 'lz-string';
import { encodeMinimalBoard, decodeMinimalBoard } from './board-encoding';
import type { Board } from '../types/board';
import type { RoundResult } from '../types/game-state';

/**
 * Challenge data structure for URL encoding
 */
export interface ChallengeData {
  /** The player's board in minimal encoding */
  playerBoard: string;
  /** Board size */
  boardSize: number;
  /** Round number */
  round: number;
  /** Game mode */
  gameMode: 'round-by-round' | 'deck';
  /** Game session ID (unique per 5-round game) */
  gameId: string;
  /** Sender's player ID */
  playerId: string;
  /** Sender's player name */
  playerName: string;
  /** Player's current score (optional, for tracking through rounds) */
  playerScore?: number;
  /** Opponent's current score (optional, for tracking through rounds) */
  opponentScore?: number;
  /** Is this a final results share (no board, just scores) */
  isFinalResults?: boolean;
  /** Is this a round complete notification (both played, receiver should review) */
  isRoundComplete?: boolean;
  /** Sender's Discord ID (optional, for notifications) */
  playerDiscordId?: string;
  /** Sender's Discord username (optional, for display) */
  playerDiscordUsername?: string;
  /** Previous round result (optional, to help receiver catch up on missed rounds) */
  previousRoundResult?: RoundResult;
}

/**
 * Generate a challenge URL from a board
 *
 * @param board - The player's board to share
 * @param round - Current round number
 * @param gameMode - Game mode (round-by-round or deck)
 * @param gameId - Unique game session ID
 * @param playerId - Sender's player ID
 * @param playerName - Sender's player name
 * @param playerScore - Current player score (optional)
 * @param opponentScore - Current opponent score (optional)
 * @param playerDiscordId - Sender's Discord ID (optional)
 * @param playerDiscordUsername - Sender's Discord username (optional)
 * @param previousRoundResult - Previous round result (optional, for catching up)
 * @returns Full challenge URL
 */
export function generateChallengeUrl(
  board: Board,
  round: number,
  gameMode: 'round-by-round' | 'deck',
  gameId: string,
  playerId: string,
  playerName: string,
  playerScore?: number,
  opponentScore?: number,
  playerDiscordId?: string,
  playerDiscordUsername?: string,
  previousRoundResult?: RoundResult,
  isRoundComplete?: boolean
): string {
  // Encode the board using minimal encoding
  const encodedBoard = encodeMinimalBoard(board);

  // Create challenge data in compact format
  const challengeData: ChallengeData = {
    playerBoard: encodedBoard,
    boardSize: board.boardSize,
    round,
    gameMode,
    gameId,
    playerId,
    playerName,
    ...(playerScore !== undefined && { playerScore }),
    ...(opponentScore !== undefined && { opponentScore }),
    ...(playerDiscordId && { playerDiscordId }),
    ...(playerDiscordUsername && { playerDiscordUsername }),
    ...(previousRoundResult && { previousRoundResult }),
    ...(isRoundComplete && { isRoundComplete }),
  };

  // Serialize to compact JSON
  const jsonStr = JSON.stringify(challengeData);

  // Compress using LZ-String for URL-safe compression
  // This makes the URL harder to read and significantly smaller
  const compressed = LZString.compressToEncodedURIComponent(jsonStr);

  // Get current URL origin and path
  const baseUrl = window.location.origin + window.location.pathname;

  // Return full URL with compressed hash fragment
  return `${baseUrl}#c=${compressed}`;
}

/**
 * Generate a final results URL (after round 5 completion)
 *
 * @param boardSize - Board size used
 * @param playerScore - Final player score
 * @param opponentScore - Final opponent score
 * @param gameMode - Game mode used
 * @param gameId - Game session ID
 * @param playerId - Sender's player ID
 * @param playerName - Sender's player name
 * @returns Full results URL
 */
export function generateFinalResultsUrl(
  boardSize: number,
  playerScore: number,
  opponentScore: number,
  gameMode: 'round-by-round' | 'deck',
  gameId: string,
  playerId: string,
  playerName: string
): string {
  // Create final results data
  const challengeData: ChallengeData = {
    playerBoard: '', // No board needed for final results
    boardSize,
    round: 5,
    gameMode,
    gameId,
    playerId,
    playerName,
    playerScore,
    opponentScore,
    isFinalResults: true,
  };

  // Serialize to compact JSON
  const jsonStr = JSON.stringify(challengeData);

  // Compress using LZ-String
  const compressed = LZString.compressToEncodedURIComponent(jsonStr);

  // Get current URL origin and path
  const baseUrl = window.location.origin + window.location.pathname;

  // Return full URL with compressed hash fragment
  return `${baseUrl}#c=${compressed}`;
}

/**
 * Parse a challenge URL and extract challenge data
 *
 * @param url - The challenge URL or hash fragment
 * @returns Parsed challenge data, or null if invalid
 */
export function parseChallengeUrl(url: string): ChallengeData | null {
  try {
    // Extract hash fragment
    const hashIndex = url.indexOf('#');
    const hashFragment = hashIndex >= 0 ? url.substring(hashIndex + 1) : url;

    // Parse URL parameters
    const params = new URLSearchParams(hashFragment);

    // Check for compressed format (new)
    const compressedParam = params.get('c');

    if (compressedParam) {
      // Decompress using LZ-String
      const decompressed = LZString.decompressFromEncodedURIComponent(compressedParam);

      if (!decompressed) {
        console.error('Failed to decompress challenge data');
        return null;
      }

      // Parse JSON
      const challengeData = JSON.parse(decompressed) as ChallengeData;

      // Validate the data
      if (!challengeData.round || !challengeData.gameMode || !challengeData.gameId || !challengeData.playerId || !challengeData.playerName) {
        console.error('Invalid challenge data structure: missing required fields');
        return null;
      }

      // For final results, playerBoard can be empty
      if (!challengeData.isFinalResults) {
        if (!challengeData.playerBoard) {
          console.error('Invalid challenge data: missing playerBoard');
          return null;
        }
        // Validate board encoding by attempting to decode it
        decodeMinimalBoard(challengeData.playerBoard);
      }

      return challengeData;
    }

    // Fallback: try old uncompressed format (for backwards compatibility during development)
    // Old format URLs are no longer supported with the new ID system
    console.error('Old challenge URL format detected - please generate a new challenge URL');
    return null;
  } catch (error) {
    console.error('Failed to parse challenge URL:', error);
    return null;
  }
}

/**
 * Check if the current URL contains a challenge
 *
 * @returns True if URL contains a challenge parameter
 */
export function hasChallengeInUrl(): boolean {
  const hash = window.location.hash;
  if (!hash) return false;

  const params = new URLSearchParams(hash.substring(1));
  // Check for compressed format (new) or old format
  return params.has('c') || params.has('challenge');
}

/**
 * Get challenge data from current URL
 *
 * @returns Challenge data if present, null otherwise
 */
export function getChallengeFromUrl(): ChallengeData | null {
  const hash = window.location.hash;
  if (!hash) return null;

  return parseChallengeUrl(hash);
}

/**
 * Clear challenge from URL (without page reload)
 */
export function clearChallengeFromUrl(): void {
  if (window.history.replaceState) {
    const urlWithoutHash = window.location.pathname + window.location.search;
    window.history.replaceState({}, document.title, urlWithoutHash);
  } else {
    window.location.hash = '';
  }
}
