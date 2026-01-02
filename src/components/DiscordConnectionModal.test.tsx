/**
 * Tests for DiscordConnectionModal component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiscordConnectionModal } from './DiscordConnectionModal';

describe('DiscordConnectionModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConnect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal visibility', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <DiscordConnectionModal
          isOpen={false}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
        />
      );

      expect(screen.getByText(/Get Turn Notifications/)).toBeInTheDocument();
    });
  });

  describe('Not connected state', () => {
    it('should display title for not connected state', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={false}
        />
      );

      expect(screen.getByText(/Get Turn Notifications/)).toBeInTheDocument();
    });

    it('should display description about notifications', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={false}
        />
      );

      expect(screen.getByText(/Connect your Discord account to receive notifications when:/)).toBeInTheDocument();
    });

    it('should display benefits of Discord connection', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={false}
        />
      );

      expect(screen.getByText(/Your opponent plays their turn/)).toBeInTheDocument();
      expect(screen.getByText(/A game completes/)).toBeInTheDocument();
      expect(screen.getByText(/Challenges are sent/)).toBeInTheDocument();
    });

    it('should display note about optional connection', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={false}
        />
      );

      expect(screen.getByText(/Discord connection is completely optional/)).toBeInTheDocument();
    });

    it('should display "Connect with Discord" button', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={false}
        />
      );

      expect(screen.getByText('Connect with Discord')).toBeInTheDocument();
    });

    it('should display "Skip for Now" button', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={false}
        />
      );

      expect(screen.getByText('Skip for Now')).toBeInTheDocument();
    });

    it('should call onConnect when connect button clicked', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={false}
        />
      );

      const connectButton = screen.getByText('Connect with Discord');
      fireEvent.click(connectButton);

      expect(mockOnConnect).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when skip button clicked', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={false}
        />
      );

      const skipButton = screen.getByText('Skip for Now');
      fireEvent.click(skipButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Connected state', () => {
    it('should display title for connected state', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={true}
          discordUsername="TestUser#1234"
        />
      );

      expect(screen.getByText(/Discord Connected/)).toBeInTheDocument();
    });

    it('should display Discord username when connected', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={true}
          discordUsername="TestUser#1234"
        />
      );

      expect(screen.getByText(/TestUser#1234/)).toBeInTheDocument();
    });

    it('should display connected benefits', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={true}
          discordUsername="TestUser#1234"
        />
      );

      expect(screen.getByText(/Get notified on Discord when your opponent plays their turn/)).toBeInTheDocument();
      expect(screen.getByText(/Receive game completion notifications/)).toBeInTheDocument();
      expect(screen.getByText(/Never miss a move in your correspondence games/)).toBeInTheDocument();
    });

    it('should display "Done" button when connected', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={true}
          discordUsername="TestUser#1234"
        />
      );

      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('should call onClose when done button clicked', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={true}
          discordUsername="TestUser#1234"
        />
      );

      const doneButton = screen.getByText('Done');
      fireEvent.click(doneButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not display connect button when connected', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={true}
          discordUsername="TestUser#1234"
        />
      );

      expect(screen.queryByText('Connect with Discord')).not.toBeInTheDocument();
    });

    it('should not display skip button when connected', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={true}
          discordUsername="TestUser#1234"
        />
      );

      expect(screen.queryByText('Skip for Now')).not.toBeInTheDocument();
    });
  });

  describe('Connecting state', () => {
    it('should display connecting text when isConnecting is true', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={false}
          isConnecting={true}
        />
      );

      expect(screen.getByText('Connecting to Discord...')).toBeInTheDocument();
    });

    it('should disable connect button when connecting', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={false}
          isConnecting={true}
        />
      );

      const connectButton = screen.getByText('Connecting to Discord...');
      expect(connectButton).toBeDisabled();
    });

    it('should disable skip button when connecting', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={false}
          isConnecting={true}
        />
      );

      const skipButton = screen.getByText('Skip for Now');
      expect(skipButton).toBeDisabled();
    });
  });

  describe('Close button', () => {
    it('should display close button', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
        />
      );

      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('should call onClose when close button clicked', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
        />
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Overlay interactions', () => {
    it('should call onClose when overlay clicked', () => {
      const { container } = render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
        />
      );

      const overlay = container.firstChild as HTMLElement;
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close when modal content clicked', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
        />
      );

      const modalContent = screen.getByText(/Get Turn Notifications/).closest('div');
      if (modalContent) {
        fireEvent.click(modalContent);
      }

      // Should not call onClose when clicking modal content
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Default prop values', () => {
    it('should default to not connected when isConnected is undefined', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
        />
      );

      expect(screen.getByText('Connect with Discord')).toBeInTheDocument();
    });

    it('should default to not connecting when isConnecting is undefined', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
        />
      );

      const connectButton = screen.getByText('Connect with Discord');
      expect(connectButton).not.toBeDisabled();
    });
  });

  describe('Edge cases', () => {
    it('should handle long Discord usernames', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={true}
          discordUsername="VeryLongDiscordUsername#9999"
        />
      );

      expect(screen.getByText(/VeryLongDiscordUsername#9999/)).toBeInTheDocument();
    });

    it('should handle Discord username with special characters', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={true}
          discordUsername="User_Name-123#4567"
        />
      );

      expect(screen.getByText(/User_Name-123#4567/)).toBeInTheDocument();
    });

    it('should handle connected state without username', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={true}
        />
      );

      // Should still show connected state even without username
      expect(screen.getByText(/Discord Connected/)).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive button text', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={false}
        />
      );

      expect(screen.getByText('Connect with Discord')).toBeInTheDocument();
      expect(screen.getByText('Skip for Now')).toBeInTheDocument();
    });

    it('should have aria-label for close button', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
        />
      );

      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('should have clickable elements as buttons', () => {
      render(
        <DiscordConnectionModal
          isOpen={true}
          onClose={mockOnClose}
          onConnect={mockOnConnect}
          isConnected={false}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3); // Close, Skip, Connect
    });
  });
});
