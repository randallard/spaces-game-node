/**
 * Tests for board types and utilities
 */

import { describe, it, expect } from 'vitest';
import { isValidBoardSize, MIN_BOARD_SIZE, MAX_BOARD_SIZE } from './board';

describe('isValidBoardSize', () => {
  it('should accept valid board sizes within range', () => {
    expect(isValidBoardSize(2)).toBe(true);
    expect(isValidBoardSize(3)).toBe(true);
    expect(isValidBoardSize(4)).toBe(true);
    expect(isValidBoardSize(10)).toBe(true);
    expect(isValidBoardSize(50)).toBe(true);
    expect(isValidBoardSize(99)).toBe(true);
  });

  it('should accept MIN_BOARD_SIZE', () => {
    expect(isValidBoardSize(MIN_BOARD_SIZE)).toBe(true);
  });

  it('should accept MAX_BOARD_SIZE', () => {
    expect(isValidBoardSize(MAX_BOARD_SIZE)).toBe(true);
  });

  it('should reject sizes below MIN_BOARD_SIZE', () => {
    expect(isValidBoardSize(1)).toBe(false);
    expect(isValidBoardSize(0)).toBe(false);
    expect(isValidBoardSize(-1)).toBe(false);
    expect(isValidBoardSize(-100)).toBe(false);
  });

  it('should reject sizes above MAX_BOARD_SIZE', () => {
    expect(isValidBoardSize(100)).toBe(false);
    expect(isValidBoardSize(101)).toBe(false);
    expect(isValidBoardSize(1000)).toBe(false);
  });

  it('should reject non-integer values', () => {
    expect(isValidBoardSize(2.5)).toBe(false);
    expect(isValidBoardSize(3.1)).toBe(false);
    expect(isValidBoardSize(3.9)).toBe(false);
    expect(isValidBoardSize(Math.PI)).toBe(false);
  });

  it('should reject NaN', () => {
    expect(isValidBoardSize(NaN)).toBe(false);
  });

  it('should reject Infinity', () => {
    expect(isValidBoardSize(Infinity)).toBe(false);
    expect(isValidBoardSize(-Infinity)).toBe(false);
  });
});

describe('Board size constants', () => {
  it('should have MIN_BOARD_SIZE of 2', () => {
    expect(MIN_BOARD_SIZE).toBe(2);
  });

  it('should have MAX_BOARD_SIZE of 99', () => {
    expect(MAX_BOARD_SIZE).toBe(99);
  });

  it('should have MIN_BOARD_SIZE less than MAX_BOARD_SIZE', () => {
    expect(MIN_BOARD_SIZE).toBeLessThan(MAX_BOARD_SIZE);
  });
});
