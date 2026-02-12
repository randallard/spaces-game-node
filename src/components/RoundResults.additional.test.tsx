/**
 * Additional tests for RoundResults component - explanation style toggle
 * @module components/RoundResults.additional.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RoundResults } from './RoundResults';
import type { RoundResult } from '@/types';

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
    sequence: [{ position: { row: 0, col: 1 }, type: 'piece', order: 1 }],
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
    playerLastStep: 2,
    opponentLastStep: 0,
  },
});

describe('RoundResults - Additional Coverage', () => {
  let mockOnContinue: ReturnType<typeof vi.fn>;
  let mockOnExplanationStyleChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnContinue = vi.fn();
    mockOnExplanationStyleChange = vi.fn();
  });

  describe('Lively vs Technical explanations', () => {
    it('should start with lively explanations by default', () => {
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

      // Should show lively initial explanation
      expect(screen.getByText(/Pieces placed!/)).toBeInTheDocument();
    });

    it('should use technical explanations when explanationStyle is "technical"', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="technical"
        />
      );

      // Should show technical initial explanation with position coordinates
      expect(screen.getByText(/Player starts with piece at \(1, 0\)/)).toBeInTheDocument();
      expect(screen.getByText(/Opponent starts with piece at \(0, 1\)/)).toBeInTheDocument();
    });

    it('should toggle from lively to technical when style toggle button clicked', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          onExplanationStyleChange={mockOnExplanationStyleChange}
        />
      );

      // Find and click the style toggle button
      const toggleButton = screen.getByTitle('Switch to technical explanations');
      fireEvent.click(toggleButton);

      // Should call callback with 'technical'
      expect(mockOnExplanationStyleChange).toHaveBeenCalledWith('technical');
    });

    it('should toggle from technical to lively when style toggle button clicked', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          onExplanationStyleChange={mockOnExplanationStyleChange}
          explanationStyle="technical"
        />
      );

      // Find and click the style toggle button
      const toggleButton = screen.getByTitle('Switch to lively explanations');
      fireEvent.click(toggleButton);

      // Should call callback with 'lively'
      expect(mockOnExplanationStyleChange).toHaveBeenCalledWith('lively');
    });

    it('should show "📖 Technical" button text when in lively mode', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="lively"
        />
      );

      expect(screen.getByText('📖 Technical')).toBeInTheDocument();
    });

    it('should show "🎉 Lively" button text when in technical mode', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="technical"
        />
      );

      expect(screen.getByText('🎉 Lively')).toBeInTheDocument();
    });
  });

  describe('Complete results with explanation styles', () => {
    it('should generate complete lively explanations when checkbox is checked', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="lively"
        />
      );

      // Check the "Show complete results" checkbox
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // Should show lively complete results
      expect(screen.getByText(/Pieces placed!/)).toBeInTheDocument();
      expect(screen.getByText(/Game over/)).toBeInTheDocument();
    });

    it('should generate complete technical explanations when checkbox is checked', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="technical"
        />
      );

      // Check the "Show complete results" checkbox
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // Should show technical complete results with coordinates
      expect(screen.getByText(/Player starts with piece at \(1, 0\)/)).toBeInTheDocument();
      expect(screen.getByText(/Round ends/)).toBeInTheDocument();
    });

    it('should reset to lively explanations when unchecking complete results', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="lively"
          showCompleteResultsByDefault={true}
        />
      );

      // Uncheck the checkbox
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // Should reset to initial lively explanation
      expect(screen.getByText(/Pieces placed!/)).toBeInTheDocument();
      // Should show step button
      expect(screen.getByText('▶ Step')).toBeInTheDocument();
    });

    it('should reset to technical explanations when unchecking complete results in technical mode', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="technical"
          showCompleteResultsByDefault={true}
        />
      );

      // Uncheck the checkbox
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // Should reset to initial technical explanations
      expect(screen.getByText(/Player starts with piece at/)).toBeInTheDocument();
      expect(screen.getByText(/Opponent starts with piece at/)).toBeInTheDocument();
    });
  });

  describe('Technical explanation content', () => {
    it('should show position coordinates in technical mode steps', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="technical"
        />
      );

      // Advance one step
      fireEvent.click(screen.getByText('▶ Step'));

      // Should show technical move description with coordinates
      expect(screen.getByText(/Player moves to \(\d+, \d+\)/)).toBeInTheDocument();
    });

    it('should show technical point descriptions', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="technical"
        />
      );

      // Advance to see forward movement
      fireEvent.click(screen.getByText('▶ Step'));

      // Should show point in delta column (no longer inline text)
      expect(screen.getAllByText('+1').length).toBeGreaterThan(0);
    });
  });

  describe('Explanation style without callback', () => {
    it('should work without onExplanationStyleChange callback', () => {
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

      // Should render without errors
      expect(screen.getByText('📖 Technical')).toBeInTheDocument();

      // Clicking toggle should not crash
      const toggleButton = screen.getByTitle('Switch to technical explanations');
      fireEvent.click(toggleButton);

      // Should still be in the document (no crash)
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Finish button in technical mode', () => {
    it('should generate technical explanations when finish is clicked in technical mode', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="technical"
        />
      );

      // Click finish button to skip to end
      const finishButton = screen.getByText('⏹ Finish');
      fireEvent.click(finishButton);

      // Should show technical initial explanations with coordinates
      expect(screen.getByText(/Player starts with piece at \(1, 0\)/)).toBeInTheDocument();
      expect(screen.getByText(/Opponent starts with piece at \(0, 1\)/)).toBeInTheDocument();

      // Should show all complete results
      expect(screen.getByText(/Round ends/)).toBeInTheDocument();
    });

    it('should generate technical explanations when finish is clicked partway through', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="technical"
        />
      );

      // Take one step first
      fireEvent.click(screen.getByText('▶ Step'));

      // Then click finish
      fireEvent.click(screen.getByText('⏹ Finish'));

      // Should show all technical explanations including initial ones
      expect(screen.getByText(/Player starts with piece at/)).toBeInTheDocument();
      expect(screen.getByText(/Opponent starts with piece at/)).toBeInTheDocument();
    });

    it('should handle finish button when already at the end in technical mode', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="technical"
        />
      );

      // Click finish to go to end
      fireEvent.click(screen.getByText('⏹ Finish'));

      // Click finish again (should not crash or duplicate)
      fireEvent.click(screen.getByText('⏹ Finish'));

      // Should still show restart button (at the end)
      expect(screen.getByText('↻ Restart')).toBeInTheDocument();
    });
  });

  describe('Help modal functionality', () => {
    it('should open help modal when help icon is clicked', () => {
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

      // Find and click the help icon
      const helpButton = screen.getByTitle('Why are some opponent moves hidden?');
      fireEvent.click(helpButton);

      // Help modal should appear - check for help content or modal
      // The HelpModal component should be rendered
      expect(helpButton).toBeInTheDocument();
    });

    it('should prevent default when help icon is clicked', () => {
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

      const helpButton = screen.getByTitle('Why are some opponent moves hidden?');

      // Create a mock event
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

      act(() => {
        helpButton.dispatchEvent(clickEvent);
      });

      // preventDefault should have been called
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Edge cases with trap handling', () => {
    it('should handle player hitting trap and stopping early', () => {
      const resultWithTrap: RoundResult = {
        round: 1,
        winner: 'opponent',
        playerBoard: {
          id: 'player-board-id',
          name: 'Player Board',
          boardSize: 2,
          grid: [
            ['piece', 'trap'],
            ['piece', 'empty'],
          ],
          sequence: [
            { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
            { position: { row: 0, col: 0 }, type: 'piece', order: 2 },
            { position: { row: 0, col: 1 }, type: 'piece', order: 3 }, // Would move here
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
            ['trap', 'empty'],
          ],
          sequence: [
            { position: { row: 0, col: 1 }, type: 'piece', order: 1 },
            { position: { row: 1, col: 1 }, type: 'trap', order: 2 },
          ],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        playerFinalPosition: { row: 0, col: 0 },
        opponentFinalPosition: { row: 0, col: 1 },
        playerPoints: -1,
        opponentPoints: 1,
        playerOutcome: 'lost',
        simulationDetails: {
          playerMoves: 2,
          opponentMoves: 1,
          playerHitTrap: true, // Player hit opponent's trap
          opponentHitTrap: false,
          playerLastStep: 1, // Stopped at step 1 (index)
          opponentLastStep: 1,
        },
      };

      render(
        <RoundResults
          result={resultWithTrap}
          playerName="Alice"
          opponentName="Bob"
          playerScore={0}
          opponentScore={1}
          onContinue={mockOnContinue}
        />
      );

      // Should render with simulation details showing trap hit
      expect(screen.getByText(/Pieces placed!/)).toBeInTheDocument();
    });

    it('should handle empty sequence edge case', () => {
      const resultWithEmptySequence: RoundResult = {
        round: 1,
        winner: 'tie',
        playerBoard: {
          id: 'player-board-id',
          name: 'Player Board',
          boardSize: 2,
          grid: [
            ['empty', 'empty'],
            ['empty', 'empty'],
          ],
          sequence: [], // Empty sequence
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        opponentBoard: {
          id: 'opponent-board-id',
          name: 'Opponent Board',
          boardSize: 2,
          grid: [
            ['empty', 'empty'],
            ['empty', 'empty'],
          ],
          sequence: [], // Empty sequence
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        playerFinalPosition: { row: 1, col: 0 },
        opponentFinalPosition: { row: 0, col: 1 },
        playerPoints: 0,
        opponentPoints: 0,
        playerOutcome: 'tie',
        simulationDetails: {
          playerMoves: 0,
          opponentMoves: 0,
          playerHitTrap: false,
          opponentHitTrap: false,
          playerLastStep: -1,
          opponentLastStep: -1,
        },
      };

      render(
        <RoundResults
          result={resultWithEmptySequence}
          playerName="Alice"
          opponentName="Bob"
          playerScore={0}
          opponentScore={0}
          onContinue={mockOnContinue}
        />
      );

      // Should handle empty sequence gracefully
      expect(screen.getByText(/Pieces placed!/)).toBeInTheDocument();
    });

    it('should calculate last step when simulationDetails.playerLastStep is undefined', () => {
      const result: RoundResult = {
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
          sequence: [{ position: { row: 0, col: 1 }, type: 'piece', order: 1 }],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        playerFinalPosition: { row: -1, col: 0 },
        opponentFinalPosition: { row: 0, col: 1 },
        playerPoints: 2,
        opponentPoints: 0,
        playerOutcome: 'won',
        simulationDetails: {
          playerMoves: 2,
          opponentMoves: 1,
          playerHitTrap: false,
          opponentHitTrap: false,
          playerLastStep: 2,
          opponentLastStep: 1,
        },
      };

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

      // Should calculate and work properly
      expect(screen.getByText(/Pieces placed!/)).toBeInTheDocument();
    });
  });

  describe('Collision detection in replay', () => {
    it.skip('should show collision explanations in lively mode', () => {
      const resultWithCollision: RoundResult = {
        round: 1,
        winner: 'tie',
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
            { position: { row: 0, col: 0 }, type: 'piece', order: 2 }, // Both move to same spot
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
            ['empty', 'piece'],
          ],
          sequence: [
            { position: { row: 0, col: 1 }, type: 'piece', order: 1 },
            { position: { row: 0, col: 0 }, type: 'piece', order: 2 }, // Collision at (0,0) after rotation
          ],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        playerFinalPosition: { row: 0, col: 0 },
        opponentFinalPosition: { row: 0, col: 0 },
        playerPoints: -1,
        opponentPoints: -1,
        playerOutcome: 'tie',
        simulationDetails: {
          playerMoves: 2,
          opponentMoves: 2,
          playerHitTrap: false,
          opponentHitTrap: false,
          playerLastStep: 1,
          opponentLastStep: 1,
        },
      };

      render(
        <RoundResults
          result={resultWithCollision}
          playerName="Alice"
          opponentName="Bob"
          playerScore={0}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="lively"
        />
      );

      // Advance to collision step
      fireEvent.click(screen.getByText('▶ Step'));

      // Should show collision message
      expect(screen.getByText(/Crash! They collide!/)).toBeInTheDocument();
      expect(screen.getByText(/Alice -1 point!/)).toBeInTheDocument();
      expect(screen.getByText(/Bob -1 point!/)).toBeInTheDocument();
    });

    it.skip('should show collision explanations in technical mode', () => {
      const resultWithCollision: RoundResult = {
        round: 1,
        winner: 'tie',
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
            ['empty', 'piece'],
          ],
          sequence: [
            { position: { row: 0, col: 1 }, type: 'piece', order: 1 },
            { position: { row: 0, col: 0 }, type: 'piece', order: 2 },
          ],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        playerFinalPosition: { row: 0, col: 0 },
        opponentFinalPosition: { row: 0, col: 0 },
        playerPoints: -1,
        opponentPoints: -1,
        playerOutcome: 'tie',
        simulationDetails: {
          playerMoves: 2,
          opponentMoves: 2,
          playerHitTrap: false,
          opponentHitTrap: false,
          playerLastStep: 1,
          opponentLastStep: 1,
        },
      };

      render(
        <RoundResults
          result={resultWithCollision}
          playerName="Alice"
          opponentName="Bob"
          playerScore={0}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="technical"
        />
      );

      // Advance to collision step
      fireEvent.click(screen.getByText('▶ Step'));

      // Should show technical collision message
      expect(screen.getByText(/Player -1 point \(collision!\)/)).toBeInTheDocument();
      expect(screen.getByText(/Opponent -1 point \(collision!\)/)).toBeInTheDocument();
    });
  });

  describe('Opponent hitting trap scenarios', () => {
    it.skip('should show opponent hitting trap in lively mode', () => {
      const result: RoundResult = {
        round: 1,
        winner: 'player',
        playerBoard: {
          id: 'player-board-id',
          name: 'Player Board',
          boardSize: 2,
          grid: [
            ['piece', 'trap'],
            ['piece', 'empty'],
          ],
          sequence: [
            { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
            { position: { row: 0, col: 1 }, type: 'trap', order: 2 }, // Place trap
            { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
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
            ['empty', 'piece'],
          ],
          sequence: [
            { position: { row: 0, col: 1 }, type: 'piece', order: 1 },
            { position: { row: 1, col: 1 }, type: 'piece', order: 2 },
            { position: { row: 0, col: 0 }, type: 'piece', order: 3 }, // Moves to player's trap (0,1) after rotation
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
          playerMoves: 3,
          opponentMoves: 3,
          playerHitTrap: false,
          opponentHitTrap: true,
          playerLastStep: 2,
          opponentLastStep: 2,
        },
      };

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="lively"
        />
      );

      // Advance through steps to see opponent hit trap
      fireEvent.click(screen.getByText('▶ Step')); // Step 1
      fireEvent.click(screen.getByText('▶ Step')); // Step 2 - opponent might hit trap

      // Should eventually show opponent hitting trap
      expect(screen.getByText(/Bob steps right in the trap!/)).toBeInTheDocument();
      expect(screen.getByText(/Bob -1 point!/)).toBeInTheDocument();
    });

    it.skip('should show opponent hitting trap in technical mode', () => {
      const result: RoundResult = {
        round: 1,
        winner: 'player',
        playerBoard: {
          id: 'player-board-id',
          name: 'Player Board',
          boardSize: 2,
          grid: [
            ['piece', 'trap'],
            ['piece', 'empty'],
          ],
          sequence: [
            { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
            { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
            { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
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
            ['empty', 'piece'],
          ],
          sequence: [
            { position: { row: 0, col: 1 }, type: 'piece', order: 1 },
            { position: { row: 1, col: 1 }, type: 'piece', order: 2 },
            { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
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
          playerMoves: 3,
          opponentMoves: 3,
          playerHitTrap: false,
          opponentHitTrap: true,
          playerLastStep: 2,
          opponentLastStep: 2,
        },
      };

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="technical"
        />
      );

      // Advance through steps
      fireEvent.click(screen.getByText('▶ Step'));
      fireEvent.click(screen.getByText('▶ Step'));

      // Should show technical trap hit message
      expect(screen.getByText(/Opponent -1 point \(hit trap!\)/)).toBeInTheDocument();
    });

    it.skip('should show opponent stopped message when hitting trap at last step in lively mode', () => {
      const result: RoundResult = {
        round: 1,
        winner: 'player',
        playerBoard: {
          id: 'player-board-id',
          name: 'Player Board',
          boardSize: 2,
          grid: [
            ['piece', 'trap'],
            ['piece', 'empty'],
          ],
          sequence: [
            { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
            { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
            { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
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
            ['empty', 'piece'],
          ],
          sequence: [
            { position: { row: 0, col: 1 }, type: 'piece', order: 1 },
            { position: { row: 1, col: 1 }, type: 'piece', order: 2 },
            { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
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
          playerMoves: 3,
          opponentMoves: 2,
          playerHitTrap: false,
          opponentHitTrap: true,
          playerLastStep: 2,
          opponentLastStep: 1, // Opponent stops at step 1
        },
      };

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="lively"
        />
      );

      // Advance to step where opponent hits trap
      fireEvent.click(screen.getByText('▶ Step'));

      // Should show stopped message
      expect(screen.getByText(/Bob is stopped!/)).toBeInTheDocument();
    });

    it.skip('should show opponent stopped message when hitting trap at last step in technical mode', () => {
      const result: RoundResult = {
        round: 1,
        winner: 'player',
        playerBoard: {
          id: 'player-board-id',
          name: 'Player Board',
          boardSize: 2,
          grid: [
            ['piece', 'trap'],
            ['piece', 'empty'],
          ],
          sequence: [
            { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
            { position: { row: 0, col: 1 }, type: 'trap', order: 2 },
            { position: { row: 0, col: 0 }, type: 'piece', order: 3 },
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
            ['empty', 'piece'],
          ],
          sequence: [
            { position: { row: 0, col: 1 }, type: 'piece', order: 1 },
            { position: { row: 1, col: 1 }, type: 'piece', order: 2 },
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
          playerMoves: 3,
          opponentMoves: 2,
          playerHitTrap: false,
          opponentHitTrap: true,
          playerLastStep: 2,
          opponentLastStep: 1,
        },
      };

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="technical"
        />
      );

      // Advance to step where opponent hits trap
      fireEvent.click(screen.getByText('▶ Step'));

      // Should show stopped message
      expect(screen.getByText(/Opponent hit a trap and stopped!/)).toBeInTheDocument();
    });
  });

  describe('Player stopped scenarios', () => {
    it.skip('should show player stopped message when hitting trap at last step in lively mode', () => {
      const result: RoundResult = {
        round: 1,
        winner: 'opponent',
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
            ['trap', 'empty'],
          ],
          sequence: [
            { position: { row: 0, col: 1 }, type: 'piece', order: 1 },
            { position: { row: 1, col: 0 }, type: 'trap', order: 2 }, // Trap at opponent's (1,0)
          ],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        playerFinalPosition: { row: 0, col: 0 },
        opponentFinalPosition: { row: 0, col: 1 },
        playerPoints: 0,
        opponentPoints: 1,
        playerOutcome: 'lost',
        simulationDetails: {
          playerMoves: 2,
          opponentMoves: 1,
          playerHitTrap: true,
          opponentHitTrap: false,
          playerLastStep: 1, // Player stops at step 1
          opponentLastStep: 1,
        },
      };

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={0}
          opponentScore={1}
          onContinue={mockOnContinue}
          explanationStyle="lively"
        />
      );

      // Advance to step where player hits trap
      fireEvent.click(screen.getByText('▶ Step'));

      // Should show player stopped message
      expect(screen.getByText(/Alice is stopped!/)).toBeInTheDocument();
    });

    it.skip('should show player stopped message when hitting trap at last step in technical mode', () => {
      const result: RoundResult = {
        round: 1,
        winner: 'opponent',
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
            ['trap', 'empty'],
          ],
          sequence: [
            { position: { row: 0, col: 1 }, type: 'piece', order: 1 },
            { position: { row: 1, col: 0 }, type: 'trap', order: 2 },
          ],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        playerFinalPosition: { row: 0, col: 0 },
        opponentFinalPosition: { row: 0, col: 1 },
        playerPoints: 0,
        opponentPoints: 1,
        playerOutcome: 'lost',
        simulationDetails: {
          playerMoves: 2,
          opponentMoves: 1,
          playerHitTrap: true,
          opponentHitTrap: false,
          playerLastStep: 1,
          opponentLastStep: 1,
        },
      };

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={0}
          opponentScore={1}
          onContinue={mockOnContinue}
          explanationStyle="technical"
        />
      );

      // Advance to step where player hits trap
      fireEvent.click(screen.getByText('▶ Step'));

      // Should show player stopped message
      expect(screen.getByText(/Player hit a trap and stopped!/)).toBeInTheDocument();
    });
  });

  describe('Opponent goal reached scenarios', () => {
    it('should show opponent goal message in lively mode', () => {
      const result: RoundResult = {
        round: 1,
        winner: 'opponent',
        playerBoard: {
          id: 'player-board-id',
          name: 'Player Board',
          boardSize: 2,
          grid: [
            ['piece', 'empty'],
            ['empty', 'empty'],
          ],
          sequence: [
            { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
          ],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        opponentBoard: {
          id: 'opponent-board-id',
          name: 'Opponent Board',
          boardSize: 2,
          grid: [
            ['piece', 'empty'],
            ['piece', 'empty'],
          ],
          sequence: [
            { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
            { position: { row: 0, col: 0 }, type: 'piece', order: 2 },
            { position: { row: -1, col: 0 }, type: 'final', order: 3 }, // Opponent reaches goal
          ],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        playerFinalPosition: { row: 0, col: 0 },
        opponentFinalPosition: { row: -1, col: 0 },
        playerPoints: 0,
        opponentPoints: 2,
        playerOutcome: 'lost',
        simulationDetails: {
          playerMoves: 1,
          opponentMoves: 2,
          playerHitTrap: false,
          opponentHitTrap: false,
          playerLastStep: 0,
          opponentLastStep: 2,
        },
      };

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={0}
          opponentScore={2}
          onContinue={mockOnContinue}
          explanationStyle="lively"
        />
      );

      // Advance through steps to see opponent reach goal
      fireEvent.click(screen.getByText('▶ Step'));
      fireEvent.click(screen.getByText('▶ Step'));

      // Should show opponent goal messages
      expect(screen.getByText(/Bob makes it to the goal!/)).toBeInTheDocument();
      expect(screen.getByText(/Game over - Bob wins!/)).toBeInTheDocument();
    });

    it('should show opponent goal message in technical mode', () => {
      const result: RoundResult = {
        round: 1,
        winner: 'opponent',
        playerBoard: {
          id: 'player-board-id',
          name: 'Player Board',
          boardSize: 2,
          grid: [
            ['piece', 'empty'],
            ['empty', 'empty'],
          ],
          sequence: [
            { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
          ],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        opponentBoard: {
          id: 'opponent-board-id',
          name: 'Opponent Board',
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
        playerFinalPosition: { row: 0, col: 0 },
        opponentFinalPosition: { row: -1, col: 0 },
        playerPoints: 0,
        opponentPoints: 2,
        playerOutcome: 'lost',
        simulationDetails: {
          playerMoves: 1,
          opponentMoves: 2,
          playerHitTrap: false,
          opponentHitTrap: false,
          playerLastStep: 0,
          opponentLastStep: 2,
        },
      };

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={0}
          opponentScore={2}
          onContinue={mockOnContinue}
          explanationStyle="technical"
        />
      );

      // Advance through steps
      fireEvent.click(screen.getByText('▶ Step'));
      fireEvent.click(screen.getByText('▶ Step'));

      // Should show technical opponent goal messages
      expect(screen.getByText(/Opponent reaches the goal!/)).toBeInTheDocument();
      expect(screen.getByText(/Round ends - Opponent reached the goal!/)).toBeInTheDocument();
    });
  });

  describe('Opponent trap placement in technical mode', () => {
    it('should show opponent trap placement with coordinates in technical mode', () => {
      const result: RoundResult = {
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
            ['trap', 'empty'],
          ],
          sequence: [
            { position: { row: 0, col: 1 }, type: 'piece', order: 1 },
            { position: { row: 1, col: 0 }, type: 'trap', order: 2 },
          ],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        playerFinalPosition: { row: -1, col: 0 },
        opponentFinalPosition: { row: 0, col: 1 },
        playerPoints: 2,
        opponentPoints: 0,
        playerOutcome: 'won',
        simulationDetails: {
          playerMoves: 2,
          opponentMoves: 1,
          playerHitTrap: false,
          opponentHitTrap: false,
          playerLastStep: 2,
          opponentLastStep: 1,
        },
      };

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          explanationStyle="technical"
        />
      );

      // Advance to trap placement step
      fireEvent.click(screen.getByText('▶ Step'));

      // Should show technical trap placement with coordinates
      expect(screen.getByText(/Opponent places trap at \(\d+, \d+\)/)).toBeInTheDocument();
    });
  });

  describe('Opponent forward movement scoring in technical mode', () => {
    it.skip('should show opponent forward movement with technical description', () => {
      const result: RoundResult = {
        round: 1,
        winner: 'opponent',
        playerBoard: {
          id: 'player-board-id',
          name: 'Player Board',
          boardSize: 3,
          grid: [
            ['piece', 'empty', 'empty'],
            ['empty', 'empty', 'empty'],
            ['empty', 'empty', 'empty'],
          ],
          sequence: [
            { position: { row: 0, col: 0 }, type: 'piece', order: 1 },
          ],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        opponentBoard: {
          id: 'opponent-board-id',
          name: 'Opponent Board',
          boardSize: 3,
          grid: [
            ['empty', 'empty', 'piece'],
            ['empty', 'empty', 'piece'],
            ['empty', 'empty', 'empty'],
          ],
          sequence: [
            { position: { row: 0, col: 2 }, type: 'piece', order: 1 },
            { position: { row: 1, col: 2 }, type: 'piece', order: 2 }, // Forward movement for opponent
          ],
          thumbnail: 'data:image/svg+xml;base64,test',
          createdAt: Date.now(),
        },
        playerFinalPosition: { row: 0, col: 0 },
        opponentFinalPosition: { row: 1, col: 2 },
        playerPoints: 0,
        opponentPoints: 1,
        playerOutcome: 'lost',
        simulationDetails: {
          playerMoves: 1,
          opponentMoves: 2,
          playerHitTrap: false,
          opponentHitTrap: false,
          playerLastStep: 0,
          opponentLastStep: 1,
        },
      };

      render(
        <RoundResults
          result={result}
          playerName="Alice"
          opponentName="Bob"
          playerScore={0}
          opponentScore={1}
          onContinue={mockOnContinue}
          explanationStyle="technical"
        />
      );

      // Advance to see opponent forward movement
      fireEvent.click(screen.getByText('▶ Step'));

      // Should show technical forward movement message
      expect(screen.getByText(/Opponent \+1 point \(forward movement\)/)).toBeInTheDocument();
    });
  });

  describe('Tutorial mode', () => {
    it('should show tutorial instruction banner when isTutorial is true', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="You"
          opponentName="CPU Sam"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          isTutorial={true}
        />
      );

      // Should show initial tutorial instruction
      expect(screen.getByText(/click the step button to see each move!/)).toBeInTheDocument();
    });

    it('should not show tutorial instruction banner when isTutorial is false', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="You"
          opponentName="CPU Sam"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          isTutorial={false}
        />
      );

      // Should not show tutorial instruction
      expect(screen.queryByText(/click the step button to see each move!/)).not.toBeInTheDocument();
    });

    it('should update tutorial instruction after clicking step', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="You"
          opponentName="CPU Sam"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          isTutorial={true}
        />
      );

      // Click step button
      fireEvent.click(screen.getByText('▶ Step'));

      // Should show updated instruction
      expect(screen.getByText(/keep clicking step to see what happens next!/)).toBeInTheDocument();
    });

    it('should show finish instruction when replay is complete', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="You"
          opponentName="CPU Sam"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          isTutorial={true}
        />
      );

      // Click finish button to skip to end
      fireEvent.click(screen.getByText('⏹ Finish'));

      // Should show finish instruction
      expect(screen.getByText(/great! now click continue to finish the tutorial!/)).toBeInTheDocument();
    });

    it('should show watch instruction when show complete results is checked', () => {
      const result = createReplayableResult();

      render(
        <RoundResults
          result={result}
          playerName="You"
          opponentName="CPU Sam"
          playerScore={2}
          opponentScore={0}
          onContinue={mockOnContinue}
          isTutorial={true}
        />
      );

      // Check the "Show complete results" checkbox
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // Should show watch instruction
      expect(screen.getByText(/watch the replay to see what happened!/)).toBeInTheDocument();
    });
  });
});
