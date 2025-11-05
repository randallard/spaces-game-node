/**
 * Custom hook for URL hash fragment synchronization
 * @module hooks/useUrlSync
 *
 * CRITICAL PATTERNS (from kings-cooking):
 * 1. Use useRef for callbacks to avoid frozen closure problem
 * 2. Empty dependency array for hashchange listener (prevents exponential growth)
 * 3. Clean up listeners and timers on unmount (prevent memory leaks)
 * 4. Use replaceState (not pushState) to prevent history pollution
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { compressGameState, decompressGameState } from '@/utils/url-compression';
import type { GameState } from '@/types';

export interface UseUrlSyncOptions {
  /** Debounce delay for URL updates (default: 300ms) */
  debounceMs?: number;

  /** Error callback handler */
  onError?: (error: string) => void;

  /** Success callback after URL update */
  onUrlUpdated?: (url: string) => void;

  /** Callback when game state received from URL */
  onGameStateReceived?: (state: GameState) => void;
}

export interface UseUrlSyncReturn {
  /** Current game state from URL or null if no hash */
  gameState: GameState | null;

  /** Current error message or null if no error */
  error: string | null;

  /** Loading state (true while parsing initial URL) */
  isLoading: boolean;

  /** Update URL with debouncing (300ms default) */
  updateUrl: (state: GameState) => void;

  /** Update URL immediately (bypasses debounce) */
  updateUrlImmediate: (state: GameState) => void;

  /** Get current shareable URL */
  getShareUrl: () => string;

  /** Copy share URL to clipboard */
  copyShareUrl: () => Promise<boolean>;
}

/**
 * Custom hook for managing game state in URL hash fragment.
 *
 * Features:
 * - Automatic URL parsing on mount
 * - Hash change monitoring (back/forward navigation)
 * - Debounced URL updates (300ms default)
 * - Error state management with validation
 * - Memory leak prevention (cleanup on unmount)
 * - lz-string compression for efficient URLs
 *
 * @param options - Hook configuration options
 * @returns State object with gameState, error, and update functions
 *
 * @example
 * ```tsx
 * const { gameState, error, updateUrl } = useUrlSync({
 *   debounceMs: 300,
 *   onError: (error) => console.error(error),
 *   onGameStateReceived: (state) => console.log('Loaded:', state),
 * });
 *
 * // Update URL
 * updateUrl(newGameState);
 *
 * // Get shareable URL
 * const shareUrl = getShareUrl();
 * ```
 */
export function useUrlSync(options: UseUrlSyncOptions = {}): UseUrlSyncReturn {
  const {
    debounceMs = 300,
    onError,
    onUrlUpdated,
    onGameStateReceived,
  } = options;

  // State: Current game state and error
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refs: Latest state for debounced callback (prevents frozen closure)
  const gameStateRef = useRef<GameState | null>(gameState);
  const debounceTimerRef = useRef<number | null>(null);

  // Keep ref in sync with state (CRITICAL for debounce)
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  /**
   * Parse URL hash on mount.
   *
   * This effect runs ONCE on component mount to load initial state
   * from URL hash fragment. Validates with GameStateSchema.
   *
   * CRITICAL: Empty dependency array to prevent infinite loops.
   */
  useEffect(() => {
    const hash = window.location.hash.slice(1); // Remove '#' prefix

    if (!hash) {
      // No hash = new game
      setIsLoading(false);
      return;
    }

    // Decompress and validate game state
    const decoded = decompressGameState(hash);

    if (decoded) {
      setGameState(decoded);
      setError(null);
      onGameStateReceived?.(decoded);
    } else {
      // Validation failed
      const errorMsg = 'Failed to load game from URL - the link may be corrupted';
      setError(errorMsg);
      onError?.(errorMsg);
    }

    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run ONCE on mount

  /**
   * Listen for hash changes (back/forward navigation).
   *
   * This effect monitors browser navigation (back/forward buttons)
   * and updates state when hash changes externally.
   *
   * CRITICAL: Empty dependency array prevents exponential listener growth.
   */
  useEffect(() => {
    const handleHashChange = (): void => {
      const hash = window.location.hash.slice(1);

      if (!hash) {
        // Hash removed - reset to new game
        setGameState(null);
        setError(null);
        return;
      }

      // Decompress and validate new game state
      const decoded = decompressGameState(hash);

      if (decoded) {
        setGameState(decoded);
        setError(null);
        onGameStateReceived?.(decoded);
      } else {
        const errorMsg = 'Failed to load game from URL';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    // CRITICAL: Clean up listener on unmount
    return () => window.removeEventListener('hashchange', handleHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - listener is stable

  /**
   * Debounced URL update function.
   *
   * Uses useMemo to create stable debounce function that accesses
   * latest state via gameStateRef (prevents frozen closure problem).
   *
   * CRITICAL: Uses useRef for latest state access, not closure.
   */
  const debouncedUpdateUrl = useMemo(() => {
    return (newState: GameState) => {
      // Clear any existing timer
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }

      // Debounce URL update
      debounceTimerRef.current = window.setTimeout(() => {
        const compressed = compressGameState(newState);

        if (!compressed) {
          const errorMsg = 'Failed to encode game state to URL';
          setError(errorMsg);
          onError?.(errorMsg);
          return;
        }

        // Update URL with replaceState (NO history pollution)
        const url = new URL(window.location.href);
        url.hash = compressed;
        window.history.replaceState(null, '', url.toString());

        // Update state
        setGameState(newState);
        setError(null);

        // Notify success
        onUrlUpdated?.(url.href);

        debounceTimerRef.current = null;
      }, debounceMs);
    };
  }, [debounceMs, onError, onUrlUpdated]);

  /**
   * Cleanup debounce timer on unmount.
   *
   * CRITICAL: Prevents memory leaks and race conditions.
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  /**
   * Get current shareable URL.
   *
   * @returns Current URL with hash fragment
   */
  const getShareUrl = useCallback((): string => {
    return window.location.href;
  }, []);

  /**
   * Force immediate URL update (bypasses debounce).
   *
   * Use this for significant events like game creation.
   *
   * @param newState - Game state to encode immediately
   */
  const updateUrlImmediate = useCallback(
    (newState: GameState) => {
      // Clear any pending debounced update
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      const compressed = compressGameState(newState);

      if (!compressed) {
        const errorMsg = 'Failed to encode game state to URL';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      const url = new URL(window.location.href);
      url.hash = compressed;
      window.history.replaceState(null, '', url.toString());

      setGameState(newState);
      setError(null);
      onUrlUpdated?.(url.href);
    },
    [onError, onUrlUpdated]
  );

  /**
   * Copy share URL to clipboard
   *
   * @returns Promise that resolves to true if copy succeeded
   */
  const copyShareUrl = useCallback(async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      return true;
    } catch (error) {
      console.error('Failed to copy URL:', error);
      return false;
    }
  }, []);

  return {
    gameState,
    error,
    isLoading,
    updateUrl: debouncedUpdateUrl,
    updateUrlImmediate,
    getShareUrl,
    copyShareUrl,
  };
}
