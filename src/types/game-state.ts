/**
 * Game state types - uses discriminated unions for type-safe phases
 */

import type { Board } from './board';
import type { Opponent } from './opponent';
import type { UserProfile } from './user';
import type { Deck, GameMode } from './deck';

/**
 * Round result after simulation
 */
export type RoundResult = {
  round: number;
  winner: 'player' | 'opponent' | 'tie';
  playerBoard: Board;
  opponentBoard: Board;
  playerFinalPosition: { row: number; col: number };
  opponentFinalPosition: { row: number; col: number };
  playerPoints?: number; // Optional for backward compatibility
  opponentPoints?: number; // Optional for backward compatibility
  playerOutcome?: 'won' | 'lost' | 'tie'; // Optional for backward compatibility
  simulationDetails?: {
    playerMoves: number;
    opponentMoves: number;
    playerHitTrap: boolean;
    opponentHitTrap: boolean;
  };
};

/**
 * Game phases using discriminated unions for type safety
 * Compiler enforces correct props for each phase
 */
export type GamePhase =
  | { type: 'user-setup' }
  | { type: 'board-management' }
  | { type: 'game-mode-selection' } // Choose round-by-round or deck mode
  | { type: 'opponent-selection'; gameMode: GameMode } // Pass game mode
  | { type: 'deck-management' } // Create/manage decks
  | { type: 'deck-selection' } // Select deck to play
  | { type: 'board-selection'; round: number } // Round-by-round mode
  | { type: 'waiting-for-opponent'; round: number }
  | { type: 'round-results'; round: number; result: RoundResult } // Single round result
  | { type: 'all-rounds-results'; results: RoundResult[] } // All 10 rounds at once
  | { type: 'game-over'; winner: 'player' | 'opponent' | 'tie' };

/**
 * Complete game state - NEVER use partial updates
 * Always return the entire state object
 */
export type GameState = {
  // Current phase
  phase: GamePhase;

  // User and opponent
  user: UserProfile;
  opponent: Opponent | null;

  // Game mode
  gameMode: GameMode | null; // null until selected

  // Game progress
  currentRound: number; // 1-8 or 1-10 depending on mode
  playerScore: number;
  opponentScore: number;

  // Board selections for current round (round-by-round mode)
  playerSelectedBoard: Board | null;
  opponentSelectedBoard: Board | null;

  // Deck selections (deck mode)
  playerSelectedDeck: Deck | null;
  opponentSelectedDeck: Deck | null;

  // Round history
  roundHistory: RoundResult[];

  // Validation
  checksum: string; // For state integrity validation
};

/**
 * URL payload types for hash fragment communication
 */
export type UrlPayload =
  | { type: 'delta'; changes: Partial<GameState> }
  | { type: 'full_state'; state: GameState }
  | { type: 'resync_request'; requestId: string };
