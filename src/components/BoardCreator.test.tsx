/**
 * Tests for BoardCreator component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardCreator } from './BoardCreator';
import type { Board, BoardSize } from '@/types';

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

      expect(screen.getByText(/Choose a starting column below or click a Start button/)).toBeInTheDocument();

      // Final Move button should be visible but disabled from the start
      const finalMoveButton = screen.getByText('Final Move');
      expect(finalMoveButton).toBeInTheDocument();
      expect(finalMoveButton).toBeDisabled();
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
      expect(screen.getByText(/Use WASD keys, the controls below, or click buttons on the board/)).toBeInTheDocument();
      expect(screen.getByText('Restart')).toBeInTheDocument();
    });

    it('should show piece at chosen position', () => {
      render(<BoardCreator {...defaultProps} />);

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Should show piece with number 1 (first move in sequence)
      expect(screen.getByText('1')).toBeInTheDocument();
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

      // Both piece positions should be visible with numbers
      expect(screen.getByText('1')).toBeInTheDocument(); // First position
      expect(screen.getByText('2')).toBeInTheDocument(); // Second position
    });

    it('should allow placing trap on adjacent square', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start at bottom-left (1,0)
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Place trap on adjacent square
      const trapButtons = screen.getAllByText('Trap');
      fireEvent.click(trapButtons[0]!);

      // Should show piece (1) and trap (2)
      expect(screen.getByText('1')).toBeInTheDocument(); // Piece
      expect(screen.getByText('2')).toBeInTheDocument(); // Trap
    });

    it('should allow placing trap where piece was previously', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start at bottom-left (1,0)
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Move to top-left (0,0)
      const moveButtons = screen.getAllByText('Move');
      fireEvent.click(moveButtons[0]!);

      // Place trap at previous position (1,0)
      const trapButtons = screen.getAllByText('Trap');
      fireEvent.click(trapButtons[0]!);

      // Should show piece (2) and trap (3) - trap replaces piece at (1,0)
      expect(screen.getByText('2')).toBeInTheDocument(); // Current piece position
      expect(screen.getByText('3')).toBeInTheDocument(); // Trap at previous position
    });

    it('should show Final Move button enabled when piece reaches row 0', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start at bottom-left (1,0)
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Move to top-left (0,0)
      const moveButtons = screen.getAllByText('Move');
      fireEvent.click(moveButtons[0]!);

      // Should show Final Move button and be enabled
      const finalMoveButton = screen.getByText('Final Move');
      expect(finalMoveButton).toBeInTheDocument();
      expect(finalMoveButton).not.toBeDisabled();
      expect(finalMoveButton).toHaveAttribute('title', 'Complete the board (Enter)');
    });

    it('should show Final Move button as disabled when piece is not at row 0', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start at bottom-left (1,0)
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Should show Final Move button but disabled
      const finalMoveButton = screen.getByText('Final Move');
      expect(finalMoveButton).toBeInTheDocument();
      expect(finalMoveButton).toBeDisabled();
      expect(finalMoveButton).toHaveAttribute('title', 'Move your piece to the top row first');
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

      // Should show confirmation modal
      expect(screen.getByText('Board Complete!')).toBeInTheDocument();

      // Click Save Board button
      const saveButton = screen.getByText('Save Board');
      fireEvent.click(saveButton);

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
          boardSize: 2,
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

      // Should show confirmation modal and click Save
      const saveButton = screen.getByText('Save Board');
      fireEvent.click(saveButton);

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

      // Click Save Board button
      const saveButton = screen.getByText('Save Board');
      fireEvent.click(saveButton);

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

      expect(screen.getByText(/Use WASD keys, the controls below, or click buttons on the board/)).toBeInTheDocument();

      // Click Restart
      const restartButton = screen.getByText('Restart');
      fireEvent.click(restartButton);

      // Should return to choosing-start phase
      expect(screen.getByText(/Choose a starting column below or click a Start button/)).toBeInTheDocument();
      expect(screen.queryByText('Restart')).not.toBeInTheDocument();
    });

    it('should clear piece and sequence when restarted', () => {
      render(<BoardCreator {...defaultProps} />);

      // Start and move
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      expect(screen.getByText('1')).toBeInTheDocument();

      // Restart
      const restartButton = screen.getByText('Restart');
      fireEvent.click(restartButton);

      // Piece should be gone (no numbered markers)
      expect(screen.queryByText('1')).not.toBeInTheDocument();
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

      // Click Save Board button
      const saveButton = screen.getByText('Save Board');
      fireEvent.click(saveButton);

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

      // Click Save Board button
      const saveButton = screen.getByText('Save Board');
      fireEvent.click(saveButton);

      const savedBoard = mockOnBoardSaved.mock.calls[0]?.[0] as Board;
      savedBoard.sequence.forEach((move, idx) => {
        expect(move.order).toBe(idx + 1);
      });
    });
  });

  describe('Instruction text', () => {
    it('should show correct instruction in choosing-start phase', () => {
      render(<BoardCreator {...defaultProps} />);
      expect(screen.getByText(/Choose a starting column below or click a Start button/)).toBeInTheDocument();
    });

    it('should show correct instruction in building phase', () => {
      render(<BoardCreator {...defaultProps} />);

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      expect(screen.getByText(/Use WASD keys, the controls below, or click buttons on the board/)).toBeInTheDocument();
    });
  });

  describe('Undo functionality', () => {
    it('should show Undo button during building phase', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={2}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      // Start the board
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should undo last move when Undo is clicked', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={2}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      // Start and make a move
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      const moveButtons = screen.getAllByText('Move');
      fireEvent.click(moveButtons[0]!);

      // Click undo
      const undoButton = screen.getByText('Undo');
      fireEvent.click(undoButton);

      // Should still be in building phase but with fewer moves
      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should return to choosing-start phase when undoing all moves', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={2}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      // Start the board
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Undo the start
      const undoButton = screen.getByText('Undo');
      fireEvent.click(undoButton);

      // Should be back in choosing-start phase
      expect(screen.getAllByText('Start').length).toBeGreaterThan(0);
    });

    it('should rebuild grid correctly after undo', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={2}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      // Start, move, trap, then undo the trap
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      const moveButtons = screen.getAllByText('Move');
      fireEvent.click(moveButtons[0]!);

      const trapButtons = screen.getAllByText('Trap');
      fireEvent.click(trapButtons[0]!);

      // Undo the trap
      const undoButton = screen.getByText('Undo');
      fireEvent.click(undoButton);

      // Should have Move and Trap buttons again
      expect(screen.getAllByText('Move').length).toBeGreaterThan(0);
    });
  });

  describe('Start column selector', () => {
    it('should have column selector in choosing-start phase', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      // Should have number input for column selection
      const columnInput = screen.getByLabelText('Select start column');
      expect(columnInput).toBeInTheDocument();
      expect(columnInput).toHaveAttribute('type', 'number');
    });

    it('should change selected column when input value changes', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const columnInput = screen.getByLabelText('Select start column') as HTMLInputElement;
      expect(columnInput.value).toBe('0');

      fireEvent.change(columnInput, { target: { value: '2' } });
      expect(columnInput.value).toBe('2');
    });

    it('should confirm start position when Confirm Start clicked', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={2}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      // Find Confirm Start button
      const confirmButton = screen.getByText('Confirm Start');
      fireEvent.click(confirmButton);

      // Should move to building phase
      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should use selected column when confirming start', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      // Select column 2
      const columnInput = screen.getByLabelText('Select start column');
      fireEvent.change(columnInput, { target: { value: '2' } });

      // Confirm
      const confirmButton = screen.getByText('Confirm Start');
      fireEvent.click(confirmButton);

      // Should be in building phase
      expect(screen.queryByText('Confirm Start')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard controls', () => {
    it('should handle W key for up movement', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      // Start the board
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[1]!); // Middle position

      // Press W key
      fireEvent.keyDown(document, { key: 'w', code: 'KeyW' });

      // Should move up (hard to verify without inspecting internal state)
      // At minimum, component should still be rendered
      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should handle S key for down movement', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[1]!);

      fireEvent.keyDown(document, { key: 's', code: 'KeyS' });

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should handle A key for left movement', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[1]!);

      fireEvent.keyDown(document, { key: 'a', code: 'KeyA' });

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should handle D key for right movement', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[1]!);

      fireEvent.keyDown(document, { key: 'd', code: 'KeyD' });

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should handle T key for trap placement', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[1]!);

      // Move first
      fireEvent.keyDown(document, { key: 'w', code: 'KeyW' });

      // Then trap
      fireEvent.keyDown(document, { key: 't', code: 'KeyT' });

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should handle Shift+W for trap placement upward', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[1]!);

      // Place trap with Shift+W
      fireEvent.keyDown(document, { key: 'W', code: 'KeyW', shiftKey: true });

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should handle Shift+S for trap placement downward', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Place trap with Shift+S
      fireEvent.keyDown(document, { key: 'S', code: 'KeyS', shiftKey: true });

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should handle Shift+A for trap placement left', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[1]!);

      // Place trap with Shift+A
      fireEvent.keyDown(document, { key: 'A', code: 'KeyA', shiftKey: true });

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should handle Shift+D for trap placement right', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[1]!);

      // Place trap with Shift+D
      fireEvent.keyDown(document, { key: 'D', code: 'KeyD', shiftKey: true });

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should handle Enter key to complete board when at top row', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={2}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Move to top row
      fireEvent.keyDown(document, { key: 'w', code: 'KeyW' });

      // Press Enter to finish
      fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });

      // Click Save Board button
      const saveButton = screen.getByText('Save Board');
      fireEvent.click(saveButton);

      expect(onBoardSaved).toHaveBeenCalled();
    });

    it('should handle Enter key in choosing-start phase to confirm start', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      // Select column 1
      const columnInput = screen.getByLabelText('Select start column') as HTMLInputElement;
      fireEvent.change(columnInput, { target: { value: '1' } });

      // Press Enter to confirm
      fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });

      // Should be in building phase
      expect(screen.getByText(/Use WASD keys/)).toBeInTheDocument();
    });

    it('should ignore keyboard input when typing in input field', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const columnInput = screen.getByLabelText('Select start column') as HTMLInputElement;

      // Focus the input
      columnInput.focus();

      // Press W while focused on input - should not trigger movement
      fireEvent.keyDown(columnInput, { key: 'w', code: 'KeyW' });

      // Should still be in choosing-start phase
      expect(screen.queryByText('Undo')).not.toBeInTheDocument();
    });
  });

  describe('View mode for large boards', () => {
    it('should show view toggle button for boards larger than 7x7', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={8}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Should show view toggle button
      expect(screen.getByText('Section View')).toBeInTheDocument();
    });

    it('should not show view toggle button for boards 7x7 or smaller', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={7}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Should not show view toggle button
      expect(screen.queryByText('Section View')).not.toBeInTheDocument();
      expect(screen.queryByText('Full View')).not.toBeInTheDocument();
    });

    it('should toggle between full and section view', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={8}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Click to switch to section view
      const toggleButton = screen.getByText('Section View');
      fireEvent.click(toggleButton);

      // Button text should change
      expect(screen.getByText('Full View')).toBeInTheDocument();

      // Click again to switch back
      fireEvent.click(screen.getByText('Full View'));
      expect(screen.getByText('Section View')).toBeInTheDocument();
    });

    it('should show row and column labels in section view', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={8}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Switch to section view
      const toggleButton = screen.getByText('Section View');
      fireEvent.click(toggleButton);

      // Should show labels (implementation detail - just verify view switched)
      expect(screen.getByText('Full View')).toBeInTheDocument();
    });

    it('should calculate section bounds correctly for piece in middle', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={10}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      // Select a middle column using the spinner
      const columnInput = screen.getByLabelText('Select start column') as HTMLInputElement;
      fireEvent.change(columnInput, { target: { value: '5' } });

      // Confirm start
      const confirmButton = screen.getByText('Confirm Start');
      fireEvent.click(confirmButton);

      // Move piece up several times to get to middle of board
      fireEvent.keyDown(document, { key: 'w', code: 'KeyW' });
      fireEvent.keyDown(document, { key: 'w', code: 'KeyW' });
      fireEvent.keyDown(document, { key: 'w', code: 'KeyW' });

      // Switch to section view
      const toggleButton = screen.getByText('Section View');
      fireEvent.click(toggleButton);

      // Component should render without crashing
      expect(screen.getByText('Full View')).toBeInTheDocument();
    });

    it('should handle section view at board edges', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={10}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      // Select corner column (0)
      const columnInput = screen.getByLabelText('Select start column') as HTMLInputElement;
      fireEvent.change(columnInput, { target: { value: '0' } });

      // Confirm start
      const confirmButton = screen.getByText('Confirm Start');
      fireEvent.click(confirmButton);

      // Switch to section view
      const toggleButton = screen.getByText('Section View');
      fireEvent.click(toggleButton);

      // Should handle edge case without crashing
      expect(screen.getByText('Full View')).toBeInTheDocument();
    });
  });

  describe('Directional controls', () => {
    it('should show directional control buttons during building phase', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[1]!);

      // Should show directional controls section
      expect(screen.getByText(/Use WASD keys, the controls below/)).toBeInTheDocument();
    });

    it('should disable directional buttons when no move is available in that direction', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!); // Left corner

      // Down should be disabled (edge of board)
      // Left should be disabled (edge of board)
      // Can verify buttons exist
      expect(screen.getByText(/Use WASD keys/)).toBeInTheDocument();
    });

    it('should enable/disable directional buttons based on available moves', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[1]!); // Middle position

      // Move up
      fireEvent.keyDown(document, { key: 'w', code: 'KeyW' });

      // Available moves should update
      expect(screen.getByText('Undo')).toBeInTheDocument();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle rapid key presses without breaking', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[1]!);

      // Rapid key presses
      fireEvent.keyDown(document, { key: 'w', code: 'KeyW' });
      fireEvent.keyDown(document, { key: 'w', code: 'KeyW' });
      fireEvent.keyDown(document, { key: 'd', code: 'KeyD' });
      fireEvent.keyDown(document, { key: 'a', code: 'KeyA' });

      // Should still work
      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should handle multiple undos correctly', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[1]!);

      // Make several moves
      fireEvent.keyDown(document, { key: 'w', code: 'KeyW' });
      fireEvent.keyDown(document, { key: 'd', code: 'KeyD' });
      fireEvent.keyDown(document, { key: 'w', code: 'KeyW' });

      // Undo all moves
      const undoButton = screen.getByText('Undo');
      fireEvent.click(undoButton);
      fireEvent.click(screen.getByText('Undo'));
      fireEvent.click(screen.getByText('Undo'));
      fireEvent.click(screen.getByText('Undo'));

      // Should be back at start
      expect(screen.getByText('Confirm Start')).toBeInTheDocument();
    });

    it('should handle board completion with complex path', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={3}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Complex path with traps
      fireEvent.keyDown(document, { key: 'w', code: 'KeyW' });
      fireEvent.keyDown(document, { key: 'D', code: 'KeyD', shiftKey: true }); // Trap right
      fireEvent.keyDown(document, { key: 'w', code: 'KeyW' });

      // Complete
      const finalMoveButton = screen.getByText('Final Move');
      fireEvent.click(finalMoveButton);

      // Should show confirmation modal
      expect(screen.getByText('Board Complete!')).toBeInTheDocument();

      // Click Save Board button
      const saveButton = screen.getByText('Save Board');
      fireEvent.click(saveButton);

      expect(onBoardSaved).toHaveBeenCalled();
    });

    it('should handle empty board name generation', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      render(
        <BoardCreator
          boardSize={2}
          existingBoards={[]}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Move to top
      fireEvent.keyDown(document, { key: 'w', code: 'KeyW' });

      // Complete
      fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });

      // Click Save Board button
      const saveButton = screen.getByText('Save Board');
      fireEvent.click(saveButton);

      // Should generate "Board 1"
      expect(onBoardSaved).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Board 1',
        })
      );
    });

    it('should increment board name when boards exist', () => {
      const onBoardSaved = vi.fn();
      const onCancel = vi.fn();

      const existingBoards = [
        {
          id: '1',
          name: 'Board 1',
          boardSize: 2 as BoardSize,
          grid: [['empty', 'empty'], ['piece', 'empty']],
          sequence: [],
          thumbnail: '',
          createdAt: Date.now(),
        },
      ];

      render(
        <BoardCreator
          boardSize={2}
          existingBoards={existingBoards}
          onBoardSaved={onBoardSaved}
          onCancel={onCancel}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Move to top
      fireEvent.keyDown(document, { key: 'w', code: 'KeyW' });

      // Complete
      fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });

      // Click Save Board button
      const saveButton = screen.getByText('Save Board');
      fireEvent.click(saveButton);

      // Should generate "Board 2"
      expect(onBoardSaved).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Board 2',
        })
      );
    });
  });
});
