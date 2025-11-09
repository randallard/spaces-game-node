/**
 * Game state types - uses discriminated unions for type-safe phases
 */

import type { Board } from './board';
import type { Opponent } from './opponent';
import type { UserProfile } from './user';
import type { Deck, GameMode } from './deck';
import type { CreatureId, OutcomeType } from './creature';

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
    playerLastStep: number; // Last sequence step executed by player (-1 if none)
    opponentLastStep: number; // Last sequence step executed by opponent (-1 if none)
  };
  // Creature graphics info (optional for backward compatibility)
  playerCreature?: CreatureId;
  opponentCreature?: CreatureId;
  playerVisualOutcome?: OutcomeType;
  opponentVisualOutcome?: OutcomeType;
  collision?: boolean;
};

/**
 * Game phases using discriminated unions for type safety
 * Compiler enforces correct props for each phase
 */
export type GamePhase =
  | { type: 'user-setup' }
  | { type: 'tutorial-intro' } // Tutorial: Introduction + creature selection
  | { type: 'tutorial-board-creation'; playerCreature: CreatureId; cpuSamData: { name: string; creature: CreatureId } }
  | { type: 'tutorial-results'; result: RoundResult; playerBoard: Board }
  | { type: 'tutorial-name-entry'; playerCreature: CreatureId; opponentCreature: CreatureId; firstBoard: Board; playerWon: boolean; cpuSamName: string }
  | { type: 'board-management' }
  | { type: 'game-mode-selection' } // Choose round-by-round or deck mode
  | { type: 'board-size-selection'; gameMode: GameMode } // Choose 2x2 or 3x3
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

  // Board size for this game (2x2 or 3x3)
  boardSize: 2 | 3 | null; // null until selected

  // Game progress
  currentRound: number; // 1-5 for round-by-round, 1-10 for deck mode
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
