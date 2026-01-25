/**
 * Tests for RemoveOpponentModal component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RemoveOpponentModal } from './RemoveOpponentModal';
import type { Opponent } from '@/types/opponent';

describe('RemoveOpponentModal', () => {
  const mockOnArchive = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnCancel = vi.fn();

  const mockOpponent: Opponent = {
    type: 'human',
    id: 'opponent-1',
    name: 'Alice',
    wins: 5,
    losses: 3,
  };

  const defaultProps = {
    opponent: mockOpponent,
    onArchive: mockOnArchive,
    onDelete: mockOnDelete,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal title', () => {
      render(<RemoveOpponentModal {...defaultProps} />);

      expect(screen.getByText('Remove Opponent from List')).toBeInTheDocument();
    });

    it('should display opponent name', () => {
      render(<RemoveOpponentModal {...defaultProps} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should display opponent record', () => {
      render(<RemoveOpponentModal {...defaultProps} />);

      expect(screen.getByText(/Record: 5-3/)).toBeInTheDocument();
    });

    it('should show Archive option', () => {
      render(<RemoveOpponentModal {...defaultProps} />);

      expect(screen.getByText('Archive')).toBeInTheDocument();
      expect(screen.getByText(/Hide this opponent from the list/)).toBeInTheDocument();
    });

    it('should show Delete option', () => {
      render(<RemoveOpponentModal {...defaultProps} />);

      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText(/Completely remove this opponent/)).toBeInTheDocument();
    });

    it('should render Cancel button', () => {
      render(<RemoveOpponentModal {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Archive functionality', () => {
    it('should call onArchive when Archive button is clicked', () => {
      render(<RemoveOpponentModal {...defaultProps} />);

      const archiveButton = screen.getByText('Archive Opponent');
      fireEvent.click(archiveButton);

      expect(mockOnArchive).toHaveBeenCalledTimes(1);
    });

    it('should explain archive behavior', () => {
      render(<RemoveOpponentModal {...defaultProps} />);

      expect(screen.getByText(/keep their record in local storage/)).toBeInTheDocument();
      expect(screen.getByText(/reappear if you play against them again/)).toBeInTheDocument();
    });
  });

  describe('Delete functionality', () => {
    it('should call onDelete when Delete button is clicked', () => {
      render(<RemoveOpponentModal {...defaultProps} />);

      const deleteButton = screen.getByText('Delete Opponent');
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('should warn about permanent deletion', () => {
      render(<RemoveOpponentModal {...defaultProps} />);

      expect(screen.getByText(/permanently deleted/)).toBeInTheDocument();
      expect(screen.getByText(/start with a fresh record/)).toBeInTheDocument();
    });
  });

  describe('Cancel functionality', () => {
    it('should call onCancel when Cancel button is clicked', () => {
      render(<RemoveOpponentModal {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when clicking overlay', () => {
      const { container } = render(<RemoveOpponentModal {...defaultProps} />);

      const overlay = container.querySelector('[class*="modalOverlay"]');
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
      } else {
        throw new Error('Overlay not found');
      }
    });

    it('should not call onCancel when clicking modal content', () => {
      const { container } = render(<RemoveOpponentModal {...defaultProps} />);

      const modal = container.querySelector('[class*="modalContent"]');
      if (modal) {
        fireEvent.click(modal);
        expect(mockOnCancel).not.toHaveBeenCalled();
      } else {
        throw new Error('Modal content not found');
      }
    });
  });

  describe('Different opponent types', () => {
    it('should display CPU opponent', () => {
      const cpuOpponent: Opponent = {
        type: 'cpu',
        id: 'cpu-1',
        name: 'CPU Sam',
        wins: 2,
        losses: 1,
      };

      render(<RemoveOpponentModal {...defaultProps} opponent={cpuOpponent} />);

      expect(screen.getByText('CPU Sam')).toBeInTheDocument();
      expect(screen.getByText(/Record: 2-1/)).toBeInTheDocument();
    });

    it('should display opponent with no wins', () => {
      const newOpponent: Opponent = {
        type: 'human',
        id: 'new-1',
        name: 'Bob',
        wins: 0,
        losses: 0,
      };

      render(<RemoveOpponentModal {...defaultProps} opponent={newOpponent} />);

      expect(screen.getByText(/Record: 0-0/)).toBeInTheDocument();
    });
  });
});
