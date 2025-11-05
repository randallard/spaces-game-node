/**
 * Opponent-related types
 */

export type OpponentType = 'human' | 'cpu';

export type Opponent = {
  id: string; // Generated from type + name
  name: string;
  type: OpponentType;
  wins: number;
  losses: number;
};

export type OpponentStats = {
  wins: number;
  losses: number;
};
