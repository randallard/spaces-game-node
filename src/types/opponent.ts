/**
 * Opponent-related types
 */

export type OpponentType = 'human' | 'cpu' | 'remote-cpu';

export type Opponent = {
  id: string; // Generated from type + name
  name: string;
  type: OpponentType;
  wins: number;
  losses: number;
  hasCompletedGame?: boolean | undefined; // Track if at least one game has been completed (for human opponents)

  // Discord integration
  discordId?: string | undefined; // Discord user ID (for sending notifications)
  discordUsername?: string | undefined; // Discord username for display
};

export type OpponentStats = {
  wins: number;
  losses: number;
};
