/**
 * Tests for useLocalStorage hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useLocalStorage } from './useLocalStorage';

// Test schema
const TestSchema = z.object({
  id: z.string(),
  name: z.string(),
  count: z.number(),
});

type TestData = z.infer<typeof TestSchema>;

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with initialValue when key does not exist', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', TestSchema, null)
    );

    expect(result.current[0]).toBeNull();
  });

  it('should initialize with existing value from localStorage', () => {
    const testData: TestData = { id: '1', name: 'Test', count: 42 };
    localStorage.setItem('test-key', JSON.stringify(testData));

    const { result } = renderHook(() =>
      useLocalStorage('test-key', TestSchema, null)
    );

    expect(result.current[0]).toEqual(testData);
  });

  it('should update both state and localStorage when setValue is called', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', TestSchema, null)
    );

    const newData: TestData = { id: '2', name: 'Updated', count: 100 };

    act(() => {
      result.current[1](newData);
    });

    expect(result.current[0]).toEqual(newData);
    expect(JSON.parse(localStorage.getItem('test-key') || 'null')).toEqual(
      newData
    );
  });

  it('should remove value when setValue is called with null', () => {
    const testData: TestData = { id: '1', name: 'Test', count: 42 };
    localStorage.setItem('test-key', JSON.stringify(testData));

    const { result } = renderHook(() =>
      useLocalStorage('test-key', TestSchema, null)
    );

    act(() => {
      result.current[1](null);
    });

    expect(result.current[0]).toBeNull();
    expect(localStorage.getItem('test-key')).toBeNull();
  });

  it('should remove value when removeValue is called', () => {
    const testData: TestData = { id: '1', name: 'Test', count: 42 };
    localStorage.setItem('test-key', JSON.stringify(testData));

    const { result } = renderHook(() =>
      useLocalStorage('test-key', TestSchema, null)
    );

    expect(result.current[0]).toEqual(testData);

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBeNull();
    expect(localStorage.getItem('test-key')).toBeNull();
  });

  it('should handle invalid data in localStorage', () => {
    localStorage.setItem('test-key', 'invalid-json');

    // Suppress console.error for this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useLocalStorage('test-key', TestSchema, null)
    );

    // Should fall back to initialValue
    expect(result.current[0]).toBeNull();

    consoleErrorSpy.mockRestore();
  });

  it('should handle data that fails schema validation', () => {
    localStorage.setItem(
      'test-key',
      JSON.stringify({ id: '1', name: 'Test' })
    ); // Missing 'count'

    // Suppress console.error for this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useLocalStorage('test-key', TestSchema, null)
    );

    // Should fall back to initialValue
    expect(result.current[0]).toBeNull();

    consoleErrorSpy.mockRestore();
  });

  it('should use custom initialValue', () => {
    const defaultData: TestData = { id: '0', name: 'Default', count: 0 };

    const { result } = renderHook(() =>
      useLocalStorage('test-key', TestSchema, defaultData)
    );

    expect(result.current[0]).toEqual(defaultData);
  });

  it('should sync state when storage event occurs (cross-tab)', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', TestSchema, null)
    );

    const newData: TestData = { id: '3', name: 'Synced', count: 200 };

    // Simulate storage event from another tab
    act(() => {
      localStorage.setItem('test-key', JSON.stringify(newData));
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'test-key',
          newValue: JSON.stringify(newData),
          oldValue: null,
          storageArea: localStorage,
        })
      );
    });

    expect(result.current[0]).toEqual(newData);
  });

  it('should sync state when storage event removes key', () => {
    const testData: TestData = { id: '1', name: 'Test', count: 42 };
    localStorage.setItem('test-key', JSON.stringify(testData));

    const { result } = renderHook(() =>
      useLocalStorage('test-key', TestSchema, null)
    );

    expect(result.current[0]).toEqual(testData);

    // Simulate storage event removing the key
    act(() => {
      localStorage.removeItem('test-key');
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'test-key',
          newValue: null,
          oldValue: JSON.stringify(testData),
          storageArea: localStorage,
        })
      );
    });

    expect(result.current[0]).toBeNull();
  });

  it('should ignore storage events for different keys', () => {
    const testData: TestData = { id: '1', name: 'Test', count: 42 };

    const { result } = renderHook(() =>
      useLocalStorage('test-key', TestSchema, testData)
    );

    // Simulate storage event for different key
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'other-key',
          newValue: JSON.stringify({ foo: 'bar' }),
          oldValue: null,
          storageArea: localStorage,
        })
      );
    });

    // Should not change
    expect(result.current[0]).toEqual(testData);
  });
});
