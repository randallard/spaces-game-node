/**
 * Tests for ShareChallenge component
 * @module components/ShareChallenge.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareChallenge } from './ShareChallenge';

describe('ShareChallenge', () => {
  const mockOnCancel = vi.fn();
  const defaultProps = {
    challengeUrl: 'https://example.com/challenge/abc123',
    opponentName: 'Alice',
    boardSize: 3,
    round: 2,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    mockOnCancel.mockClear();
  });

  describe('Rendering', () => {
    it('should render the title', () => {
      render(<ShareChallenge {...defaultProps} />);

      expect(screen.getByText('Share Your Challenge')).toBeInTheDocument();
    });

    it('should display opponent name in the info text', () => {
      render(<ShareChallenge {...defaultProps} />);

      expect(screen.getByText(/Send this challenge to/)).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should display round number and board size', () => {
      render(<ShareChallenge {...defaultProps} />);

      expect(screen.getByText(/Round 2/)).toBeInTheDocument();
      expect(screen.getByText(/3×3 Board/)).toBeInTheDocument();
    });

    it('should render copy link button', () => {
      render(<ShareChallenge {...defaultProps} />);

      expect(screen.getByText(/Copy Link/)).toBeInTheDocument();
    });

    it('should render back to home button', () => {
      render(<ShareChallenge {...defaultProps} />);

      expect(screen.getByText('Back to Home')).toBeInTheDocument();
    });

    it('should render challenge URL in details section', () => {
      render(<ShareChallenge {...defaultProps} />);

      expect(screen.getByText('https://example.com/challenge/abc123')).toBeInTheDocument();
    });

    it('should render instructions with opponent name', () => {
      render(<ShareChallenge {...defaultProps} />);

      expect(screen.getByText(/Your board is ready to share/)).toBeInTheDocument();
      expect(screen.getByText(/send the link to Alice/i)).toBeInTheDocument();
    });

    it('should render view link summary', () => {
      render(<ShareChallenge {...defaultProps} />);

      expect(screen.getByText('View link')).toBeInTheDocument();
    });
  });

  describe('Back to Home button', () => {
    it('should call onCancel when clicked', () => {
      render(<ShareChallenge {...defaultProps} />);

      const cancelButton = screen.getByText('Back to Home');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should only call onCancel once per click', () => {
      render(<ShareChallenge {...defaultProps} />);

      const cancelButton = screen.getByText('Back to Home');
      fireEvent.click(cancelButton);
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(2);
    });
  });

  describe('Component layout', () => {
    it('should have a copy button', () => {
      render(<ShareChallenge {...defaultProps} />);

      const copyButton = screen.getByText(/Copy Link/);
      expect(copyButton.tagName).toBe('BUTTON');
    });

    it('should have a cancel button', () => {
      render(<ShareChallenge {...defaultProps} />);

      const cancelButton = screen.getByText('Back to Home');
      expect(cancelButton.tagName).toBe('BUTTON');
    });

    it('should render URL in a code element', () => {
      render(<ShareChallenge {...defaultProps} />);

      const codeElement = screen.getByText('https://example.com/challenge/abc123');
      expect(codeElement.tagName).toBe('CODE');
    });

    it('should have details/summary for URL preview', () => {
      const { container } = render(<ShareChallenge {...defaultProps} />);

      const details = container.querySelector('details');
      expect(details).toBeInTheDocument();

      const summary = container.querySelector('summary');
      expect(summary).toBeInTheDocument();
    });
  });

  describe('Different props variations', () => {
    it('should display different opponent name', () => {
      render(<ShareChallenge {...defaultProps} opponentName="Bob" />);

      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText(/send the link to Bob/i)).toBeInTheDocument();
    });

    it('should display different board size', () => {
      render(<ShareChallenge {...defaultProps} boardSize={5} />);

      expect(screen.getByText(/5×5 Board/)).toBeInTheDocument();
    });

    it('should display different round number', () => {
      render(<ShareChallenge {...defaultProps} round={10} />);

      expect(screen.getByText(/Round 10/)).toBeInTheDocument();
    });

    it('should display different challenge URL', () => {
      render(<ShareChallenge {...defaultProps} challengeUrl="https://test.com/xyz" />);

      expect(screen.getByText('https://test.com/xyz')).toBeInTheDocument();
    });

    it('should work with round 1', () => {
      render(<ShareChallenge {...defaultProps} round={1} />);

      expect(screen.getByText(/Round 1/)).toBeInTheDocument();
    });

    it('should work with 2x2 board', () => {
      render(<ShareChallenge {...defaultProps} boardSize={2} />);

      expect(screen.getByText(/2×2 Board/)).toBeInTheDocument();
    });

    it('should work with 10x10 board', () => {
      render(<ShareChallenge {...defaultProps} boardSize={10} />);

      expect(screen.getByText(/10×10 Board/)).toBeInTheDocument();
    });

    it('should use opponent name in multiple places', () => {
      render(<ShareChallenge {...defaultProps} opponentName="Charlie" />);

      // Should appear at least twice
      const charlieElements = screen.getAllByText(/Charlie/i);
      expect(charlieElements.length).toBeGreaterThanOrEqual(2);
    });

    it('should display share message with all props', () => {
      render(
        <ShareChallenge
          challengeUrl="https://game.com/challenge/test123"
          opponentName="TestPlayer"
          boardSize={4}
          round={5}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getAllByText(/TestPlayer/).length).toBeGreaterThan(0);
      expect(screen.getByText(/Round 5/)).toBeInTheDocument();
      expect(screen.getByText(/4×4 Board/)).toBeInTheDocument();
      expect(screen.getByText('https://game.com/challenge/test123')).toBeInTheDocument();
    });
  });

  describe('Text content', () => {
    it('should have clear instructions', () => {
      render(<ShareChallenge {...defaultProps} />);

      expect(screen.getByText(/board is ready to share/i)).toBeInTheDocument();
    });

    it('should mention opponent in instructions', () => {
      render(<ShareChallenge {...defaultProps} opponentName="TestUser" />);

      const instructions = screen.getByText(/send the link to TestUser/i);
      expect(instructions).toBeInTheDocument();
    });

    it('should have info text about sending challenge', () => {
      render(<ShareChallenge {...defaultProps} />);

      expect(screen.getByText(/Send this challenge to/)).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle long opponent names', () => {
      const longName = 'AVeryLongOpponentNameThatMightCauseLayoutIssues';
      render(<ShareChallenge {...defaultProps} opponentName={longName} />);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle long URLs', () => {
      const longUrl = 'https://example.com/challenge/abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567';
      render(<ShareChallenge {...defaultProps} challengeUrl={longUrl} />);

      expect(screen.getByText(longUrl)).toBeInTheDocument();
    });

    it('should handle special characters in opponent name', () => {
      render(<ShareChallenge {...defaultProps} opponentName="O'Brien-Smith" />);

      expect(screen.getByText("O'Brien-Smith")).toBeInTheDocument();
    });

    it('should handle minimum board size', () => {
      render(<ShareChallenge {...defaultProps} boardSize={2} />);

      expect(screen.getByText(/2×2 Board/)).toBeInTheDocument();
    });

    it('should handle maximum board size', () => {
      render(<ShareChallenge {...defaultProps} boardSize={10} />);

      expect(screen.getByText(/10×10 Board/)).toBeInTheDocument();
    });

    it('should handle high round numbers', () => {
      render(<ShareChallenge {...defaultProps} round={999} />);

      expect(screen.getByText(/Round 999/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive button text', () => {
      render(<ShareChallenge {...defaultProps} />);

      expect(screen.getByText('Back to Home')).toBeInTheDocument();
      expect(screen.getByText(/Copy Link/)).toBeInTheDocument();
    });

    it('should have clickable elements as buttons', () => {
      render(<ShareChallenge {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2); // At least Cancel and Copy Link
    });
  });

  describe('Clipboard functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('should copy URL to clipboard when copy button is clicked', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock,
        },
        writable: true,
        configurable: true,
      });

      render(<ShareChallenge {...defaultProps} />);

      const copyButton = screen.getByText(/Copy Link/);
      fireEvent.click(copyButton);

      await vi.waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith('https://example.com/challenge/abc123');
      });
    });

    it('should show success message after copying', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock,
        },
        writable: true,
        configurable: true,
      });

      render(<ShareChallenge {...defaultProps} opponentName="Alice" />);

      const copyButton = screen.getByText(/Copy Link/);
      fireEvent.click(copyButton);

      await vi.waitFor(() => {
        expect(screen.getByText(/Link copied! Send it to Alice/)).toBeInTheDocument();
      });
    });

    it('should hide success message after 3 seconds', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock,
        },
        writable: true,
        configurable: true,
      });

      render(<ShareChallenge {...defaultProps} opponentName="Alice" />);

      const copyButton = screen.getByText(/Copy Link/);
      fireEvent.click(copyButton);

      await vi.waitFor(() => {
        expect(screen.getByText(/Link copied! Send it to Alice/)).toBeInTheDocument();
      });

      vi.advanceTimersByTime(3000);

      await vi.waitFor(() => {
        expect(screen.queryByText(/Link copied!/)).not.toBeInTheDocument();
      });
    });

    it('should use execCommand fallback when clipboard API fails', async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard API not available'));
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock,
        },
        writable: true,
        configurable: true,
      });

      // Mock document.execCommand
      const execCommandMock = vi.fn().mockReturnValue(true);
      const originalExecCommand = document.execCommand;
      document.execCommand = execCommandMock;

      // Mock the DOM manipulation for fallback copy
      const mockInput = {
        value: '',
        select: vi.fn(),
        style: {},
      } as any;

      // Store original functions
      const originalCreateElement = document.createElement;
      const originalAppendChild = document.body.appendChild;
      const originalRemoveChild = document.body.removeChild;

      render(<ShareChallenge {...defaultProps} />);

      // Now set up the mocks for createElement, appendChild, removeChild
      // Only mock for 'input' elements
      document.createElement = vi.fn().mockImplementation((tagName: string) => {
        if (tagName === 'input') {
          return mockInput;
        }
        return originalCreateElement.call(document, tagName);
      }) as any;

      document.body.appendChild = vi.fn().mockImplementation((node: any) => {
        if (node === mockInput) {
          return mockInput;
        }
        return originalAppendChild.call(document.body, node);
      }) as any;

      document.body.removeChild = vi.fn().mockImplementation((node: any) => {
        if (node === mockInput) {
          return mockInput;
        }
        return originalRemoveChild.call(document.body, node);
      }) as any;

      const copyButton = screen.getByText(/Copy Link/);
      fireEvent.click(copyButton);

      await vi.waitFor(() => {
        expect(mockInput.select).toHaveBeenCalled();
        expect(execCommandMock).toHaveBeenCalledWith('copy');
      });

      await vi.waitFor(() => {
        expect(screen.getByText(/Link copied!/)).toBeInTheDocument();
      });

      // Restore original functions
      document.createElement = originalCreateElement as any;
      document.body.appendChild = originalAppendChild;
      document.body.removeChild = originalRemoveChild;
      document.execCommand = originalExecCommand;
    });

    it('should show error message when both clipboard and fallback fail', async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard API not available'));
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock,
        },
        writable: true,
        configurable: true,
      });

      // Mock execCommand to fail
      document.execCommand = vi.fn().mockImplementation(() => {
        throw new Error('execCommand failed');
      });

      render(<ShareChallenge {...defaultProps} />);

      const copyButton = screen.getByText(/Copy Link/);
      fireEvent.click(copyButton);

      await vi.waitFor(() => {
        expect(screen.getByText(/Failed to copy link. Please copy manually./)).toBeInTheDocument();
      });
    });
  });

  describe('Native share functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('should render native share button when navigator.share is available', () => {
      Object.defineProperty(navigator, 'share', {
        value: vi.fn(),
        writable: true,
        configurable: true,
      });

      render(<ShareChallenge {...defaultProps} />);

      expect(screen.getByText(/Share Challenge/)).toBeInTheDocument();
    });

    it('should call navigator.share with correct data', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: shareMock,
        writable: true,
        configurable: true,
      });

      render(<ShareChallenge {...defaultProps} opponentName="Bob" boardSize={3} round={2} />);

      const shareButton = screen.getByText(/Share Challenge/);
      fireEvent.click(shareButton);

      await vi.waitFor(() => {
        expect(shareMock).toHaveBeenCalledWith({
          title: 'Spaces Game Challenge - Round 2',
          text: 'Bob, I challenge you to beat my 3×3 board!',
          url: 'https://example.com/challenge/abc123',
        });
      });
    });

    it('should show success message after sharing', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: shareMock,
        writable: true,
        configurable: true,
      });

      render(<ShareChallenge {...defaultProps} />);

      const shareButton = screen.getByText(/Share Challenge/);
      fireEvent.click(shareButton);

      await vi.waitFor(() => {
        expect(screen.getByText(/Link copied!/)).toBeInTheDocument();
      });
    });

    it('should not show error when user cancels share (AbortError)', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';
      const shareMock = vi.fn().mockRejectedValue(abortError);

      Object.defineProperty(navigator, 'share', {
        value: shareMock,
        writable: true,
        configurable: true,
      });

      render(<ShareChallenge {...defaultProps} />);

      const shareButton = screen.getByText(/Share Challenge/);
      fireEvent.click(shareButton);

      await vi.waitFor(() => {
        expect(shareMock).toHaveBeenCalled();
      });

      // Should not show any error message
      expect(screen.queryByText(/Failed to copy link/)).not.toBeInTheDocument();
    });

    it('should fallback to clipboard when share fails with non-AbortError', async () => {
      const shareError = new Error('Share failed');
      shareError.name = 'ShareError';
      const shareMock = vi.fn().mockRejectedValue(shareError);
      const writeTextMock = vi.fn().mockResolvedValue(undefined);

      Object.defineProperty(navigator, 'share', {
        value: shareMock,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock,
        },
        writable: true,
        configurable: true,
      });

      render(<ShareChallenge {...defaultProps} />);

      const shareButton = screen.getByText(/Share Challenge/);
      fireEvent.click(shareButton);

      await vi.waitFor(() => {
        expect(shareMock).toHaveBeenCalled();
        expect(writeTextMock).toHaveBeenCalledWith('https://example.com/challenge/abc123');
      });
    });

    it('should not render native share button when navigator.share is not available', () => {
      // Create a fresh component without the share API
      // We need to delete the property to ensure 'share' in navigator returns false
      const originalShare = navigator.share;

      // Delete the property completely
      delete (navigator as any).share;

      render(<ShareChallenge {...defaultProps} />);

      // Native share button should not be present
      expect(screen.queryByText(/Share Challenge/)).not.toBeInTheDocument();

      // Only copy button should be present
      const copyButton = screen.getByText(/Copy Link/);
      expect(copyButton).toBeInTheDocument();

      // Restore the original value
      if (originalShare !== undefined) {
        (navigator as any).share = originalShare;
      }
    });
  });

  describe('Discord notification mode (opponent has Discord)', () => {
    it('should show turn complete title when opponent has Discord', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentHasDiscord={true}
        />
      );

      expect(screen.getByText('Turn Complete!')).toBeInTheDocument();
    });

    it('should show notification sent status when opponent has Discord', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentName="Bob"
          opponentHasDiscord={true}
        />
      );

      expect(screen.getByText(/Discord notification sent to/)).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should display round and board info when opponent has Discord', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          round={5}
          boardSize={4}
          opponentHasDiscord={true}
        />
      );

      expect(screen.getByText(/Round 5/)).toBeInTheDocument();
      expect(screen.getByText(/4×4 Board/)).toBeInTheDocument();
    });

    it('should show copy/share buttons when opponent has Discord', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentHasDiscord={true}
        />
      );

      // Copy/Share buttons should be visible for manual sharing backup
      expect(screen.getByText(/Copy Link/)).toBeInTheDocument();
      expect(screen.getByText(/Share Challenge/)).toBeInTheDocument();
    });

    it('should show back to home button when opponent has Discord', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentHasDiscord={true}
        />
      );

      expect(screen.getByText('Back to Home')).toBeInTheDocument();
    });

    it('should call onCancel when back to home clicked', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentHasDiscord={true}
        />
      );

      const backButton = screen.getByText('Back to Home');
      fireEvent.click(backButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Discord connection hints', () => {
    const mockOnConnectDiscord = vi.fn();

    beforeEach(() => {
      mockOnConnectDiscord.mockClear();
    });

    it('should show Discord connection hint when opponent has Discord but user does not', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentHasDiscord={true}
          userHasDiscord={false}
          onConnectDiscord={mockOnConnectDiscord}
        />
      );

      expect(screen.getByText(/Connect to Discord if you want to receive notifications automatically/)).toBeInTheDocument();
    });

    it('should show Discord connection hint in normal mode when user does not have Discord', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentHasDiscord={false}
          userHasDiscord={false}
          onConnectDiscord={mockOnConnectDiscord}
        />
      );

      expect(screen.getByText(/Connect to Discord to receive notifications automatically/)).toBeInTheDocument();
    });

    it('should call onConnectDiscord when hint link clicked (opponent has Discord)', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentHasDiscord={true}
          userHasDiscord={false}
          onConnectDiscord={mockOnConnectDiscord}
        />
      );

      const connectLink = screen.getByText(/Connect to Discord if you want to receive notifications automatically/);
      fireEvent.click(connectLink);

      expect(mockOnConnectDiscord).toHaveBeenCalledTimes(1);
    });

    it('should call onConnectDiscord when hint link clicked (normal mode)', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentHasDiscord={false}
          userHasDiscord={false}
          onConnectDiscord={mockOnConnectDiscord}
        />
      );

      const connectLink = screen.getByText(/Connect to Discord to receive notifications automatically/);
      fireEvent.click(connectLink);

      expect(mockOnConnectDiscord).toHaveBeenCalledTimes(1);
    });

    it('should not show Discord hint when user already has Discord', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentHasDiscord={true}
          userHasDiscord={true}
          onConnectDiscord={mockOnConnectDiscord}
        />
      );

      expect(screen.queryByText(/Connect to Discord/)).not.toBeInTheDocument();
    });

    it('should not show Discord hint when no onConnectDiscord callback provided', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentHasDiscord={true}
          userHasDiscord={false}
        />
      );

      expect(screen.queryByText(/Connect to Discord/)).not.toBeInTheDocument();
    });

    it('should show connecting state when Discord connection is in progress (opponent has Discord)', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentHasDiscord={true}
          userHasDiscord={false}
          onConnectDiscord={mockOnConnectDiscord}
          isConnectingDiscord={true}
        />
      );

      expect(screen.getByText(/Connecting to Discord.../)).toBeInTheDocument();
    });

    it('should show connecting state when Discord connection is in progress (normal mode)', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentHasDiscord={false}
          userHasDiscord={false}
          onConnectDiscord={mockOnConnectDiscord}
          isConnectingDiscord={true}
        />
      );

      expect(screen.getByText(/Connecting to Discord.../)).toBeInTheDocument();
    });

    it('should disable Discord connection button when connecting (opponent has Discord)', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentHasDiscord={true}
          userHasDiscord={false}
          onConnectDiscord={mockOnConnectDiscord}
          isConnectingDiscord={true}
        />
      );

      const connectButton = screen.getByText(/Connecting to Discord.../);
      expect(connectButton).toBeDisabled();
    });

    it('should disable Discord connection button when connecting (normal mode)', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentHasDiscord={false}
          userHasDiscord={false}
          onConnectDiscord={mockOnConnectDiscord}
          isConnectingDiscord={true}
        />
      );

      const connectButton = screen.getByText(/Connecting to Discord.../);
      expect(connectButton).toBeDisabled();
    });
  });

  describe('Discord integration combinations', () => {
    const mockOnConnectDiscord = vi.fn();

    beforeEach(() => {
      mockOnConnectDiscord.mockClear();
    });

    it('should handle both users without Discord in normal mode', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentHasDiscord={false}
          userHasDiscord={false}
          onConnectDiscord={mockOnConnectDiscord}
        />
      );

      expect(screen.getByText(/Share Your Challenge/)).toBeInTheDocument();
      expect(screen.getByText(/Connect to Discord to receive notifications automatically/)).toBeInTheDocument();
    });

    it('should handle user with Discord in normal mode', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentHasDiscord={false}
          userHasDiscord={true}
        />
      );

      expect(screen.getByText(/Share Your Challenge/)).toBeInTheDocument();
      expect(screen.queryByText(/Connect to Discord/)).not.toBeInTheDocument();
    });

    it('should handle opponent with Discord, user without Discord', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentName="Alice"
          opponentHasDiscord={true}
          userHasDiscord={false}
          onConnectDiscord={mockOnConnectDiscord}
        />
      );

      expect(screen.getByText('Turn Complete!')).toBeInTheDocument();
      expect(screen.getByText(/Discord notification sent to/)).toBeInTheDocument();
      expect(screen.getByText(/Connect to Discord if you want to receive notifications automatically/)).toBeInTheDocument();
    });

    it('should handle both users with Discord', () => {
      render(
        <ShareChallenge
          {...defaultProps}
          opponentHasDiscord={true}
          userHasDiscord={true}
        />
      );

      expect(screen.getByText('Turn Complete!')).toBeInTheDocument();
      expect(screen.queryByText(/Connect to Discord/)).not.toBeInTheDocument();
    });
  });
});
