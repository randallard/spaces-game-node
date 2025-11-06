/**
 * Tests for BoardCreator component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardCreator } from './BoardCreator';
import type { Board } from '@/types';

describe('BoardCreator', () => {
  const mockOnBoardSaved = vi.fn();
  const mockOnCancel = vi.fn();
  const existingBoards: Board[] = [];

  const defaultProps = {
    onBoardSaved: mockOnBoardSaved,
    onCancel: mockOnCancel,
    existingBoards,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should render in choosing-start phase', () => {
      render(<BoardCreator {...defaultProps} />);

      expect(screen.getByText('Choose a starting square')).toBeInTheDocument();
      expect(screen.queryByText('Final Move')).not.toBeInTheDocument();
    });

    it('should show Start buttons only on bottom row', () => {
      const { container } = render(<BoardCreator {...defaultProps} />);
      const cells = container.querySelectorAll('[aria-label^="Cell"]');

      // Should have 4 cells (2x2 grid)
      expect(cells).toHaveLength(4);

      // Bottom row (row 1) should have Start buttons
      const startButtons = screen.getAllByText('Start');
      expect(startButtons).toHaveLength(2);
    });

    it('should render Cancel button', () => {
      render(<BoardCreator {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Choosing start position', () => {
    it('should allow clicking Start on bottom row', () => {
      render(<BoardCreator {...defaultProps} />);

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Should transition to building phase
      expect(screen.getByText(/Select an adjacent square/)).toBeInTheDocument();
      expect(screen.getByText('Restart')).toBeInTheDocument();
    });

    it('should show piece at chosen position', () => {
      render(<BoardCreator {...defaultProps} />);

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Should show piece icon
      expect(screen.getByText('⚫')).toBeInTheDocument();
    });

    it('should show Move and Trap buttons on adjacent squares', () => {
      render(<BoardCreator {...defaultProps} />);

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!); // Click bottom-left (1,0)

      // Should have Move and Trap buttons for adjacent squares
      const moveButtons = screen.getAllByText('Move');
      const trapButtons = screen.getAllByText('Trap');

      // Bottom-left (1,0) has 2 adjacent squares: top (0,0) and right (1,1)
      expect(moveButtons.length).toBeGreaterThan(0);
      expect(trapButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Building phase', () => {
    it('should allow moving piece to adjacent square', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start at bottom-left (1,0)
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Move to top-left (0,0)
      const moveButtons = screen.getAllByText('Move');
      fireEvent.click(moveButtons[0]!);

      // Piece should still be visible
      expect(screen.getByText('⚫')).toBeInTheDocument();
    });

    it('should allow placing trap on adjacent square', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start at bottom-left (1,0)
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Place trap on adjacent square
      const trapButtons = screen.getAllByText('Trap');
      fireEvent.click(trapButtons[0]!);

      // Should show trap icon
      expect(screen.getByText('✖')).toBeInTheDocument();
    });

    it('should allow placing trap where piece was previously', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start at bottom-left (1,0)
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Move to top-left (0,0)
      let moveButtons = screen.getAllByText('Move');
      fireEvent.click(moveButtons[0]!);

      // Place trap at previous position (1,0)
      const trapButtons = screen.getAllByText('Trap');
      fireEvent.click(trapButtons[0]!);

      // Should show trap icon
      expect(screen.getByText('✖')).toBeInTheDocument();
    });

    it('should show Final Move button when piece reaches row 0', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start at bottom-left (1,0)
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Move to top-left (0,0)
      const moveButtons = screen.getAllByText('Move');
      fireEvent.click(moveButtons[0]!);

      // Should show Final Move button
      expect(screen.getByText('Final Move')).toBeInTheDocument();
    });

    it('should not show Final Move button when piece is not at row 0', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start at bottom-left (1,0)
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Should not show Final Move button yet
      expect(screen.queryByText('Final Move')).not.toBeInTheDocument();
    });
  });

  describe('Final move', () => {
    it('should save board when Final Move is clicked', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start at bottom-left (1,0)
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Move to top-left (0,0)
      const moveButtons = screen.getAllByText('Move');
      fireEvent.click(moveButtons[0]!);

      // Click Final Move
      const finalMoveButton = screen.getByText('Final Move');
      fireEvent.click(finalMoveButton);

      // Should call onBoardSaved
      expect(mockOnBoardSaved).toHaveBeenCalledTimes(1);
      const savedBoard = mockOnBoardSaved.mock.calls[0]?.[0] as Board;
      expect(savedBoard).toBeDefined();
      expect(savedBoard.name).toBe('Board 1');
      expect(savedBoard.sequence).toHaveLength(3); // piece, piece, final
    });

    it('should auto-generate board name based on existing boards', () => {
      const existingBoards: Board[] = [
        {
          id: '1',
          name: 'Board 1',
          grid: [['piece', 'empty'], ['empty', 'empty']],
          sequence: [],
          thumbnail: '',
          createdAt: Date.now(),
        },
      ];

      render(<BoardCreator {...defaultProps} existingBoards={existingBoards} />);

      // Start and move to row 0
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      const moveButtons = screen.getAllByText('Move');
      fireEvent.click(moveButtons[0]!);

      // Click Final Move
      const finalMoveButton = screen.getByText('Final Move');
      fireEvent.click(finalMoveButton);

      const savedBoard = mockOnBoardSaved.mock.calls[0]?.[0] as Board;
      expect(savedBoard.name).toBe('Board 2');
    });

    it('should include final move at row -1 in sequence', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start at bottom-left (1,0)
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Move to top-left (0,0)
      const moveButtons = screen.getAllByText('Move');
      fireEvent.click(moveButtons[0]!);

      // Click Final Move
      const finalMoveButton = screen.getByText('Final Move');
      fireEvent.click(finalMoveButton);

      const savedBoard = mockOnBoardSaved.mock.calls[0]?.[0] as Board;
      const finalMove = savedBoard.sequence[savedBoard.sequence.length - 1];
      expect(finalMove?.type).toBe('final');
      expect(finalMove?.position.row).toBe(-1);
    });
  });

  describe('Validation', () => {
    it('should not show validation errors initially', () => {
      // This is a harder test because we need to create an invalid state
      // For now, we'll just verify that no errors are shown initially
      render(<BoardCreator {...defaultProps} />);

      // Errors should not be visible initially
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe('Restart functionality', () => {
    it('should show Restart button during building phase', () => {
      render(<BoardCreator {...defaultProps} />);

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      expect(screen.getByText('Restart')).toBeInTheDocument();
    });

    it('should reset to choosing-start phase when Restart is clicked', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start building
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      expect(screen.getByText(/Select an adjacent square/)).toBeInTheDocument();

      // Click Restart
      const restartButton = screen.getByText('Restart');
      fireEvent.click(restartButton);

      // Should return to choosing-start phase
      expect(screen.getByText('Choose a starting square')).toBeInTheDocument();
      expect(screen.queryByText('Restart')).not.toBeInTheDocument();
    });

    it('should clear piece and sequence when restarted', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start and move
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      expect(screen.getByText('⚫')).toBeInTheDocument();

      // Restart
      const restartButton = screen.getByText('Restart');
      fireEvent.click(restartButton);

      // Piece should be gone
      expect(screen.queryByText('⚫')).not.toBeInTheDocument();
    });
  });

  describe('Cancel functionality', () => {
    it('should call onCancel when Cancel button is clicked', () => {
      render(<BoardCreator {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel during building phase', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start building
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Grid rendering', () => {
    it('should render 2x2 grid', () => {
      const { container } = render(<BoardCreator {...defaultProps} />);
      const cells = container.querySelectorAll('[aria-label^="Cell"]');
      expect(cells).toHaveLength(4);
    });

    it('should render cells with correct aria-labels', () => {
      render(<BoardCreator {...defaultProps} />);

      expect(screen.getByLabelText('Cell 0,0')).toBeInTheDocument();
      expect(screen.getByLabelText('Cell 0,1')).toBeInTheDocument();
      expect(screen.getByLabelText('Cell 1,0')).toBeInTheDocument();
      expect(screen.getByLabelText('Cell 1,1')).toBeInTheDocument();
    });
  });

  describe('Adjacent position logic', () => {
    it('should only show buttons for orthogonally adjacent squares', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start at bottom-left (1,0)
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Adjacent to (1,0): (0,0) up and (1,1) right
      // Should have Move/Trap buttons for these 2 positions
      const moveButtons = screen.getAllByText('Move');
      const trapButtons = screen.getAllByText('Trap');

      // Each adjacent position gets Move AND Trap button = 2 positions × 2 buttons = 4 total
      expect(moveButtons.length + trapButtons.length).toBe(4);
    });

    it('should not show buttons on squares with traps', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start at bottom-left (1,0)
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Place trap on adjacent square
      const trapButtons = screen.getAllByText('Trap');
      const initialTrapCount = trapButtons.length;
      fireEvent.click(trapButtons[0]!);

      // After placing trap, that square should not have Move/Trap buttons
      const newTrapButtons = screen.getAllByText('Trap');
      expect(newTrapButtons.length).toBeLessThan(initialTrapCount);
    });
  });

  describe('Sequence tracking', () => {
    it('should track piece moves in sequence', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start at (1,0)
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Move to (0,0)
      const moveButtons = screen.getAllByText('Move');
      fireEvent.click(moveButtons[0]!);

      // Click Final Move
      const finalMoveButton = screen.getByText('Final Move');
      fireEvent.click(finalMoveButton);

      const savedBoard = mockOnBoardSaved.mock.calls[0]?.[0] as Board;
      const pieceMoves = savedBoard.sequence.filter(m => m.type === 'piece');
      expect(pieceMoves).toHaveLength(2); // Start + Move
    });

    it('should assign consecutive order numbers', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start and move to row 0
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      const moveButtons = screen.getAllByText('Move');
      fireEvent.click(moveButtons[0]!);

      // Final move
      const finalMoveButton = screen.getByText('Final Move');
      fireEvent.click(finalMoveButton);

      const savedBoard = mockOnBoardSaved.mock.calls[0]?.[0] as Board;
      savedBoard.sequence.forEach((move, idx) => {
        expect(move.order).toBe(idx + 1);
      });
    });
  });

  describe('Instruction text', () => {
    it('should show correct instruction in choosing-start phase', () => {
      render(<BoardCreator {...defaultProps} />);
      expect(screen.getByText('Choose a starting square')).toBeInTheDocument();
    });

    it('should show correct instruction in building phase', () => {
      render(<BoardCreator {...defaultProps} />);

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      expect(screen.getByText(/Select an adjacent square/)).toBeInTheDocument();
    });
  });
});
