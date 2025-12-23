/**
 * Tests for ShareChallenge component
 * @module components/ShareChallenge.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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
});
