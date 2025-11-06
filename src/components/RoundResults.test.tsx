/**
 * Tests for RoundResults component
 * @module components/RoundResults.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoundResults } from './RoundResults';
import type { RoundResult } from '@/types';

const createMockRoundResult = (
  winner: 'player' | 'opponent' | 'tie',
  round: number = 1
): RoundResult => ({
  round,
  winner,
  playerBoard: {
    id: 'player-board-id',
    name: 'Player Board',
    grid: [['empty', 'empty'], ['empty', 'empty']],
    sequence: [{ position: { row: 0, col: 0 }, type: 'piece', order: 1 }],
    thumbnail: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    createdAt: Date.now(),
  },
  opponentBoard: {
    id: 'opponent-board-id',
    name: 'Opponent Board',
    grid: [['empty', 'empty'], ['empty', 'empty']],
    sequence: [{ position: { row: 0, col: 0 }, type: 'piece', order: 1 }],
    thumbnail: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    createdAt: Date.now(),
  },
  playerFinalPosition: { row: 5, col: 3 },
  opponentFinalPosition: { row: 4, col: 2 },
  playerPoints: 10,
  opponentPoints: 8,
});

describe('RoundResults', () => {
  let mockOnContinue: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnContinue = vi.fn();
  });

  describe('Player wins', () => {
    it('should display player win message', () => {
      const result = createMockRoundResult('player');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('Alice Wins!')).toBeInTheDocument();
    });

    it('should display celebration emoji for player win', () => {
      const result = createMockRoundResult('player');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('🎉')).toBeInTheDocument();
    });
  });

  describe('Opponent wins', () => {
    it('should display opponent win message', () => {
      const result = createMockRoundResult('opponent');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="CPU"
          playerScore={1}
          opponentScore={3}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('CPU Wins!')).toBeInTheDocument();
    });

    it('should display sad emoji for opponent win', () => {
      const result = createMockRoundResult('opponent');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={1}
          opponentScore={3}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('😔')).toBeInTheDocument();
    });
  });

  describe('Tie game', () => {
    it('should display tie message', () => {
      const result = createMockRoundResult('tie');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={2}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText("It's a Tie!")).toBeInTheDocument();
    });

    it('should display handshake emoji for tie', () => {
      const result = createMockRoundResult('tie');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={2}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('🤝')).toBeInTheDocument();
    });
  });

  describe('Round information', () => {
    it('should display round number', () => {
      const result = createMockRoundResult('player', 3);

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('Round 3 Complete')).toBeInTheDocument();
    });

    it('should display round 1', () => {
      const result = createMockRoundResult('player', 1);

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={1}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('Round 1 Complete')).toBeInTheDocument();
    });

    it('should display round 8', () => {
      const result = createMockRoundResult('tie', 8);

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={4}
          opponentScore={4}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('Round 8 Complete')).toBeInTheDocument();
    });
  });

  describe('Board information', () => {
    it('should display player board name', () => {
      const result = createMockRoundResult('player');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('Player Board')).toBeInTheDocument();
    });

    it('should display opponent board name', () => {
      const result = createMockRoundResult('player');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('Opponent Board')).toBeInTheDocument();
    });

    it('should display combined board with correct alt text', () => {
      const result = createMockRoundResult('player');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByAltText("Combined board showing both players")).toBeInTheDocument();
    });

    it('should display player final position', () => {
      const result = createMockRoundResult('player');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('(5, 3)')).toBeInTheDocument();
    });

    it('should display opponent final position', () => {
      const result = createMockRoundResult('player');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('(4, 2)')).toBeInTheDocument();
    });
  });

  describe('Score display', () => {
    it('should display current scores with player names', () => {
      const result = createMockRoundResult('player');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('Current Score')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display score of 0-0', () => {
      const result = createMockRoundResult('tie', 1);

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={0}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      // Two zeros in the score display
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(2);
    });

    it('should display high scores correctly', () => {
      const result = createMockRoundResult('player', 8);

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={8}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('should display player legend for combined board', () => {
      const result = createMockRoundResult('player');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      // Check that the legend shows both player names
      const legendItems = screen.getAllByText(/Alice|Bob/);
      expect(legendItems.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Player names', () => {
    it('should display both player names', () => {
      const result = createMockRoundResult('player');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      // Player name appears in: board section, score section, and winner text
      const aliceElements = screen.getAllByText('Alice');
      const bobElements = screen.getAllByText('Bob');

      expect(aliceElements.length).toBeGreaterThanOrEqual(2);
      expect(bobElements.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle CPU opponent name', () => {
      const result = createMockRoundResult('opponent');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="CPU"
          playerScore={1}
          opponentScore={3}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('CPU Wins!')).toBeInTheDocument();
    });

    it('should handle long player names', () => {
      const result = createMockRoundResult('player');

      render(
        <RoundResults
          result={result}
          playerName="VeryLongPlayerName123"
          opponentName="AnotherLongOpponentName"
          playerScore={3}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('VeryLongPlayerName123 Wins!')).toBeInTheDocument();
    });
  });

  describe('Continue button', () => {
    it('should render continue button', () => {
      const result = createMockRoundResult('player');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('Continue to Next Round')).toBeInTheDocument();
    });

    it('should call onContinue when button clicked', () => {
      const result = createMockRoundResult('player');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      const continueButton = screen.getByText('Continue to Next Round');
      fireEvent.click(continueButton);

      expect(mockOnContinue).toHaveBeenCalledTimes(1);
    });

    it('should not call onContinue multiple times for single click', () => {
      const result = createMockRoundResult('player');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      const continueButton = screen.getByText('Continue to Next Round');
      fireEvent.click(continueButton);

      expect(mockOnContinue).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle position at origin (0, 0)', () => {
      const result: RoundResult = {
        ...createMockRoundResult('player'),
        playerFinalPosition: { row: 0, col: 0 },
        opponentFinalPosition: { row: 0, col: 0 },
      };

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={1}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      const zeroPositions = screen.getAllByText(/\(0, 0\)/);
      expect(zeroPositions.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle position at board edge (7, 7)', () => {
      const result: RoundResult = {
        ...createMockRoundResult('player'),
        playerFinalPosition: { row: 7, col: 7 },
      };

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('(7, 7)')).toBeInTheDocument();
    });

    it('should render with minimal valid data', () => {
      const result = createMockRoundResult('tie', 1);

      render(
        <RoundResults
          result={result}
          playerName="A"
          opponentName="B"
          playerScore={0}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText("It's a Tie!")).toBeInTheDocument();
      expect(screen.getByText('Continue to Next Round')).toBeInTheDocument();
    });

    it('should handle board names with special characters', () => {
      const result: RoundResult = {
        ...createMockRoundResult('player'),
        playerBoard: {
          ...createMockRoundResult('player').playerBoard,
          name: 'Board #1 (v2.0)',
        },
      };

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('Board #1 (v2.0)')).toBeInTheDocument();
    });
  });

  describe('Image rendering', () => {
    it('should render combined board image with SVG data URI', () => {
      const result = createMockRoundResult('player');

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      const combinedBoardImage = screen.getByAltText("Combined board showing both players") as HTMLImageElement;

      // Check that the image has a data URI src (SVG generated by generateCombinedBoardSvg)
      expect(combinedBoardImage.src).toMatch(/^data:image\/svg\+xml,/);
    });
  });
});
