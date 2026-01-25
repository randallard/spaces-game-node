/**
 * Tests for ActiveGameView component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActiveGameView } from './ActiveGameView';
import type { Board, UserProfile } from '@/types';

const mockUser: UserProfile = {
  id: 'user-1',
  name: 'Alice',
  createdAt: Date.now(),
  stats: {
    totalGames: 0,
    wins: 0,
    losses: 0,
    ties: 0,
  },
};

const mockBoard: Board = {
  id: 'board-1',
  name: 'Test Board',
  boardSize: 2,
  grid: [
    ['piece', 'empty'],
    ['empty', 'empty'],
  ],
  sequence: [
    { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
    { position: { row: -1, col: 0 }, type: 'final', order: 2 },
  ],
  thumbnail: 'data:image/svg+xml,...',
  createdAt: Date.now(),
};

const defaultProps = {
  currentRound: 1,
  totalRounds: 5,
  playerScore: 0,
  opponentScore: 0,
  playerName: 'Alice',
  opponentName: 'Bob',
  boardSize: 2,
  challengeUrl: 'https://example.com/challenge/abc123',
  gameState: 'waiting-for-player' as const,
  playerBoards: [mockBoard],
  user: mockUser,
  roundHistory: [],
  onBoardSelected: vi.fn(),
  onBoardSaved: vi.fn(),
  onBoardDeleted: vi.fn(),
};

describe('ActiveGameView', () => {
  it('should render game header with round info', () => {
    render(<ActiveGameView {...defaultProps} />);

    expect(screen.getByText(/Round 1 of 5/)).toBeInTheDocument();
  });

  it('should render score info', () => {
    render(<ActiveGameView {...defaultProps} playerScore={2} opponentScore={1} />);

    expect(screen.getByText(/Score: Alice 2 - Bob 1/)).toBeInTheDocument();
  });

  it('should render board size info', () => {
    render(<ActiveGameView {...defaultProps} />);

    expect(screen.getByText(/Board Size: 2×2/)).toBeInTheDocument();
  });

  it('should show waiting for player message when gameState is waiting-for-player', () => {
    render(<ActiveGameView {...defaultProps} gameState="waiting-for-player" />);

    expect(screen.getByText(/Select your board for Round 1/)).toBeInTheDocument();
  });

  it('should show waiting for opponent message when gameState is waiting-for-opponent-to-start', () => {
    render(<ActiveGameView {...defaultProps} gameState="waiting-for-opponent-to-start" />);

    expect(screen.getByText(/Waiting for Bob to complete Round 1/)).toBeInTheDocument();
  });

  it('should hide re-send link for CPU opponents', () => {
    render(<ActiveGameView {...defaultProps} isCpuOpponent={true} currentRound={2} />);

    expect(screen.queryByText(/click here to re-send game link/)).not.toBeInTheDocument();
  });

  it('should show re-send link for human opponents on round 2+', () => {
    render(<ActiveGameView {...defaultProps} isCpuOpponent={false} currentRound={2} />);

    expect(screen.getByText(/click here to re-send game link/)).toBeInTheDocument();
  });

  it('should not show re-send link on round 1 board selection', () => {
    render(<ActiveGameView {...defaultProps} isCpuOpponent={false} currentRound={1} gameState="waiting-for-player" />);

    expect(screen.queryByText(/click here to re-send game link/)).not.toBeInTheDocument();
  });
});
