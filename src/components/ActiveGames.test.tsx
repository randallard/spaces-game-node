/**
 * Tests for ActiveGames component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActiveGames } from './ActiveGames';
import type { ActiveGameInfo } from '@/utils/active-games';
import type { Opponent, GameState } from '@/types';

const createMockOpponent = (name: string): Opponent => ({
  id: `opponent-${name}`,
  name,
  type: 'human',
  wins: 3,
  losses: 2,
});

const createMockGameState = (gameId: string): GameState => ({
  phase: { type: 'board-selection', round: 1 },
  user: {
    id: 'test-user',
    name: 'Test User',
    playerCreature: 'bug',
    createdAt: Date.now(),
    stats: {
      totalGames: 0,
      wins: 0,
      losses: 0,
      ties: 0,
    },
  },
  opponent: createMockOpponent('Test'),
  gameId,
  gameMode: 'round-by-round',
  boardSize: 2,
  currentRound: 1,
  playerScore: 0,
  opponentScore: 0,
  playerSelectedBoard: null,
  opponentSelectedBoard: null,
  playerSelectedDeck: null,
  opponentSelectedDeck: null,
  roundHistory: [],
  checksum: '',
});

const createMockActiveGame = (
  gameId: string,
  opponentName: string,
  currentRound: number = 1,
  playerScore: number = 0,
  opponentScore: number = 0
): ActiveGameInfo => ({
  gameId,
  opponent: createMockOpponent(opponentName),
  currentRound,
  totalRounds: 5,
  playerScore,
  opponentScore,
  phase: { type: 'board-selection', round: currentRound },
  boardSize: 2,
  gameMode: 'round-by-round',
  lastUpdated: Date.now(),
  fullState: createMockGameState(gameId),
});

describe('ActiveGames', () => {
  let mockOnResumeGame: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnResumeGame = vi.fn();
  });

  it('should return null when there are no active games', () => {
    const { container } = render(
      <ActiveGames games={[]} onResumeGame={mockOnResumeGame} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render active games list', () => {
    const games = [
      createMockActiveGame('game-1', 'Alice'),
      createMockActiveGame('game-2', 'Bob'),
    ];

    render(<ActiveGames games={games} onResumeGame={mockOnResumeGame} />);

    expect(screen.getByText('Active Games')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should display game info correctly', () => {
    const game = createMockActiveGame('game-1', 'Charlie', 3, 2, 1);

    render(<ActiveGames games={[game]} onResumeGame={mockOnResumeGame} />);

    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText(/Round 3 of 5/)).toBeInTheDocument();
    expect(screen.getByText(/Score: 2-1/)).toBeInTheDocument();
    expect(screen.getByText(/2×2/)).toBeInTheDocument();
  });

  it('should display deck mode games with 10 rounds', () => {
    const game = createMockActiveGame('game-1', 'Dave', 5, 3, 2);
    game.totalRounds = 10;
    game.gameMode = 'deck';

    render(<ActiveGames games={[game]} onResumeGame={mockOnResumeGame} />);

    expect(screen.getByText(/Round 5 of 10/)).toBeInTheDocument();
  });

  it('should call onResumeGame when resume button is clicked', () => {
    const game = createMockActiveGame('game-1', 'Eve');

    render(<ActiveGames games={[game]} onResumeGame={mockOnResumeGame} />);

    const resumeButton = screen.getByText('Resume');
    fireEvent.click(resumeButton);

    expect(mockOnResumeGame).toHaveBeenCalledTimes(1);
    expect(mockOnResumeGame).toHaveBeenCalledWith(game);
  });

  it('should render multiple games with individual resume buttons', () => {
    const games = [
      createMockActiveGame('game-1', 'Frank', 2, 1, 0),
      createMockActiveGame('game-2', 'Grace', 4, 2, 2),
      createMockActiveGame('game-3', 'Henry', 1, 0, 1),
    ];

    render(<ActiveGames games={games} onResumeGame={mockOnResumeGame} />);

    const resumeButtons = screen.getAllByText('Resume');
    expect(resumeButtons).toHaveLength(3);

    // Click the second resume button
    const secondButton = resumeButtons[1];
    if (secondButton) {
      fireEvent.click(secondButton);
      expect(mockOnResumeGame).toHaveBeenCalledWith(games[1]);
    }
  });

  it('should display correct phase description', () => {
    const game = createMockActiveGame('game-1', 'Ivy');
    game.phase = { type: 'waiting-for-opponent', round: 2 };

    render(<ActiveGames games={[game]} onResumeGame={mockOnResumeGame} />);

    expect(screen.getByText(/Waiting for opponent/)).toBeInTheDocument();
  });

  it('should handle games without board size', () => {
    const game = createMockActiveGame('game-1', 'Jack');
    game.boardSize = null;

    render(<ActiveGames games={[game]} onResumeGame={mockOnResumeGame} />);

    expect(screen.getByText('Jack')).toBeInTheDocument();
    expect(screen.getByText(/Score: 0-0/)).toBeInTheDocument();
    // Should not show board size if null
    expect(screen.queryByText(/×/)).not.toBeInTheDocument();
  });

  it('should display different opponent types correctly', () => {
    const cpuGame = createMockActiveGame('game-1', 'CPU Sam');
    cpuGame.opponent.type = 'cpu';

    const humanGame = createMockActiveGame('game-2', 'Alice');
    humanGame.opponent.type = 'human';

    render(<ActiveGames games={[cpuGame, humanGame]} onResumeGame={mockOnResumeGame} />);

    expect(screen.getByText('CPU Sam')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
