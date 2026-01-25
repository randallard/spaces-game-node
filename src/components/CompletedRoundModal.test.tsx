/**
 * Tests for CompletedRoundModal component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompletedRoundModal } from './CompletedRoundModal';

describe('CompletedRoundModal', () => {
  const mockOnGoHome = vi.fn();

  const defaultProps = {
    isOpen: true,
    opponentName: 'Alice',
    round: 3,
    onGoHome: mockOnGoHome,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal visibility', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <CompletedRoundModal {...defaultProps} isOpen={false} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(<CompletedRoundModal {...defaultProps} />);

      expect(screen.getByText('Round Already Completed')).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should display round number in message', () => {
      render(<CompletedRoundModal {...defaultProps} round={5} />);

      expect(screen.getByText(/already completed round 5/)).toBeInTheDocument();
    });

    it('should display opponent name in message', () => {
      render(<CompletedRoundModal {...defaultProps} opponentName="Bob" />);

      // Bob appears in a <strong> tag within the message
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should display explanation about what happened', () => {
      render(<CompletedRoundModal {...defaultProps} />);

      expect(screen.getByText(/What happened?/)).toBeInTheDocument();
      expect(screen.getByText(/You can't replay rounds that have been completed/)).toBeInTheDocument();
    });

    it('should display suggestion for next steps', () => {
      render(<CompletedRoundModal {...defaultProps} />);

      expect(screen.getByText(/Looking for your next move?/)).toBeInTheDocument();
    });

    it('should mention opponent name in suggestion', () => {
      render(<CompletedRoundModal {...defaultProps} opponentName="Charlie" />);

      expect(screen.getByText(/more recent link from Charlie/)).toBeInTheDocument();
    });
  });

  describe('Go Home button', () => {
    it('should call onGoHome when button is clicked', () => {
      render(<CompletedRoundModal {...defaultProps} />);

      const goHomeButton = screen.getByText('Go to Home Screen');
      fireEvent.click(goHomeButton);

      expect(mockOnGoHome).toHaveBeenCalledTimes(1);
    });

    it('should call onGoHome when clicking overlay', () => {
      const { container } = render(<CompletedRoundModal {...defaultProps} />);

      // Find the overlay (first div child of body)
      const overlay = container.querySelector('[class*="overlay"]');
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockOnGoHome).toHaveBeenCalledTimes(1);
      } else {
        throw new Error('Overlay not found');
      }
    });

    it('should not call onGoHome when clicking modal content', () => {
      const { container } = render(<CompletedRoundModal {...defaultProps} />);

      // Find the modal (not overlay)
      const modal = container.querySelector('[class*="modal"]');
      if (modal) {
        fireEvent.click(modal);
        expect(mockOnGoHome).not.toHaveBeenCalled();
      } else {
        throw new Error('Modal not found');
      }
    });
  });

  describe('Accessibility', () => {
    it('should render checkmark icon', () => {
      render(<CompletedRoundModal {...defaultProps} />);

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should have clear title', () => {
      render(<CompletedRoundModal {...defaultProps} />);

      const title = screen.getByText('Round Already Completed');
      expect(title.tagName).toBe('H2');
    });
  });
});
