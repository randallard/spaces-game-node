/**
 * LocalStorage helpers for persisting game data
 */

import type { z } from 'zod';

const STORAGE_KEYS = {
  USER_PROFILE: 'spaces-game-user-profile',
  GAME_STATE: 'spaces-game-state',
} as const;

/**
 * Save data to LocalStorage with JSON serialization
 */
export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    const json = JSON.stringify(data);
    window.localStorage.setItem(key, json);
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

/**
 * Load data from LocalStorage with Zod validation
 * Returns null if key doesn't exist or validation fails
 */
export function loadFromLocalStorage<T>(
  key: string,
  schema: z.ZodSchema<T>
): T | null {
  try {
    const json = window.localStorage.getItem(key);
    if (!json) {
      return null;
    }

    const data: unknown = JSON.parse(json);
    const result = schema.safeParse(data);

    if (!result.success) {
      console.error('LocalStorage validation failed:', result.error);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * Remove data from LocalStorage
 */
export function removeFromLocalStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

/**
 * Clear all LocalStorage data for this app
 */
export function clearAllLocalStorage(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      window.localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

/**
 * Check if LocalStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

export { STORAGE_KEYS };
