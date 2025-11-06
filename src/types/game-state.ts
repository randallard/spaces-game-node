/**
 * Game state types - uses discriminated unions for type-safe phases
 */

import type { Board } from './board';
import type { Opponent } from './opponent';
import type { UserProfile } from './user';

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
  | { type: 'opponent-selection' }
  | { type: 'board-selection'; round: number }
  | { type: 'waiting-for-opponent'; round: number }
  | { type: 'round-results'; round: number; result: RoundResult }
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

  // Game progress
  currentRound: number; // 1-8
  playerScore: number;
  opponentScore: number;

  // Board selections for current round
  playerSelectedBoard: Board | null;
  opponentSelectedBoard: Board | null;

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
