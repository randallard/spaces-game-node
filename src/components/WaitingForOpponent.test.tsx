/**
 * Tests for WaitingForOpponent component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WaitingForOpponent } from './WaitingForOpponent';

describe('WaitingForOpponent', () => {
  const defaultProps = {
    challengeUrl: 'https://example.com/challenge#abc123',
    opponentName: 'Test Opponent',
    boardSize: 5,
    round: 1,
    onGoHome: vi.fn(),
    opponentHasDiscord: false,
  };

  it('should render waiting message', () => {
    render(<WaitingForOpponent {...defaultProps} />);

    expect(screen.getByText('Waiting for Test Opponent')).toBeInTheDocument();
    expect(screen.getByText(/You've sent your board to/)).toBeInTheDocument();
    expect(screen.getByText(/Round 1 • 5×5 Board/)).toBeInTheDocument();
  });

  it('should show Discord notification message when opponent has Discord', () => {
    render(<WaitingForOpponent {...defaultProps} opponentHasDiscord={true} />);

    expect(screen.getByText(/They will be notified automatically via Discord/)).toBeInTheDocument();
  });

  it('should show waiting message when opponent does not have Discord', () => {
    render(<WaitingForOpponent {...defaultProps} opponentHasDiscord={false} />);

    expect(screen.getByText(/Waiting for them to make their move/)).toBeInTheDocument();
  });

  it('should call onGoHome when Back to Home is clicked', async () => {
    const user = userEvent.setup();
    const onGoHome = vi.fn();

    render(<WaitingForOpponent {...defaultProps} onGoHome={onGoHome} />);

    const homeButton = screen.getByText('Back to Home');
    await user.click(homeButton);

    expect(onGoHome).toHaveBeenCalledTimes(1);
  });

  it('should have copy link button', () => {
    render(<WaitingForOpponent {...defaultProps} />);

    expect(screen.getByText('📋 Copy Link')).toBeInTheDocument();
  });

  it('should show challenge URL in details', () => {
    render(<WaitingForOpponent {...defaultProps} />);

    const details = screen.getByText('View link');
    expect(details).toBeInTheDocument();
  });
});
