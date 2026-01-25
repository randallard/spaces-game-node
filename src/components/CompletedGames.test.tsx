/**
 * Tests for CompletedGames component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompletedGames } from './CompletedGames';
import type { ActiveGameInfo } from '@/utils/active-games';

const createMockGame = (gameId: string, opponentName: string): ActiveGameInfo => ({
  gameId,
  opponent: {
    type: 'cpu',
    id: `cpu-${gameId}`,
    name: opponentName,
    wins: 0,
    losses: 0,
  },
  currentRound: 5,
  totalRounds: 5,
  boardSize: 3,
  gameMode: 'round-by-round',
  phase: { type: 'game-over', winner: 'player' },
  playerScore: 0,
  opponentScore: 0,
  lastUpdated: Date.now(),
  fullState: {} as any, // Not needed for these tests
});

describe('CompletedGames', () => {
  const mockOnViewResults = vi.fn();
  const mockOnArchiveGame = vi.fn();
  const mockOnDeleteGame = vi.fn();
  const mockOnToggleMinimize = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when there are no games', () => {
      const { container } = render(
        <CompletedGames
          games={[]}
          onViewResults={mockOnViewResults}
          onArchiveGame={mockOnArchiveGame}
          onDeleteGame={mockOnDeleteGame}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render title when games exist', () => {
      const games = [createMockGame('game-1', 'CPU Sam')];

      render(
        <CompletedGames
          games={games}
          onViewResults={mockOnViewResults}
          onArchiveGame={mockOnArchiveGame}
          onDeleteGame={mockOnDeleteGame}
        />
      );

      expect(screen.getByText('Completed Games')).toBeInTheDocument();
    });

    it('should render opponent names', () => {
      const games = [
        createMockGame('game-1', 'CPU Sam'),
        createMockGame('game-2', 'Alice'),
      ];

      render(
        <CompletedGames
          games={games}
          onViewResults={mockOnViewResults}
          onArchiveGame={mockOnArchiveGame}
          onDeleteGame={mockOnDeleteGame}
        />
      );

      expect(screen.getByText('CPU Sam')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should show game status as completed', () => {
      const games = [createMockGame('game-1', 'CPU Sam')];

      render(
        <CompletedGames
          games={games}
          onViewResults={mockOnViewResults}
          onArchiveGame={mockOnArchiveGame}
          onDeleteGame={mockOnDeleteGame}
        />
      );

      expect(screen.getByText(/Round 5 of 5/)).toBeInTheDocument();
    });
  });

  describe('View Results button', () => {
    it('should call onViewResults when View Results button is clicked', () => {
      const game = createMockGame('game-1', 'CPU Sam');

      render(
        <CompletedGames
          games={[game]}
          onViewResults={mockOnViewResults}
          onArchiveGame={mockOnArchiveGame}
          onDeleteGame={mockOnDeleteGame}
        />
      );

      const viewButton = screen.getByText(/View Results/);
      fireEvent.click(viewButton);

      expect(mockOnViewResults).toHaveBeenCalledWith(game);
    });

    it('should render View Results button for each game', () => {
      const games = [
        createMockGame('game-1', 'CPU Sam'),
        createMockGame('game-2', 'Alice'),
      ];

      render(
        <CompletedGames
          games={games}
          onViewResults={mockOnViewResults}
          onArchiveGame={mockOnArchiveGame}
          onDeleteGame={mockOnDeleteGame}
        />
      );

      const buttons = screen.getAllByText(/View Results/);
      expect(buttons).toHaveLength(2);
    });
  });

  describe('Minimize/Expand', () => {
    it('should render minimize button when onToggleMinimize is provided', () => {
      const games = [createMockGame('game-1', 'CPU Sam')];

      render(
        <CompletedGames
          games={games}
          onViewResults={mockOnViewResults}
          onArchiveGame={mockOnArchiveGame}
          onDeleteGame={mockOnDeleteGame}
          onToggleMinimize={mockOnToggleMinimize}
        />
      );

      const minimizeButton = screen.getByLabelText('Minimize');
      expect(minimizeButton).toBeInTheDocument();
    });

    it('should call onToggleMinimize when minimize button is clicked', () => {
      const games = [createMockGame('game-1', 'CPU Sam')];

      render(
        <CompletedGames
          games={games}
          onViewResults={mockOnViewResults}
          onArchiveGame={mockOnArchiveGame}
          onDeleteGame={mockOnDeleteGame}
          onToggleMinimize={mockOnToggleMinimize}
        />
      );

      const minimizeButton = screen.getByLabelText('Minimize');
      fireEvent.click(minimizeButton);

      expect(mockOnToggleMinimize).toHaveBeenCalledTimes(1);
    });

    it('should hide games list when minimized', () => {
      const games = [createMockGame('game-1', 'CPU Sam')];

      render(
        <CompletedGames
          games={games}
          onViewResults={mockOnViewResults}
          onArchiveGame={mockOnArchiveGame}
          onDeleteGame={mockOnDeleteGame}
          isMinimized={true}
        />
      );

      expect(screen.queryByText('CPU Sam')).not.toBeInTheDocument();
    });

    it('should show expand button when minimized', () => {
      const games = [createMockGame('game-1', 'CPU Sam')];

      render(
        <CompletedGames
          games={games}
          onViewResults={mockOnViewResults}
          onArchiveGame={mockOnArchiveGame}
          onDeleteGame={mockOnDeleteGame}
          isMinimized={true}
          onToggleMinimize={mockOnToggleMinimize}
        />
      );

      const expandButton = screen.getByLabelText('Expand');
      expect(expandButton).toBeInTheDocument();
    });
  });

  describe('Remove game', () => {
    it('should show remove modal when remove button is clicked', () => {
      const games = [createMockGame('game-1', 'CPU Sam')];

      render(
        <CompletedGames
          games={games}
          onViewResults={mockOnViewResults}
          onArchiveGame={mockOnArchiveGame}
          onDeleteGame={mockOnDeleteGame}
        />
      );

      // Click the remove button
      const removeButton = screen.getByText(/Remove game from Completed list/);
      fireEvent.click(removeButton);

      // Modal should appear with title
      expect(screen.getByText(/Remove Game from Active List/)).toBeInTheDocument();
      // Modal should show Archive and Delete options
      expect(screen.getByText(/Archive Game/)).toBeInTheDocument();
      expect(screen.getByText(/Delete Game/)).toBeInTheDocument();
    });
  });
});
