/**
 * User profile types
 */

import type { Board } from './board';
import type { Opponent } from './opponent';
import type { CreatureId } from './creature';

export type UserStats = {
  totalGames: number;
  wins: number;
  losses: number;
  ties: number;
};

export type UserPreferences = {
  showCompleteRoundResults?: boolean | undefined; // Default to false if undefined
  explanationStyle?: 'lively' | 'technical' | undefined; // Default to 'lively' if undefined
  mobileExplanationMode?: 'overlay' | 'below' | 'hidden' | undefined; // Default to 'overlay' if undefined
};

export type UserProfile = {
  id: string;
  name: string;
  createdAt: number;
  stats: UserStats;
  preferences?: UserPreferences | undefined; // Optional preferences
  greeting?: string | undefined; // Optional for legacy compatibility
  savedBoards?: Board[] | undefined; // Optional - stored separately
  opponents?: Opponent[] | undefined; // Optional - stored separately
  playerCreature?: CreatureId | undefined; // Creature for player
  opponentCreature?: CreatureId | undefined; // Creature for opponent

  // Discord integration
  discordId?: string | undefined; // Discord user ID (from OAuth)
  discordUsername?: string | undefined; // Discord username for display
  discordAvatar?: string | undefined; // Discord avatar hash/URL
};

/**
 * Per-opponent statistics stored in user profile
 */
export type OpponentStatsMap = Record<string, { wins: number; losses: number }>;
