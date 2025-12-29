/**
 * Data migration utilities for handling schema changes
 * @module utils/data-migrations
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Migrate a board object to add missing boardSize field
 * All boards created before boardSize field should default to 2x2
 */
function migrateBoardAddSize(board: any): any {
  if (!board || typeof board !== 'object') {
    return board;
  }

  // If boardSize is already present and valid, no migration needed
  if ('boardSize' in board && typeof board.boardSize === 'number' &&
      board.boardSize >= 2 && board.boardSize <= 99) {
    return board;
  }

  // Add boardSize based on grid dimensions (or default to 2 for safety)
  const gridSize = Array.isArray(board.grid) ? board.grid.length : 2;

  // Ensure the gridSize is within valid range (2-99)
  const validSize = Math.max(2, Math.min(99, gridSize));

  console.log('[Migration] Board:', board.id, 'Grid length:', gridSize, 'Setting boardSize to:', validSize);

  return {
    ...board,
    boardSize: validSize,
  };
}

/**
 * Migrate a board object to clear stored thumbnail
 * Thumbnails are now generated on-demand to save storage space
 */
function migrateBoardClearThumbnail(board: any): any {
  if (!board || typeof board !== 'object') {
    return board;
  }

  // Clear thumbnail if it exists
  if ('thumbnail' in board) {
    return {
      ...board,
      thumbnail: '',
    };
  }

  return board;
}

/**
 * Migrate a board to ensure it has a valid UUID
 */
function migrateBoardId(board: any): any {
  if (!board || typeof board !== 'object') {
    return board;
  }

  // Check if ID is a valid UUID format
  const isValidUuid = typeof board.id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(board.id);

  if (!isValidUuid) {
    console.log('[Migration] Board has invalid UUID, generating new one:', board.id);
    return {
      ...board,
      id: uuidv4(),
    };
  }

  return board;
}

/**
 * Apply all board migrations
 */
function migrateBoard(board: any): any {
  let migrated = board;
  migrated = migrateBoardId(migrated);
  migrated = migrateBoardAddSize(migrated);
  migrated = migrateBoardClearThumbnail(migrated);
  return migrated;
}

/**
 * Migrate user profile data to add missing boardSize to boards
 */
export function migrateUserProfile(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Migrate boards array if it exists
  if (Array.isArray(data.boards)) {
    return {
      ...data,
      boards: data.boards.map(migrateBoard),
    };
  }

  return data;
}

/**
 * Migrate game state data to add missing boardSize to boards in decks
 */
export function migrateGameState(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const migrated = { ...data };

  // Migrate player decks
  if (Array.isArray(migrated.playerDecks)) {
    migrated.playerDecks = migrated.playerDecks.map((deck: any) => {
      if (!deck || typeof deck !== 'object') {
        return deck;
      }
      return {
        ...deck,
        boards: Array.isArray(deck.boards)
          ? deck.boards.map(migrateBoard)
          : deck.boards,
      };
    });
  }

  // Migrate opponent decks
  if (Array.isArray(migrated.opponentDecks)) {
    migrated.opponentDecks = migrated.opponentDecks.map((deck: any) => {
      if (!deck || typeof deck !== 'object') {
        return deck;
      }
      return {
        ...deck,
        boards: Array.isArray(deck.boards)
          ? deck.boards.map(migrateBoard)
          : deck.boards,
      };
    });
  }

  return migrated;
}

/**
 * Migrate boards array directly
 */
export function migrateBoards(boards: any): any {
  if (!Array.isArray(boards)) {
    return boards;
  }

  return boards.map(migrateBoard);
}

/**
 * Migrate a deck to ensure it has a valid UUID
 */
function migrateDeckId(deck: any): any {
  if (!deck || typeof deck !== 'object') {
    return deck;
  }

  // Check if ID is a valid UUID format
  const isValidUuid = typeof deck.id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deck.id);

  if (!isValidUuid) {
    console.log('[Migration] Deck has invalid UUID, generating new one:', deck.id);
    return {
      ...deck,
      id: uuidv4(),
    };
  }

  return deck;
}

/**
 * Migrate decks array to add missing boardSize to boards in each deck
 * and ensure all decks have valid UUIDs
 */
export function migrateDecks(data: any): any {
  if (!Array.isArray(data)) {
    return data;
  }

  return data.map((deck: any) => {
    if (!deck || typeof deck !== 'object') {
      return deck;
    }

    // First migrate the deck ID
    let migrated = migrateDeckId(deck);

    // Then migrate boards
    migrated = {
      ...migrated,
      boards: Array.isArray(migrated.boards)
        ? migrated.boards.map(migrateBoard)
        : migrated.boards,
    };

    return migrated;
  });
}
