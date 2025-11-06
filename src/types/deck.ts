/**
 * Deck-related types for 10-round gameplay
 */

import type { Board } from './board';

/**
 * Deck is a sequence of 10 boards for quick gameplay
 * Boards can be reused in a deck
 */
export type Deck = {
  id: string; // UUID
  name: string;
  boards: Board[]; // Exactly 10 boards (can contain duplicates)
  createdAt: number; // timestamp
};

/**
 * Game mode selection
 */
export type GameMode = 'round-by-round' | 'deck';
