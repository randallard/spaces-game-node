/**
 * Tests for AiRetryModal component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AiRetryModal } from './AiRetryModal';

describe('AiRetryModal', () => {
  const mockOnRetry = vi.fn();
  const mockOnForfeit = vi.fn();

  const defaultProps = {
    opponentName: 'AI Agent',
    failureDetail: '3 attempts',
    onRetry: mockOnRetry,
    onForfeit: mockOnForfeit,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial failure mode (retry/forfeit choice)', () => {
    it('should display opponent name in title', () => {
      render(<AiRetryModal {...defaultProps} />);

      expect(screen.getByText('AI Agent is having trouble')).toBeInTheDocument();
    });

    it('should display failure detail in message', () => {
      render(<AiRetryModal {...defaultProps} />);

      expect(screen.getByText(/3 attempts/)).toBeInTheDocument();
    });

    it('should show retry button', () => {
      render(<AiRetryModal {...defaultProps} />);

      expect(screen.getByText('Give them more time')).toBeInTheDocument();
    });

    it('should show forfeit button', () => {
      render(<AiRetryModal {...defaultProps} />);

      expect(screen.getByText('They forfeit this round')).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      render(<AiRetryModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Give them more time'));

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onForfeit when forfeit button is clicked', () => {
      render(<AiRetryModal {...defaultProps} />);

      fireEvent.click(screen.getByText('They forfeit this round'));

      expect(mockOnForfeit).toHaveBeenCalledTimes(1);
    });

    it('should display "request failed" as failure detail', () => {
      render(<AiRetryModal {...defaultProps} failureDetail="request failed" />);

      expect(screen.getByText(/request failed/)).toBeInTheDocument();
    });
  });

  describe('Retry result mode (forfeit only)', () => {
    it('should display retry-failed title', () => {
      render(<AiRetryModal {...defaultProps} isRetryResult />);

      expect(screen.getByText("AI Agent still couldn't decide")).toBeInTheDocument();
    });

    it('should display retry-failed message', () => {
      render(<AiRetryModal {...defaultProps} isRetryResult />);

      expect(screen.getByText(/Still couldn't build a valid board after retry/)).toBeInTheDocument();
    });

    it('should show forfeit button only', () => {
      render(<AiRetryModal {...defaultProps} isRetryResult />);

      expect(screen.getByText('Win by forfeit')).toBeInTheDocument();
      expect(screen.queryByText('Give them more time')).not.toBeInTheDocument();
      expect(screen.queryByText('They forfeit this round')).not.toBeInTheDocument();
    });

    it('should call onForfeit when win-by-forfeit button is clicked', () => {
      render(<AiRetryModal {...defaultProps} isRetryResult />);

      fireEvent.click(screen.getByText('Win by forfeit'));

      expect(mockOnForfeit).toHaveBeenCalledTimes(1);
    });

    it('should not call onRetry', () => {
      render(<AiRetryModal {...defaultProps} isRetryResult />);

      fireEvent.click(screen.getByText('Win by forfeit'));

      expect(mockOnRetry).not.toHaveBeenCalled();
    });
  });

  describe('Different opponent names', () => {
    it('should render with a custom opponent name in initial mode', () => {
      render(<AiRetryModal {...defaultProps} opponentName="Dash (Intermediate)" />);

      expect(screen.getByText('Dash (Intermediate) is having trouble')).toBeInTheDocument();
    });

    it('should render with a custom opponent name in retry-result mode', () => {
      render(<AiRetryModal {...defaultProps} opponentName="Dash (Intermediate)" isRetryResult />);

      expect(screen.getByText("Dash (Intermediate) still couldn't decide")).toBeInTheDocument();
    });
  });
});
