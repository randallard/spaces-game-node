/**
 * Tests for ChallengeReceivedModal component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChallengeReceivedModal } from './ChallengeReceivedModal';

describe('ChallengeReceivedModal', () => {
  const mockOnAccept = vi.fn();
  const mockOnDecline = vi.fn();
  const mockOnConnectDiscord = vi.fn();

  const defaultProps = {
    isOpen: true,
    challengerName: 'Bob',
    boardSize: 3,
    round: 1,
    isOngoing: false,
    challengerHasDiscord: false,
    userHasDiscord: false,
    onAccept: mockOnAccept,
    onDecline: mockOnDecline,
    onConnectDiscord: mockOnConnectDiscord,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal visibility', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <ChallengeReceivedModal {...defaultProps} isOpen={false} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(<ChallengeReceivedModal {...defaultProps} />);

      expect(screen.getByText(/Challenge from Bob/)).toBeInTheDocument();
    });
  });

  describe('New challenge', () => {
    it('should display title for new challenge', () => {
      render(<ChallengeReceivedModal {...defaultProps} isOngoing={false} />);

      expect(screen.getByText('Challenge from Bob')).toBeInTheDocument();
    });

    it('should display board size in description', () => {
      render(<ChallengeReceivedModal {...defaultProps} isOngoing={false} boardSize={3} />);

      expect(screen.getByText(/3×3 board game/)).toBeInTheDocument();
    });

    it('should call onAccept when user clicks Play without Discord', () => {
      render(<ChallengeReceivedModal {...defaultProps} userHasDiscord={false} />);

      const playButton = screen.getByText(/Play without Discord/);
      fireEvent.click(playButton);

      expect(mockOnAccept).toHaveBeenCalledTimes(1);
    });

    it('should call onAccept when Accept Challenge button is clicked (user has Discord)', () => {
      render(<ChallengeReceivedModal {...defaultProps} userHasDiscord={true} />);

      const acceptButton = screen.getByText(/Accept Challenge/);
      fireEvent.click(acceptButton);

      expect(mockOnAccept).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ongoing game', () => {
    it('should display title for ongoing game', () => {
      render(<ChallengeReceivedModal {...defaultProps} isOngoing={true} />);

      expect(screen.getByText('Bob has responded!')).toBeInTheDocument();
    });

    it('should display round number in description', () => {
      render(<ChallengeReceivedModal {...defaultProps} isOngoing={true} round={3} />);

      expect(screen.getByText('Ready for Round 3?')).toBeInTheDocument();
    });

    it('should show Accept Challenge button when user has Discord', () => {
      render(<ChallengeReceivedModal {...defaultProps} isOngoing={true} userHasDiscord={true} />);

      expect(screen.getByText(/Accept Challenge/)).toBeInTheDocument();
    });
  });

  describe('Discord status', () => {
    it('should show Discord status when challenger has Discord', () => {
      render(
        <ChallengeReceivedModal
          {...defaultProps}
          challengerHasDiscord={true}
          challengerDiscordUsername="bob#1234"
        />
      );

      expect(screen.getByText(/Bob is connected to Discord/)).toBeInTheDocument();
    });

    it('should show Discord connection button when user does not have Discord', () => {
      render(
        <ChallengeReceivedModal
          {...defaultProps}
          challengerHasDiscord={true}
          userHasDiscord={false}
        />
      );

      expect(screen.getByText(/Connect Discord/)).toBeInTheDocument();
    });

    it('should call onConnectDiscord when connect button is clicked', () => {
      render(
        <ChallengeReceivedModal
          {...defaultProps}
          challengerHasDiscord={true}
          userHasDiscord={false}
        />
      );

      const connectButton = screen.getByText(/Connect Discord/);
      fireEvent.click(connectButton);

      expect(mockOnConnectDiscord).toHaveBeenCalledTimes(1);
    });

    it('should show connecting state when isConnectingDiscord is true', () => {
      render(
        <ChallengeReceivedModal
          {...defaultProps}
          challengerHasDiscord={true}
          userHasDiscord={false}
          isConnectingDiscord={true}
        />
      );

      expect(screen.getByText(/Connecting to Discord/)).toBeInTheDocument();
    });

    it('should show user connected status when user has Discord', () => {
      render(
        <ChallengeReceivedModal
          {...defaultProps}
          userHasDiscord={true}
        />
      );

      expect(screen.getByText(/You're connected to Discord/)).toBeInTheDocument();
    });
  });
});
