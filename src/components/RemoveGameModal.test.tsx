/**
 * Tests for RemoveGameModal component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RemoveGameModal } from './RemoveGameModal';
import type { ActiveGameInfo } from '@/utils/active-games';
import type { GameState } from '@/types/game-state';

describe('RemoveGameModal', () => {
  const mockGame: ActiveGameInfo = {
    gameId: 'test-game-1',
    opponent: {
      id: 'opponent-1',
      name: 'Test Opponent',
      type: 'human',
      wins: 2,
      losses: 1,
    },
    currentRound: 3,
    totalRounds: 5,
    playerScore: 2,
    opponentScore: 1,
    phase: { type: 'board-selection', round: 3 },
    boardSize: 3,
    gameMode: 'round-by-round',
    lastUpdated: Date.now(),
    fullState: {} as GameState,
  };

  it('should render modal with game information', () => {
    const onArchive = vi.fn();
    const onDelete = vi.fn();
    const onCancel = vi.fn();

    render(
      <RemoveGameModal
        game={mockGame}
        onArchive={onArchive}
        onDelete={onDelete}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Remove Game from Active List')).toBeInTheDocument();
    expect(screen.getByText('Test Opponent')).toBeInTheDocument();
    expect(screen.getByText(/Round 3 of 5/)).toBeInTheDocument();
    expect(screen.getByText(/Score: 2-1/)).toBeInTheDocument();
  });

  it('should display archive option with description', () => {
    const onArchive = vi.fn();
    const onDelete = vi.fn();
    const onCancel = vi.fn();

    render(
      <RemoveGameModal
        game={mockGame}
        onArchive={onArchive}
        onDelete={onDelete}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Archive')).toBeInTheDocument();
    expect(screen.getByText(/Keep the game in local storage/)).toBeInTheDocument();
    expect(screen.getByText('Archive Game')).toBeInTheDocument();
  });

  it('should display delete option with description', () => {
    const onArchive = vi.fn();
    const onDelete = vi.fn();
    const onCancel = vi.fn();

    render(
      <RemoveGameModal
        game={mockGame}
        onArchive={onArchive}
        onDelete={onDelete}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText(/Completely remove this game/)).toBeInTheDocument();
    expect(screen.getByText('Delete Game')).toBeInTheDocument();
  });

  it('should call onArchive when archive button is clicked', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    const onDelete = vi.fn();
    const onCancel = vi.fn();

    render(
      <RemoveGameModal
        game={mockGame}
        onArchive={onArchive}
        onDelete={onDelete}
        onCancel={onCancel}
      />
    );

    const archiveButton = screen.getByText('Archive Game');
    await user.click(archiveButton);

    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    const onDelete = vi.fn();
    const onCancel = vi.fn();

    render(
      <RemoveGameModal
        game={mockGame}
        onArchive={onArchive}
        onDelete={onDelete}
        onCancel={onCancel}
      />
    );

    const deleteButton = screen.getByText('Delete Game');
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onArchive).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    const onDelete = vi.fn();
    const onCancel = vi.fn();

    render(
      <RemoveGameModal
        game={mockGame}
        onArchive={onArchive}
        onDelete={onDelete}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onArchive).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('should call onCancel when overlay is clicked', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    const onDelete = vi.fn();
    const onCancel = vi.fn();

    const { container } = render(
      <RemoveGameModal
        game={mockGame}
        onArchive={onArchive}
        onDelete={onDelete}
        onCancel={onCancel}
      />
    );

    const overlay = container.firstChild as HTMLElement;
    await user.click(overlay);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should not call onCancel when modal content is clicked', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    const onDelete = vi.fn();
    const onCancel = vi.fn();

    render(
      <RemoveGameModal
        game={mockGame}
        onArchive={onArchive}
        onDelete={onDelete}
        onCancel={onCancel}
      />
    );

    const modalTitle = screen.getByText('Remove Game from Active List');
    await user.click(modalTitle);

    expect(onCancel).not.toHaveBeenCalled();
  });
});
