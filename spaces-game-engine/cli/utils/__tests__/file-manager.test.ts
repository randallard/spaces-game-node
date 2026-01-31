import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import {
  loadCollection,
  saveCollection,
  getBoardByIndex,
  findDuplicateBoard,
  createCollection,
  addBoardToCollection,
  fileExists,
  createSession,
  loadSession,
  saveTestToSession,
  updateSessionMetadata,
  deleteSession,
  listSessions,
  type BoardCollection,
} from '../file-manager.js';
import type { Board } from '../../../src/types/board.js';

const TEST_DIR = path.join(process.cwd(), 'test-temp');
const TEST_SESSIONS_DIR = path.join(TEST_DIR, 'test-sessions');

describe('file-manager', () => {
  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(TEST_DIR, { recursive: true });
    await fs.mkdir(TEST_SESSIONS_DIR, { recursive: true });

    // Override process.cwd for session tests
    const originalCwd = process.cwd;
    process.cwd = () => TEST_DIR;
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  });

  describe('Board Collections', () => {
    const testBoard: Board = {
      boardSize: 2,
      grid: [
        ['piece', 'empty'],
        ['empty', 'piece'],
      ],
      sequence: [
        { position: { row: 1, col: 1 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 1 }, type: 'piece', order: 2 },
        { position: { row: -1, col: 1 }, type: 'final', order: 3 },
      ],
    };

    describe('saveCollection and loadCollection', () => {
      it('should save and load a collection', async () => {
        const filePath = path.join(TEST_DIR, 'test-collection.json');
        const collection: BoardCollection = {
          name: 'Test Collection',
          createdAt: new Date().toISOString(),
          boards: [],
        };

        await saveCollection(filePath, collection);
        const loaded = await loadCollection(filePath);

        expect(loaded.name).toBe('Test Collection');
        expect(loaded.boards).toEqual([]);
      });

      it('should throw error for non-existent file', async () => {
        const filePath = path.join(TEST_DIR, 'non-existent.json');
        await expect(loadCollection(filePath)).rejects.toThrow('Collection file not found');
      });

      it('should create parent directory if needed', async () => {
        const filePath = path.join(TEST_DIR, 'nested', 'dir', 'collection.json');
        const collection: BoardCollection = {
          createdAt: new Date().toISOString(),
          boards: [],
        };

        await saveCollection(filePath, collection);
        const loaded = await loadCollection(filePath);

        expect(loaded.boards).toEqual([]);
      });
    });

    describe('createCollection', () => {
      it('should create a new collection file', async () => {
        const filePath = path.join(TEST_DIR, 'new-collection.json');
        const collection = await createCollection(filePath, 'My Collection', 'Test description');

        expect(collection.name).toBe('My Collection');
        expect(collection.description).toBe('Test description');
        expect(collection.boards).toEqual([]);

        // Verify file was created
        const exists = await fileExists(filePath);
        expect(exists).toBe(true);
      });

      it('should throw error if file already exists', async () => {
        const filePath = path.join(TEST_DIR, 'existing.json');
        await createCollection(filePath);

        await expect(createCollection(filePath)).rejects.toThrow('already exists');
      });

      it('should work without name and description', async () => {
        const filePath = path.join(TEST_DIR, 'minimal.json');
        const collection = await createCollection(filePath);

        expect(collection.name).toBeUndefined();
        expect(collection.description).toBeUndefined();
        expect(collection.boards).toEqual([]);
      });
    });

    describe('addBoardToCollection', () => {
      it('should add board to empty collection', async () => {
        const filePath = path.join(TEST_DIR, 'boards.json');
        await createCollection(filePath);

        const updated = await addBoardToCollection(filePath, testBoard, {
          name: 'Test Board',
          tags: ['test'],
        });

        expect(updated.boards).toHaveLength(1);
        expect(updated.boards[0].index).toBe(0);
        expect(updated.boards[0].name).toBe('Test Board');
        expect(updated.boards[0].tags).toEqual(['test']);
      });

      it('should increment index when adding multiple boards', async () => {
        const filePath = path.join(TEST_DIR, 'boards.json');
        await createCollection(filePath);

        await addBoardToCollection(filePath, testBoard);
        const updated = await addBoardToCollection(filePath, testBoard);

        expect(updated.boards).toHaveLength(2);
        expect(updated.boards[0].index).toBe(0);
        expect(updated.boards[1].index).toBe(1);
      });

      it('should work without metadata', async () => {
        const filePath = path.join(TEST_DIR, 'boards.json');
        await createCollection(filePath);

        const updated = await addBoardToCollection(filePath, testBoard);

        expect(updated.boards).toHaveLength(1);
        expect(updated.boards[0].name).toBeUndefined();
        expect(updated.boards[0].tags).toBeUndefined();
      });
    });

    describe('getBoardByIndex', () => {
      it('should get board by index', async () => {
        const filePath = path.join(TEST_DIR, 'boards.json');
        await createCollection(filePath);
        const collection = await addBoardToCollection(filePath, testBoard, { name: 'Board 0' });

        const board = getBoardByIndex(collection, 0);

        expect(board).toBeDefined();
        expect(board?.name).toBe('Board 0');
      });

      it('should return null for non-existent index', async () => {
        const filePath = path.join(TEST_DIR, 'boards.json');
        const collection = await createCollection(filePath);

        const board = getBoardByIndex(collection, 99);

        expect(board).toBeNull();
      });
    });

    describe('findDuplicateBoard', () => {
      it('should find exact duplicate board', async () => {
        const filePath = path.join(TEST_DIR, 'boards.json');
        await createCollection(filePath);
        const collection = await addBoardToCollection(filePath, testBoard);

        const duplicateIndex = findDuplicateBoard(collection, testBoard);

        expect(duplicateIndex).toBe(0);
      });

      it('should return -1 for non-duplicate board', async () => {
        const filePath = path.join(TEST_DIR, 'boards.json');
        await createCollection(filePath);
        const collection = await addBoardToCollection(filePath, testBoard);

        const differentBoard: Board = {
          ...testBoard,
          sequence: [
            { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
            { position: { row: 0, col: 0 }, type: 'piece', order: 2 },
            { position: { row: -1, col: 0 }, type: 'final', order: 3 },
          ],
        };

        const duplicateIndex = findDuplicateBoard(collection, differentBoard);

        expect(duplicateIndex).toBe(-1);
      });

      it('should return -1 for empty collection', async () => {
        const filePath = path.join(TEST_DIR, 'boards.json');
        const collection = await createCollection(filePath);

        const duplicateIndex = findDuplicateBoard(collection, testBoard);

        expect(duplicateIndex).toBe(-1);
      });

      it('should not match boards with different size', async () => {
        const filePath = path.join(TEST_DIR, 'boards.json');
        await createCollection(filePath);
        const collection = await addBoardToCollection(filePath, testBoard);

        const differentSizeBoard: Board = {
          ...testBoard,
          boardSize: 3,
        };

        const duplicateIndex = findDuplicateBoard(collection, differentSizeBoard);

        expect(duplicateIndex).toBe(-1);
      });
    });

    describe('fileExists', () => {
      it('should return true for existing file', async () => {
        const filePath = path.join(TEST_DIR, 'exists.json');
        await fs.writeFile(filePath, '{}', 'utf-8');

        const exists = await fileExists(filePath);

        expect(exists).toBe(true);
      });

      it('should return false for non-existent file', async () => {
        const filePath = path.join(TEST_DIR, 'does-not-exist.json');

        const exists = await fileExists(filePath);

        expect(exists).toBe(false);
      });
    });
  });

  describe('Sessions', () => {
    describe('createSession and loadSession', () => {
      it('should create and load a session', async () => {
        const session = await createSession('Test Session', ['tag1', 'tag2']);

        expect(session.name).toBe('Test Session');
        expect(session.tags).toEqual(['tag1', 'tag2']);
        expect(session.tests).toEqual([]);
        expect(session.id).toMatch(/^session-/);

        const loaded = await loadSession(session.id);

        expect(loaded.id).toBe(session.id);
        expect(loaded.name).toBe('Test Session');
      });

      it('should work without name and tags', async () => {
        const session = await createSession();

        expect(session.name).toBeUndefined();
        expect(session.tags).toBeUndefined();
        expect(session.tests).toEqual([]);
      });

      it('should create sessions directory if it does not exist', async () => {
        // Remove sessions directory
        await fs.rm(TEST_SESSIONS_DIR, { recursive: true, force: true });

        const session = await createSession();

        // Should not throw and directory should be created
        const dirExists = await fileExists(TEST_SESSIONS_DIR);
        expect(dirExists).toBe(true);
      });
    });

    describe('saveTestToSession', () => {
      it('should append test to session', async () => {
        const session = await createSession();

        const testData = {
          testNumber: 1,
          timestamp: new Date().toISOString(),
          playerBoard: {
            boardSize: 2,
            grid: [['piece', 'empty'], ['empty', 'piece']],
            sequence: [
              { position: { row: 1, col: 1 }, type: 'piece' as const, order: 1 },
            ],
          },
          opponentBoard: {
            boardSize: 2,
            grid: [['piece', 'empty'], ['empty', 'piece']],
            sequence: [
              { position: { row: 1, col: 0 }, type: 'piece' as const, order: 1 },
            ],
          },
          result: {
            winner: 'player' as const,
            playerScore: 100,
            opponentScore: 0,
            playerFinalPosition: { row: -1, col: 1 },
            opponentFinalPosition: { row: 0, col: 0 },
            collision: false,
          },
        };

        await saveTestToSession(session.id, testData);

        const loaded = await loadSession(session.id);

        expect(loaded.tests).toHaveLength(1);
        expect(loaded.tests[0].testNumber).toBe(1);
      });
    });

    describe('updateSessionMetadata', () => {
      it('should update session name and tags', async () => {
        const session = await createSession();

        await updateSessionMetadata(session.id, {
          name: 'Updated Name',
          tags: ['new-tag'],
        });

        const loaded = await loadSession(session.id);

        expect(loaded.name).toBe('Updated Name');
        expect(loaded.tags).toEqual(['new-tag']);
      });

      it('should update only name', async () => {
        const session = await createSession('Original', ['tag']);

        await updateSessionMetadata(session.id, { name: 'New Name' });

        const loaded = await loadSession(session.id);

        expect(loaded.name).toBe('New Name');
        expect(loaded.tags).toEqual(['tag']); // Unchanged
      });
    });

    describe('deleteSession', () => {
      it('should delete session file', async () => {
        const session = await createSession();
        const filePath = path.join(TEST_SESSIONS_DIR, `${session.id}.json`);

        expect(await fileExists(filePath)).toBe(true);

        await deleteSession(session.id);

        expect(await fileExists(filePath)).toBe(false);
      });
    });

    describe('listSessions', () => {
      it('should list all sessions', async () => {
        await createSession('Session 1', ['tag1']);
        await new Promise(resolve => setTimeout(resolve, 50));
        await createSession('Session 2', ['tag2']);

        const sessions = await listSessions();

        expect(sessions).toHaveLength(2);
        expect(sessions[0].name).toBeDefined();
        expect(sessions[0].testCount).toBe(0);
      });

      it('should return empty array if no sessions', async () => {
        const sessions = await listSessions();

        expect(sessions).toEqual([]);
      });

      it('should sort by start time (newest first)', async () => {
        const session1 = await createSession('First');
        // Wait a bit to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 100));
        const session2 = await createSession('Second');

        const sessions = await listSessions();

        expect(sessions).toHaveLength(2);
        expect(sessions[0].id).toBe(session2.id); // Newest first
        expect(sessions[1].id).toBe(session1.id);
      });
    });
  });
});
