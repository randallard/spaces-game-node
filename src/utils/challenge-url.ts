/**
 * Challenge URL generation and parsing utilities
 *
 * Handles encoding game state into shareable URLs for peer-to-peer challenges
 */

import LZString from 'lz-string';
import { encodeMinimalBoard, decodeMinimalBoard } from './board-encoding';
import type { Board } from '../types/board';

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
}

/**
 * Generate a challenge URL from a board
 *
 * @param board - The player's board to share
 * @param round - Current round number
 * @param gameMode - Game mode (round-by-round or deck)
 * @returns Full challenge URL
 */
export function generateChallengeUrl(
  board: Board,
  round: number,
  gameMode: 'round-by-round' | 'deck' = 'round-by-round'
): string {
  // Encode the board using minimal encoding
  const encodedBoard = encodeMinimalBoard(board);

  // Create challenge data in compact format
  const challengeData: ChallengeData = {
    playerBoard: encodedBoard,
    boardSize: board.boardSize,
    round,
    gameMode,
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
      if (!challengeData.playerBoard || !challengeData.round || !challengeData.gameMode) {
        console.error('Invalid challenge data structure');
        return null;
      }

      // Validate board encoding by attempting to decode it
      decodeMinimalBoard(challengeData.playerBoard);

      return challengeData;
    }

    // Fallback: try old uncompressed format (for backwards compatibility during development)
    const challengeParam = params.get('challenge');
    const roundParam = params.get('r');
    const modeParam = params.get('m');

    if (!challengeParam || !roundParam || !modeParam) {
      return null;
    }

    // Parse values
    const playerBoard = challengeParam;
    const round = parseInt(roundParam);
    const gameMode = modeParam === 'd' ? 'deck' : 'round-by-round';

    if (isNaN(round) || round < 1) {
      return null;
    }

    // Decode the board to get board size (and validate encoding)
    const board = decodeMinimalBoard(playerBoard);

    return {
      playerBoard,
      boardSize: board.boardSize,
      round,
      gameMode,
    };
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
