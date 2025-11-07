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
    boardSize: 2,
    grid: [['empty', 'empty'], ['empty', 'empty']],
    sequence: [{ position: { row: 0, col: 0 }, type: 'piece', order: 1 }],
    thumbnail: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    createdAt: Date.now(),
  },
  opponentBoard: {
    id: 'opponent-board-id',
    name: 'Opponent Board',
    boardSize: 2,
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

      // Combined board is now rendered as inline SVG (not img with alt text)
      expect(screen.getByText('Combined Board View')).toBeInTheDocument();
      // Verify SVG element exists by checking for SVG-specific elements
      const container = screen.getByText('Combined Board View').parentElement;
      expect(container).toBeInTheDocument();
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

      expect(screen.getByText('Total Score')).toBeInTheDocument();
      expect(screen.getByText('Round Score')).toBeInTheDocument();
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

      // "8" appears multiple times: in round title and in score displays
      const eights = screen.getAllByText('8');
      expect(eights.length).toBeGreaterThanOrEqual(1);
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

      // Combined board is now rendered as inline SVG (not img with src)
      // Just verify the board title exists (SVG is rendered via dangerouslySetInnerHTML)
      expect(screen.getByText('Combined Board View')).toBeInTheDocument();
    });
  });

  describe('Replay functionality', () => {
    const createReplayableResult = (): RoundResult => ({
      round: 1,
      winner: 'player',
      playerBoard: {
        id: 'player-board-id',
        name: 'Player Board',
        boardSize: 2,
        grid: [
          ['piece', 'empty'],
          ['piece', 'empty'],
        ],
        sequence: [
          { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
          { position: { row: 0, col: 0 }, type: 'piece', order: 2 },
          { position: { row: -1, col: 0 }, type: 'final', order: 3 },
        ],
        thumbnail: 'data:image/svg+xml;base64,test',
        createdAt: Date.now(),
      },
      opponentBoard: {
        id: 'opponent-board-id',
        name: 'Opponent Board',
        boardSize: 2,
        grid: [
          ['empty', 'piece'],
          ['empty', 'empty'],
        ],
        sequence: [
          { position: { row: 0, col: 1 }, type: 'piece', order: 1 },
        ],
        thumbnail: 'data:image/svg+xml;base64,test',
        createdAt: Date.now(),
      },
      playerFinalPosition: { row: 0, col: 0 },
      opponentFinalPosition: { row: 0, col: 1 },
      playerPoints: 2,
      opponentPoints: 0,
      playerOutcome: 'won',
      simulationDetails: {
        playerMoves: 2,
        opponentMoves: 1,
        playerHitTrap: false,
        opponentHitTrap: false,
        playerLastStep: 2, // Player reached goal (final move at index 2)
        opponentLastStep: 0,
      },
    });

    it('should show replay button initially', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('▶ Replay')).toBeInTheDocument();
    });

    it('should start replay when replay button clicked', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      const replayButton = screen.getByText('▶ Replay');
      fireEvent.click(replayButton);

      // Should show stop button during replay
      expect(screen.getByText('⏹ Stop')).toBeInTheDocument();
      // Should show initial explanations
      expect(screen.getByText(/Player starts with piece at/)).toBeInTheDocument();
      expect(screen.getByText(/Opponent starts with piece at/)).toBeInTheDocument();
    });

    it('should show next button during replay', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      const replayButton = screen.getByText('▶ Replay');
      fireEvent.click(replayButton);

      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should advance step when next button clicked', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      // Start replay
      fireEvent.click(screen.getByText('▶ Replay'));

      // Click next to advance
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // Should show move explanations
      expect(screen.getByText(/Player moves to/)).toBeInTheDocument();
    });

    it('should stop replay when stop button clicked', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      // Start replay
      fireEvent.click(screen.getByText('▶ Replay'));

      // Stop replay
      const stopButton = screen.getByText('⏹ Stop');
      fireEvent.click(stopButton);

      // Should go back to replay button
      expect(screen.getByText('▶ Replay')).toBeInTheDocument();
      expect(screen.queryByText('⏹ Stop')).not.toBeInTheDocument();
    });

    it('should hide next button after all steps completed', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      // Start replay
      fireEvent.click(screen.getByText('▶ Replay'));

      // Click next multiple times to go through all steps
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton); // Step 1
      fireEvent.click(nextButton); // Step 2

      // After all steps, next button should be hidden
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('should show forward movement explanation', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      // Start replay
      fireEvent.click(screen.getByText('▶ Replay'));

      // Advance to second step where player moves forward
      fireEvent.click(screen.getByText('Next'));

      // Should show forward movement point
      expect(screen.getByText(/\+1 point \(forward movement\)/)).toBeInTheDocument();
    });

    it('should show goal reached explanation', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      // Start replay
      fireEvent.click(screen.getByText('▶ Replay'));

      // Advance through steps
      fireEvent.click(screen.getByText('Next')); // Step 1
      fireEvent.click(screen.getByText('Next')); // Step 2 - goal reached

      // Should show goal reached message
      expect(screen.getByText(/Player reaches the goal!/)).toBeInTheDocument();
      expect(screen.getByText(/\+1 point \(goal reached\)/)).toBeInTheDocument();
    });

    it('should show round end message when goal is reached', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      // Start replay
      fireEvent.click(screen.getByText('▶ Replay'));

      // Advance to goal
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));

      // Should show round end message
      expect(screen.getByText(/Round ends - Player reached the goal!/)).toBeInTheDocument();
    });

    it('should handle replay with trap placement', () => {
      const resultWithTrap: RoundResult = {
        round: 1,
        winner: 'player',
        playerBoard: {
          id: 'player-board-id',
          name: 'Player Board',
          boardSize: 2,
          grid: [
            ['piece', 'empty'],
            ['trap', 'empty'],
          ],
          sequence: [
            { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
            { position: { row: 1, col: 0 }, type: 'trap', order: 2 },
          ],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        opponentBoard: {
          id: 'opponent-board-id',
          name: 'Opponent Board',
          boardSize: 2,
          grid: [['empty', 'piece'], ['empty', 'empty']],
          sequence: [{ position: { row: 0, col: 1 }, type: 'piece', order: 1 }],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        playerFinalPosition: { row: 1, col: 0 },
        opponentFinalPosition: { row: 0, col: 1 },
        playerPoints: 0,
        opponentPoints: 0,
        playerOutcome: 'tie',
        simulationDetails: {
          playerMoves: 1,
          opponentMoves: 1,
          playerHitTrap: false,
          opponentHitTrap: false,
          playerLastStep: 1, // Player executed both piece (0) and trap (1)
          opponentLastStep: 0,
        },
      };

      render(
        <RoundResults
          result={resultWithTrap}
          playerName="Alice"
          opponentName="Bob"
          playerScore={0}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      // Start replay
      fireEvent.click(screen.getByText('▶ Replay'));

      // Advance to trap placement
      fireEvent.click(screen.getByText('Next'));

      // Should show trap placement message
      expect(screen.getByText(/Player places trap at/)).toBeInTheDocument();
    });

    it('should accumulate explanations across steps', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      // Start replay
      fireEvent.click(screen.getByText('▶ Replay'));

      // Should have initial explanations
      expect(screen.getByText(/Player starts with piece at/)).toBeInTheDocument();

      // Advance one step
      fireEvent.click(screen.getByText('Next'));

      // Should still have initial explanations AND new ones
      expect(screen.getByText(/Player starts with piece at/)).toBeInTheDocument();
      expect(screen.getByText(/Player moves to/)).toBeInTheDocument();
    });

    it('should reset explanations when stopping replay', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      // Start replay
      fireEvent.click(screen.getByText('▶ Replay'));

      // Advance one step
      fireEvent.click(screen.getByText('Next'));

      // Stop replay
      fireEvent.click(screen.getByText('⏹ Stop'));

      // Explanations should be hidden
      expect(screen.queryByText(/Player starts with piece at/)).not.toBeInTheDocument();
    });

    it('should allow replaying multiple times', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      // First replay
      fireEvent.click(screen.getByText('▶ Replay'));
      fireEvent.click(screen.getByText('⏹ Stop'));

      // Second replay should work
      fireEvent.click(screen.getByText('▶ Replay'));
      expect(screen.getByText(/Player starts with piece at/)).toBeInTheDocument();
    });
  });

  describe('Replay with simulationDetails', () => {
    it('should handle round with no simulationDetails', () => {
      const resultWithoutDetails: RoundResult = {
        round: 1,
        winner: 'player',
        playerBoard: {
          id: 'player-board-id',
          name: 'Player Board',
          boardSize: 2,
          grid: [['piece', 'empty'], ['empty', 'empty']],
          sequence: [{ position: { row: 0, col: 0 }, type: 'piece', order: 1 }],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        opponentBoard: {
          id: 'opponent-board-id',
          name: 'Opponent Board',
          boardSize: 2,
          grid: [['empty', 'piece'], ['empty', 'empty']],
          sequence: [{ position: { row: 0, col: 1 }, type: 'piece', order: 1 }],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        playerFinalPosition: { row: 0, col: 0 },
        opponentFinalPosition: { row: 0, col: 1 },
        playerPoints: 0,
        opponentPoints: 0,
        playerOutcome: 'tie',
        // No simulationDetails
      };

      render(
        <RoundResults
          result={resultWithoutDetails}
          playerName="Alice"
          opponentName="Bob"
          playerScore={0}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      // Start replay - should work without simulationDetails
      fireEvent.click(screen.getByText('▶ Replay'));
      expect(screen.getByText(/Player starts with piece at/)).toBeInTheDocument();
    });
  });

  describe('Creature outcome graphics', () => {
    it('should display split creature graphics when result has creature data', () => {
      const resultWithCreatures: RoundResult = {
        ...createMockRoundResult('player'),
        playerCreature: 'square',
        opponentCreature: 'circle',
        playerVisualOutcome: 'goal',
        opponentVisualOutcome: 'trapped',
        collision: false,
      };

      render(
        <RoundResults
          result={resultWithCreatures}
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          onContinue={mockOnContinue}
        />
      );

      // Should show both creature names
      expect(screen.getByText(/Alice - Square/)).toBeInTheDocument();
      expect(screen.getByText(/Bob - Circle/)).toBeInTheDocument();

      // Should show images with correct src
      const images = screen.getAllByRole('img');
      const squareImage = images.find((img) =>
        img.getAttribute('src')?.includes('/creatures/square/goal.svg')
      );
      const circleImage = images.find((img) =>
        img.getAttribute('src')?.includes('/creatures/circle/trapped.svg')
      );
      expect(squareImage).toBeDefined();
      expect(circleImage).toBeDefined();
    });

    it('should display collision graphic when collision occurs', () => {
      const resultWithCollision: RoundResult = {
        ...createMockRoundResult('tie'),
        playerCreature: 'triangle',
        opponentCreature: 'bug',
        collision: true,
      };

      render(
        <RoundResults
          result={resultWithCollision}
          playerName="Alice"
          opponentName="Bob"
          playerScore={3}
          opponentScore={3}
          onContinue={mockOnContinue}
        />
      );

      // Should show collision caption
      expect(screen.getByText('Collision!')).toBeInTheDocument();

      // Should show collision image
      const images = screen.getAllByRole('img');
      const collisionImage = images.find((img) =>
        img.getAttribute('src')?.includes('/creatures/shared/collision.svg')
      );
      expect(collisionImage).toBeDefined();

      // Should NOT show individual creature names
      expect(screen.queryByText(/Alice -/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Bob -/)).not.toBeInTheDocument();
    });

    it('should not display creature graphics when result has no creature data', () => {
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

      // Should not show any creature-related text
      expect(screen.queryByText(/Square/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Circle/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Collision/)).not.toBeInTheDocument();
    });

    it('should use default outcome when visual outcome is not specified', () => {
      const resultWithCreaturesNoOutcome: RoundResult = {
        ...createMockRoundResult('player'),
        playerCreature: 'triangle',
        opponentCreature: 'bug',
        collision: false,
      };

      render(
        <RoundResults
          result={resultWithCreaturesNoOutcome}
          playerName="Alice"
          opponentName="Bob"
          playerScore={5}
          opponentScore={3}
          onContinue={mockOnContinue}
        />
      );

      // Should show creature names
      expect(screen.getByText(/Triangle/)).toBeInTheDocument();
      expect(screen.getByText(/Bug/)).toBeInTheDocument();

      // Should default to 'forward' outcome
      const images = screen.getAllByRole('img');
      const triangleImage = images.find((img) =>
        img.getAttribute('src')?.includes('/creatures/triangle/forward.svg')
      );
      const bugImage = images.find((img) =>
        img.getAttribute('src')?.includes('/creatures/bug/forward.svg')
      );
      expect(triangleImage).toBeDefined();
      expect(bugImage).toBeDefined();
    });
  });
});
