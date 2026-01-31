import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  generateAllBoards,
  estimateSearchSpace,
  generateBoardsWithCache,
  cacheExists,
  getCacheInfo,
} from '../board-generator.js';
import { validateBoard } from '../validation.js';
import fs from 'fs/promises';

describe('board-generator', () => {
  // Clean up cache files after tests
  const cacheFilesToClean: string[] = [];

  afterAll(async () => {
    for (const file of cacheFilesToClean) {
      try {
        await fs.unlink(file);
      } catch {
        // Ignore errors
      }
    }
  });

  describe('estimateSearchSpace', () => {
    it('should return reasonable estimates', () => {
      expect(estimateSearchSpace(2)).toBeGreaterThan(0);
      expect(estimateSearchSpace(3)).toBeGreaterThan(estimateSearchSpace(2));
      expect(estimateSearchSpace(4)).toBeGreaterThan(estimateSearchSpace(3));
      expect(estimateSearchSpace(5)).toBeGreaterThan(estimateSearchSpace(4));
    });

    it('should have exponential growth', () => {
      const size2 = estimateSearchSpace(2);
      const size3 = estimateSearchSpace(3);
      const size4 = estimateSearchSpace(4);

      // Growth should be exponential (rough check)
      const growth23 = size3 / size2;
      const growth34 = size4 / size3;

      expect(growth23).toBeGreaterThan(5); // At least 5x growth
      expect(growth34).toBeGreaterThan(5); // At least 5x growth
    });
  });

  describe('generateAllBoards', () => {
    it('should generate valid boards for size 2', () => {
      const boards = generateAllBoards(2, 50);

      expect(boards.length).toBeGreaterThan(0);
      expect(boards.length).toBeLessThanOrEqual(50);

      // All boards should be valid
      for (const board of boards) {
        const result = validateBoard(board);
        expect(result.valid).toBe(true);
      }
    });

    it('should generate boards with correct size', () => {
      const boards = generateAllBoards(2, 10);

      for (const board of boards) {
        expect(board.boardSize).toBe(2);
        expect(board.grid.length).toBe(2);
        expect(board.grid[0].length).toBe(2);
      }
    });

    it('should not have duplicate boards', () => {
      const boards = generateAllBoards(2, 50);

      // Convert boards to strings for comparison
      const boardStrings = boards.map(b => JSON.stringify(b.sequence));
      const uniqueBoardStrings = new Set(boardStrings);

      expect(uniqueBoardStrings.size).toBe(boards.length);
    });

    it('should respect limit parameter', () => {
      const limit = 5;
      const boards = generateAllBoards(3, limit);

      expect(boards.length).toBeLessThanOrEqual(limit);
    });

    it('should enforce movement rules (no backward movement)', () => {
      const boards = generateAllBoards(2, 50);

      for (const board of boards) {
        let currentRow = board.boardSize - 1; // Start at bottom

        for (const move of board.sequence) {
          if (move.type === 'piece') {
            // Piece should never move backward (increase row)
            expect(move.position.row).toBeLessThanOrEqual(currentRow);
            currentRow = move.position.row;
          }
        }
      }
    });

    it('should enforce trap rules (no traps behind piece)', () => {
      const boards = generateAllBoards(2, 50);

      for (const board of boards) {
        let currentRow = board.boardSize - 1; // Start at bottom

        for (const move of board.sequence) {
          if (move.type === 'piece') {
            currentRow = move.position.row;
          } else if (move.type === 'trap') {
            // Trap should never be behind current piece position
            expect(move.position.row).toBeLessThanOrEqual(currentRow);
          }
        }
      }
    });

    it('should enforce no revisit rule', () => {
      const boards = generateAllBoards(2, 50);

      for (const board of boards) {
        const visitedPieceCells = new Set<string>();

        for (const move of board.sequence) {
          if (move.type === 'piece' && move.position.row >= 0) {
            const cellKey = `${move.position.row},${move.position.col}`;

            // Cell should not have been visited before
            expect(visitedPieceCells.has(cellKey)).toBe(false);

            visitedPieceCells.add(cellKey);
          }
        }
      }
    });

    it('should ensure piece reaches goal after row 0', () => {
      const boards = generateAllBoards(2, 50);

      for (const board of boards) {
        let reachedRowZero = false;
        let foundGoal = false;

        for (let i = 0; i < board.sequence.length; i++) {
          const move = board.sequence[i];

          if (move.type === 'piece' && move.position.row === 0) {
            reachedRowZero = true;
          }

          if (reachedRowZero && move.type === 'piece' && i > 0) {
            const prevMove = board.sequence[i - 1];
            // After reaching row 0, next piece move should be to goal
            if (prevMove.type === 'piece' && prevMove.position.row === 0) {
              expect(move.position.row).toBe(-1); // Should be goal
              foundGoal = true;
            }
          }

          if (move.type === 'final') {
            foundGoal = true;
          }
        }

        // All boards should reach the goal
        expect(foundGoal).toBe(true);
      }
    });

    it('should not place traps at row 0', () => {
      const boards = generateAllBoards(2, 50);

      for (const board of boards) {
        for (const move of board.sequence) {
          if (move.type === 'trap') {
            // No traps should be at row 0
            expect(move.position.row).toBeGreaterThan(0);
          }
        }
      }
    });

    it('should enforce supermove followed by piece movement', () => {
      const boards = generateAllBoards(2, 50);

      for (const board of boards) {
        for (let i = 0; i < board.sequence.length - 1; i++) {
          const move = board.sequence[i];
          const nextMove = board.sequence[i + 1];

          // Find if this is a supermove (trap at piece position)
          if (move.type === 'trap' && i > 0) {
            const prevMove = board.sequence[i - 1];
            if (prevMove.type === 'piece') {
              const isSuperMove =
                move.position.row === prevMove.position.row &&
                move.position.col === prevMove.position.col;

              if (isSuperMove) {
                // Next move MUST be a piece movement
                expect(nextMove.type).toBe('piece');
              }
            }
          }
        }
      }
    });

    it('should generate boards starting from different columns', () => {
      // Generate boards for size 2 which should be fast enough to cover all starting positions
      const boards = generateAllBoards(2, 100);

      // Should have boards starting from each column
      const startingColumns = new Set<number>();
      for (const board of boards) {
        const firstMove = board.sequence[0];
        startingColumns.add(firstMove.position.col);
      }

      // For size 2, we should see starts from both columns (0 and 1)
      expect(startingColumns.size).toBeGreaterThanOrEqual(2);
    });

    it('should handle progress callback', () => {
      const progressUpdates: number[] = [];

      generateAllBoards(2, 100, (count) => {
        progressUpdates.push(count);
      });

      // Should have received some progress updates
      // (only if more than 50 boards were generated)
      if (progressUpdates.length > 0) {
        expect(progressUpdates[0]).toBeGreaterThanOrEqual(50);
      }
    });
  });

  describe('caching', () => {
    it('should save and load from cache', async () => {
      const size = 2;
      const limit = 10;
      cacheFilesToClean.push(`/tmp/spaces-game-boards-size-${size}-limit-${limit}.json`);

      // Generate and cache
      const boards1 = await generateBoardsWithCache(size, limit, true);
      expect(boards1.length).toBeGreaterThan(0);

      // Check cache exists
      const exists = await cacheExists(size, limit);
      expect(exists).toBe(true);

      // Load from cache
      const boards2 = await generateBoardsWithCache(size, limit, false);
      expect(boards2.length).toBe(boards1.length);

      // Should be identical
      expect(JSON.stringify(boards2)).toBe(JSON.stringify(boards1));
    });

    it('should return cache info', async () => {
      const size = 2;
      const limit = 15;
      cacheFilesToClean.push(`/tmp/spaces-game-boards-size-${size}-limit-${limit}.json`);

      // Generate and cache
      await generateBoardsWithCache(size, limit, true);

      // Get cache info
      const info = await getCacheInfo(size, limit);
      expect(info).not.toBeNull();
      expect(info?.size).toBe(size);
      expect(info?.limit).toBe(limit);
      expect(info?.count).toBeGreaterThan(0);
      expect(info?.timestamp).toBeDefined();
      expect(info?.boards).toBeDefined();
    });

    it('should respect force flag', async () => {
      const size = 2;
      const limit = 20;
      cacheFilesToClean.push(`/tmp/spaces-game-boards-size-${size}-limit-${limit}.json`);

      // Generate and cache
      const boards1 = await generateBoardsWithCache(size, limit, true);

      // Get initial cache timestamp
      const info1 = await getCacheInfo(size, limit);
      const timestamp1 = info1?.timestamp;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      // Force regenerate
      const boards2 = await generateBoardsWithCache(size, limit, true);

      // Get new cache timestamp
      const info2 = await getCacheInfo(size, limit);
      const timestamp2 = info2?.timestamp;

      // Timestamps should be different
      expect(timestamp2).not.toBe(timestamp1);
    });

    it('should return null for non-existent cache', async () => {
      const size = 99;
      const limit = 999;

      const info = await getCacheInfo(size, limit);
      expect(info).toBeNull();

      const exists = await cacheExists(size, limit);
      expect(exists).toBe(false);
    });
  });

  describe('integration tests', () => {
    it('should generate multiple valid boards for size 2', () => {
      const boards = generateAllBoards(2, 30);

      expect(boards.length).toBeGreaterThan(5);

      // All should be valid
      for (const board of boards) {
        const result = validateBoard(board);
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
      }
    });

    it('should generate at least some boards for size 3', () => {
      const boards = generateAllBoards(3, 50);

      expect(boards.length).toBeGreaterThan(0);

      // Sample check a few boards
      const samplesToCheck = Math.min(10, boards.length);
      for (let i = 0; i < samplesToCheck; i++) {
        const board = boards[i];
        const result = validateBoard(board);
        expect(result.valid).toBe(true);
      }
    });
  });
});
