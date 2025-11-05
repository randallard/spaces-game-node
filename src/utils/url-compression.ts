/**
 * URL compression utilities for hash fragment communication
 * Uses lz-string for compression (reduces state from ~1200 chars to ~180 chars)
 */

import LZString from 'lz-string';
import { GameStateSchema, UrlPayloadSchema } from '@/schemas';
import type { GameState, UrlPayload } from '@/types';

/**
 * Compress game state to URL-safe string
 */
export function compressGameState(state: GameState): string {
  try {
    const json = JSON.stringify(state);
    return LZString.compressToEncodedURIComponent(json);
  } catch (error) {
    console.error('Failed to compress game state:', error);
    return '';
  }
}

/**
 * Decompress URL string to game state with validation
 * Returns null if decompression or validation fails
 */
export function decompressGameState(compressed: string): GameState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) {
      return null;
    }

    const data: unknown = JSON.parse(json);
    const result = GameStateSchema.safeParse(data);

    if (!result.success) {
      console.error('Game state validation failed:', result.error);
      return null;
    }

    return result.data as GameState;
  } catch (error) {
    console.error('Failed to decompress game state:', error);
    return null;
  }
}

/**
 * Compress URL payload (delta, full_state, resync_request)
 */
export function compressPayload(payload: UrlPayload): string {
  try {
    const json = JSON.stringify(payload);
    return LZString.compressToEncodedURIComponent(json);
  } catch (error) {
    console.error('Failed to compress payload:', error);
    return '';
  }
}

/**
 * Decompress URL payload with validation
 */
export function decompressPayload(compressed: string): UrlPayload | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) {
      return null;
    }

    const data: unknown = JSON.parse(json);
    const result = UrlPayloadSchema.safeParse(data);

    if (!result.success) {
      console.error('URL payload validation failed:', result.error);
      return null;
    }

    return result.data as UrlPayload;
  } catch (error) {
    console.error('Failed to decompress payload:', error);
    return null;
  }
}

/**
 * Get game state from URL hash
 * Returns null if hash is empty or invalid
 */
export function getGameStateFromHash(): GameState | null {
  const hash = window.location.hash.slice(1); // Remove '#'
  if (!hash) {
    return null;
  }

  return decompressGameState(hash);
}

/**
 * Set game state to URL hash (replaceState, not pushState)
 */
export function setGameStateToHash(state: GameState): void {
  const compressed = compressGameState(state);
  if (compressed) {
    // Use replaceState to avoid polluting browser history
    window.history.replaceState(null, '', `#${compressed}`);
  }
}

/**
 * Clear URL hash
 */
export function clearHash(): void {
  window.history.replaceState(null, '', window.location.pathname);
}

/**
 * Calculate compression ratio (for debugging)
 */
export function getCompressionRatio(state: GameState): number {
  const original = JSON.stringify(state);
  const compressed = compressGameState(state);
  return compressed.length / original.length;
}
