/**
 * Custom hook for managing localStorage with Zod validation
 * @module hooks/useLocalStorage
 */

import { useState, useCallback, useEffect } from 'react';
import type { z } from 'zod';
import {
  loadFromLocalStorage,
  saveToLocalStorage,
  removeFromLocalStorage,
} from '@/utils/local-storage';

/**
 * Hook for managing localStorage with automatic serialization and validation.
 *
 * Features:
 * - Automatic JSON serialization/deserialization
 * - Runtime validation with Zod schemas
 * - Synchronization across tabs/windows
 * - Type-safe state management
 *
 * @param key - LocalStorage key
 * @param schema - Zod schema for validation
 * @param initialValue - Default value if key doesn't exist
 * @returns [value, setValue, removeValue] tuple
 *
 * @example
 * ```tsx
 * const [user, setUser, removeUser] = useLocalStorage(
 *   'user-profile',
 *   UserProfileSchema,
 *   null
 * );
 *
 * // Update value
 * setUser({ id: '123', name: 'Alice' });
 *
 * // Remove value
 * removeUser();
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  schema: z.ZodSchema<T>,
  initialValue: T | null = null
): [T | null, (value: T | null) => void, () => void] {
  // Initialize state from localStorage
  const [storedValue, setStoredValue] = useState<T | null>(() => {
    const loaded = loadFromLocalStorage(key, schema);
    return loaded ?? initialValue;
  });

  /**
   * Update both state and localStorage
   */
  const setValue = useCallback(
    (value: T | null): void => {
      try {
        // Update state
        setStoredValue(value);

        // Update localStorage
        if (value === null) {
          removeFromLocalStorage(key);
        } else {
          saveToLocalStorage(key, value);
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, schema]
  );

  /**
   * Remove value from both state and localStorage
   */
  const removeValue = useCallback((): void => {
    setStoredValue(null);
    removeFromLocalStorage(key);
  }, [key]);

  /**
   * Listen for storage events (cross-tab synchronization)
   */
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent): void => {
      if (event.key !== key) return;

      if (event.newValue === null) {
        // Key was removed
        setStoredValue(null);
      } else {
        // Key was updated - validate and parse
        const loaded = loadFromLocalStorage(key, schema);
        setStoredValue(loaded ?? initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, schema, initialValue]);

  return [storedValue, setValue, removeValue];
}
