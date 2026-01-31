import fs from 'fs/promises';
import path from 'path';
import type { Board } from '../../src/types/board.js';

/**
 * Board with metadata for collections
 */
export type BoardWithMetadata = Board & {
  index: number;
  name?: string;
  tags?: string[];
  createdAt: string;
};

/**
 * Board collection file format
 */
export type BoardCollection = {
  name?: string;
  description?: string;
  createdAt: string;
  boards: BoardWithMetadata[];
};

/**
 * Load a board collection from file
 *
 * @param filePath - Path to collection file
 * @returns Board collection
 * @throws Error if file not found or invalid JSON
 */
export async function loadCollection(filePath: string): Promise<BoardCollection> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const collection = JSON.parse(content) as BoardCollection;

    // Validate structure
    if (!collection.boards || !Array.isArray(collection.boards)) {
      throw new Error('Invalid collection format: missing boards array');
    }

    return collection;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Collection file not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Save a board collection to file
 *
 * @param filePath - Path to save collection
 * @param collection - Board collection to save
 */
export async function saveCollection(filePath: string, collection: BoardCollection): Promise<void> {
  // Ensure directory exists
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  // Write file with pretty formatting
  const content = JSON.stringify(collection, null, 2);
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Get a board by index from collection
 *
 * @param collection - Board collection
 * @param index - Board index
 * @returns Board with metadata, or null if not found
 */
export function getBoardByIndex(collection: BoardCollection, index: number): BoardWithMetadata | null {
  return collection.boards.find(b => b.index === index) || null;
}

/**
 * Find duplicate board in collection (exact sequence match)
 *
 * @param collection - Board collection
 * @param board - Board to check
 * @returns Index of duplicate board, or -1 if not found
 */
export function findDuplicateBoard(collection: BoardCollection, board: Board): number {
  // Compare sequences for exact match
  for (const existing of collection.boards) {
    if (existing.boardSize !== board.boardSize) continue;
    if (existing.sequence.length !== board.sequence.length) continue;

    // Check if sequences are identical
    const isIdentical = existing.sequence.every((move, i) => {
      const other = board.sequence[i];
      return (
        move.order === other.order &&
        move.type === other.type &&
        move.position.row === other.position.row &&
        move.position.col === other.position.col
      );
    });

    if (isIdentical) {
      return existing.index;
    }
  }

  return -1;
}

/**
 * Create a new board collection
 *
 * @param filePath - Path to create collection
 * @param name - Optional collection name
 * @param description - Optional description
 * @returns Empty board collection
 */
export async function createCollection(
  filePath: string,
  name?: string,
  description?: string
): Promise<BoardCollection> {
  // Check if file already exists
  try {
    await fs.access(filePath);
    throw new Error(`Collection file already exists: ${filePath}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  const collection: BoardCollection = {
    name,
    description,
    createdAt: new Date().toISOString(),
    boards: [],
  };

  await saveCollection(filePath, collection);
  return collection;
}

/**
 * Add a board to an existing collection
 *
 * @param filePath - Path to collection file
 * @param board - Board to add
 * @param metadata - Optional metadata (name, tags)
 * @returns Updated collection
 */
export async function addBoardToCollection(
  filePath: string,
  board: Board,
  metadata?: { name?: string; tags?: string[] }
): Promise<BoardCollection> {
  const collection = await loadCollection(filePath);

  // Get next index
  const nextIndex = collection.boards.length > 0
    ? Math.max(...collection.boards.map(b => b.index)) + 1
    : 0;

  // Create board with metadata
  const boardWithMetadata: BoardWithMetadata = {
    ...board,
    index: nextIndex,
    name: metadata?.name,
    tags: metadata?.tags,
    createdAt: new Date().toISOString(),
  };

  collection.boards.push(boardWithMetadata);

  await saveCollection(filePath, collection);
  return collection;
}

/**
 * Check if a file exists
 *
 * @param filePath - Path to check
 * @returns True if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Session file format
 */
export type SessionTest = {
  testNumber: number;
  timestamp: string;
  playerBoard: Board;
  opponentBoard: Board;
  result: {
    winner: 'player' | 'opponent' | 'tie';
    playerScore: number;
    opponentScore: number;
    playerFinalPosition: { row: number; col: number };
    opponentFinalPosition: { row: number; col: number };
    collision: boolean;
  };
  expected?: string;
  passed?: boolean;
  notes?: string;
};

export type Session = {
  id: string;
  name?: string;
  tags?: string[];
  startTime: string;
  tests: SessionTest[];
};

/**
 * Create a new session file
 *
 * @param name - Optional session name
 * @param tags - Optional tags
 * @returns Session with generated ID
 */
export async function createSession(name?: string, tags?: string[]): Promise<Session> {
  // Generate timestamp-based ID
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const id = `session-${timestamp}`;

  const session: Session = {
    id,
    name,
    tags,
    startTime: new Date().toISOString(),
    tests: [],
  };

  // Create sessions directory if it doesn't exist
  const sessionsDir = path.join(process.cwd(), 'test-sessions');
  await fs.mkdir(sessionsDir, { recursive: true });

  // Save initial session file
  const filePath = path.join(sessionsDir, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');

  return session;
}

/**
 * Load a session by ID
 *
 * @param sessionId - Session ID
 * @returns Session data
 */
export async function loadSession(sessionId: string): Promise<Session> {
  const sessionsDir = path.join(process.cwd(), 'test-sessions');
  const filePath = path.join(sessionsDir, `${sessionId}.json`);

  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as Session;
}

/**
 * Save test to session (incremental save)
 *
 * @param sessionId - Session ID
 * @param test - Test data to append
 */
export async function saveTestToSession(sessionId: string, test: SessionTest): Promise<void> {
  const session = await loadSession(sessionId);
  session.tests.push(test);

  const sessionsDir = path.join(process.cwd(), 'test-sessions');
  const filePath = path.join(sessionsDir, `${sessionId}.json`);
  await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
}

/**
 * Update session metadata
 *
 * @param sessionId - Session ID
 * @param metadata - Metadata to update
 */
export async function updateSessionMetadata(
  sessionId: string,
  metadata: { name?: string; tags?: string[] }
): Promise<void> {
  const session = await loadSession(sessionId);

  if (metadata.name !== undefined) {
    session.name = metadata.name;
  }
  if (metadata.tags !== undefined) {
    session.tags = metadata.tags;
  }

  const sessionsDir = path.join(process.cwd(), 'test-sessions');
  const filePath = path.join(sessionsDir, `${sessionId}.json`);
  await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
}

/**
 * Delete a session file
 *
 * @param sessionId - Session ID
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const sessionsDir = path.join(process.cwd(), 'test-sessions');
  const filePath = path.join(sessionsDir, `${sessionId}.json`);
  await fs.unlink(filePath);
}

/**
 * List all sessions
 *
 * @returns Array of session metadata
 */
export async function listSessions(): Promise<Array<{ id: string; name?: string; tags?: string[]; testCount: number; startTime: string }>> {
  const sessionsDir = path.join(process.cwd(), 'test-sessions');

  try {
    const files = await fs.readdir(sessionsDir);
    const sessions = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(sessionsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const session = JSON.parse(content) as Session;

      sessions.push({
        id: session.id,
        name: session.name,
        tags: session.tags,
        testCount: session.tests.length,
        startTime: session.startTime,
      });
    }

    // Sort by start time (newest first)
    sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return sessions;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}
