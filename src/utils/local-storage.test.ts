/**
 * Tests for localStorage utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  removeFromLocalStorage,
  clearAllLocalStorage,
  isLocalStorageAvailable,
  STORAGE_KEYS,
} from './local-storage';

describe('localStorage utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    // Clear all keys instead of using clear() which may not be available
    Object.keys(window.localStorage).forEach((key) => {
      window.localStorage.removeItem(key);
    });
  });

  describe('saveToLocalStorage', () => {
    it('should save data to localStorage', () => {
      const data = { name: 'Test', value: 42 };
      saveToLocalStorage('test-key', data);

      const stored = window.localStorage.getItem('test-key');
      expect(stored).toBe(JSON.stringify(data));
    });

    it('should handle complex objects', () => {
      const data = {
        nested: { value: 123 },
        array: [1, 2, 3],
        bool: true,
      };
      saveToLocalStorage('test-key', data);

      const stored: unknown = JSON.parse(
        window.localStorage.getItem('test-key') || '{}'
      );
      expect(stored).toEqual(data);
    });

    it('should not throw on localStorage errors', () => {
      // Mock localStorage.setItem to throw
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => saveToLocalStorage('test', { data: 'test' })).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  describe('loadFromLocalStorage', () => {
    const TestSchema = z.object({
      name: z.string(),
      value: z.number(),
    });

    it('should load and validate data', () => {
      const data = { name: 'Test', value: 42 };
      window.localStorage.setItem('test-key', JSON.stringify(data));

      const loaded = loadFromLocalStorage('test-key', TestSchema);
      expect(loaded).toEqual(data);
    });

    it('should return null for non-existent key', () => {
      const loaded = loadFromLocalStorage('non-existent', TestSchema);
      expect(loaded).toBeNull();
    });

    it('should return null for invalid data', () => {
      const invalidData = { name: 'Test', value: 'not-a-number' };
      window.localStorage.setItem('test-key', JSON.stringify(invalidData));

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const loaded = loadFromLocalStorage('test-key', TestSchema);
      expect(loaded).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should return null for malformed JSON', () => {
      window.localStorage.setItem('test-key', '{invalid json}');

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const loaded = loadFromLocalStorage('test-key', TestSchema);
      expect(loaded).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should validate complex schemas', () => {
      const ComplexSchema = z.object({
        user: z.object({
          name: z.string().min(1),
          age: z.number().min(0),
        }),
        items: z.array(z.string()),
      });

      const validData = {
        user: { name: 'Alice', age: 30 },
        items: ['a', 'b', 'c'],
      };
      window.localStorage.setItem('test-key', JSON.stringify(validData));

      const loaded = loadFromLocalStorage('test-key', ComplexSchema);
      expect(loaded).toEqual(validData);
    });
  });

  describe('removeFromLocalStorage', () => {
    it('should remove data from localStorage', () => {
      window.localStorage.setItem('test-key', 'test-value');
      expect(window.localStorage.getItem('test-key')).toBe('test-value');

      removeFromLocalStorage('test-key');
      expect(window.localStorage.getItem('test-key')).toBeNull();
    });

    it('should not throw on non-existent key', () => {
      expect(() => removeFromLocalStorage('non-existent')).not.toThrow();
    });
  });

  describe('clearAllLocalStorage', () => {
    it('should clear all app storage keys', () => {
      // Set multiple keys
      Object.values(STORAGE_KEYS).forEach((key) => {
        window.localStorage.setItem(key, 'test-value');
      });

      // Verify keys exist
      Object.values(STORAGE_KEYS).forEach((key) => {
        expect(window.localStorage.getItem(key)).toBe('test-value');
      });

      // Clear all
      clearAllLocalStorage();

      // Verify keys removed
      Object.values(STORAGE_KEYS).forEach((key) => {
        expect(window.localStorage.getItem(key)).toBeNull();
      });
    });

    it('should not affect other localStorage keys', () => {
      window.localStorage.setItem('other-app-key', 'should-remain');
      window.localStorage.setItem(STORAGE_KEYS.USER_PROFILE, 'should-clear');

      clearAllLocalStorage();

      expect(window.localStorage.getItem('other-app-key')).toBe(
        'should-remain'
      );
      expect(window.localStorage.getItem(STORAGE_KEYS.USER_PROFILE)).toBeNull();
    });
  });

  describe('isLocalStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });

    it('should return false when localStorage throws', () => {
      // Save original setItem
      const originalSetItem = window.localStorage.setItem.bind(window.localStorage);

      // Mock setItem to throw
      window.localStorage.setItem = vi.fn(() => {
        throw new Error('Not available');
      });

      expect(isLocalStorageAvailable()).toBe(false);

      // Restore original
      window.localStorage.setItem = originalSetItem;
    });
  });

  describe('STORAGE_KEYS', () => {
    it('should have all expected keys', () => {
      expect(STORAGE_KEYS.USER_PROFILE).toBe('spaces-game-user-profile');
      expect(STORAGE_KEYS.GAME_STATE).toBe('spaces-game-state');
    });
  });
});
