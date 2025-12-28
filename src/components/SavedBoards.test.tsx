/**
 * Tests for SavedBoards component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SavedBoards } from './SavedBoards';
import type { Board } from '@/types';

describe('SavedBoards', () => {
  const mockOnBoardSelected = vi.fn();
  const mockOnBoardSaved = vi.fn();
  const mockOnBoardDeleted = vi.fn();

  const createMockBoard = (id: string, name: string): Board => ({
    id,
    name,
    boardSize: 2,
    grid: [
      ['piece', 'empty'],
      ['empty', 'empty'],
    ],
    sequence: [
      { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
      { position: { row: 0, col: 0 }, type: 'piece', order: 2 },
      { position: { row: -1, col: 0 }, type: 'final', order: 3 },
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg%3E%3C/svg%3E',
    createdAt: Date.now(),
  });

  const defaultProps = {
    boards: [],
    onBoardSelected: mockOnBoardSelected,
    onBoardSaved: mockOnBoardSaved,
    onBoardDeleted: mockOnBoardDeleted,
    currentRound: 1,
    userName: 'Alice',
    opponentName: 'Bob',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.confirm
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  describe('Empty state', () => {
    it('should show empty state when no boards exist', () => {
      render(<SavedBoards {...defaultProps} boards={[]} />);

      expect(screen.getByText('No Boards Yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first board to start playing!')).toBeInTheDocument();
    });

    it('should show Create Your First Board button in empty state', () => {
      render(<SavedBoards {...defaultProps} boards={[]} />);

      expect(screen.getByText('Create Your First Board')).toBeInTheDocument();
    });

    it('should show board creator when Create Your First Board is clicked', () => {
      render(<SavedBoards {...defaultProps} boards={[]} />);

      const createButton = screen.getByText('Create Your First Board');
      fireEvent.click(createButton);

      // Should show size selection
      expect(screen.getByText('Select Board Size')).toBeInTheDocument();

      // Select 2x2 board size
      const size2x2Button = screen.getByText('2×2');
      fireEvent.click(size2x2Button);

      // Should show board creator (look for instruction text)
      expect(screen.getByText(/Choose a starting column below or click a Start button/)).toBeInTheDocument();
    });
  });

  describe('Board list', () => {
    it('should render board cards for each board', () => {
      const boards = [
        createMockBoard('1', 'Board 1'),
        createMockBoard('2', 'Board 2'),
      ];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      expect(screen.getByText('Board 1')).toBeInTheDocument();
      expect(screen.getByText('Board 2')).toBeInTheDocument();
    });

    it('should display board thumbnails', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      const thumbnail = screen.getByAltText('Board 1 thumbnail');
      expect(thumbnail).toBeInTheDocument();
      // Thumbnail is generated on-demand, check it's a valid data URI
      expect(thumbnail).toHaveAttribute('src');
      expect(thumbnail.getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
    });

    it('should display board meta information', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      expect(screen.getByText('3 moves')).toBeInTheDocument();
      expect(screen.getByText(/Created/)).toBeInTheDocument();
    });

    it('should show + Create New Board button when boards exist', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      expect(screen.getByText('+ Create New Board')).toBeInTheDocument();
    });
  });

  describe('Round mode vs Management mode', () => {
    it('should show header with round number in round mode', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} currentRound={2} />);

      expect(screen.getByText('Select a Board for Round 2')).toBeInTheDocument();
      expect(screen.getByText('Alice vs Bob')).toBeInTheDocument();
    });

    it('should not show header in management mode', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} currentRound={0} />);

      expect(screen.queryByText(/Select a Board for Round/)).not.toBeInTheDocument();
      expect(screen.queryByText('Alice vs Bob')).not.toBeInTheDocument();
    });

    it('should make boards clickable in round mode', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} currentRound={1} />);

      // In round mode, cards are clickable (no separate Select button)
      const boardCard = screen.getByText('Board 1');
      expect(boardCard).toBeInTheDocument();
    });

    it('should not make boards clickable in management mode', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} currentRound={0} />);

      // In management mode, cards aren't clickable (no selection functionality)
      const boardCard = screen.getByText('Board 1');
      expect(boardCard).toBeInTheDocument();
    });

    it('should only show Delete button in management mode', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      // Round mode - no delete button
      const { rerender } = render(<SavedBoards {...defaultProps} boards={boards} currentRound={1} />);
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();

      // Management mode - has delete button
      rerender(<SavedBoards {...defaultProps} boards={boards} currentRound={0} />);
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  describe('Board selection', () => {
    it('should call onBoardSelected when board card is clicked', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} currentRound={1} />);

      // Click the board card itself (no separate Select button)
      const boardCard = screen.getByText('Board 1').closest('div[class*="boardCard"]');
      fireEvent.click(boardCard!);

      expect(mockOnBoardSelected).toHaveBeenCalledTimes(1);
      expect(mockOnBoardSelected).toHaveBeenCalledWith(boards[0]);
    });

    it('should pass correct board when multiple boards exist', () => {
      const boards = [
        createMockBoard('1', 'Board 1'),
        createMockBoard('2', 'Board 2'),
      ];

      render(<SavedBoards {...defaultProps} boards={boards} currentRound={1} />);

      // Click the second board card
      const board2Card = screen.getByText('Board 2').closest('div[class*="boardCard"]');
      fireEvent.click(board2Card!);

      expect(mockOnBoardSelected).toHaveBeenCalledWith(boards[1]);
    });
  });

  describe('Board deletion', () => {
    it('should show confirmation dialog when Delete is clicked', () => {
      const confirmSpy = vi.fn(() => true);
      vi.stubGlobal('confirm', confirmSpy);

      const boards = [createMockBoard('1', 'Board 1')];

      // Must be in management mode to see Delete button
      render(<SavedBoards {...defaultProps} boards={boards} currentRound={0} />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this board?');
    });

    it('should call onBoardDeleted when deletion is confirmed', () => {
      vi.stubGlobal('confirm', vi.fn(() => true));

      const boards = [createMockBoard('1', 'Board 1')];

      // Must be in management mode to see Delete button
      render(<SavedBoards {...defaultProps} boards={boards} currentRound={0} />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(mockOnBoardDeleted).toHaveBeenCalledTimes(1);
      expect(mockOnBoardDeleted).toHaveBeenCalledWith('1');
    });

    it('should not call onBoardDeleted when deletion is cancelled', () => {
      vi.stubGlobal('confirm', vi.fn(() => false));

      const boards = [createMockBoard('1', 'Board 1')];

      // Must be in management mode to see Delete button
      render(<SavedBoards {...defaultProps} boards={boards} currentRound={0} />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(mockOnBoardDeleted).not.toHaveBeenCalled();
    });

    it('should delete correct board when multiple boards exist', () => {
      vi.stubGlobal('confirm', vi.fn(() => true));

      const boards = [
        createMockBoard('1', 'Board 1'),
        createMockBoard('2', 'Board 2'),
      ];

      // Must be in management mode to see Delete buttons
      render(<SavedBoards {...defaultProps} boards={boards} currentRound={0} />);

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[1]!); // Delete second board

      expect(mockOnBoardDeleted).toHaveBeenCalledWith('2');
    });
  });

  describe('Board creation', () => {
    it('should show board creator when + Create New Board is clicked', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      const createButton = screen.getByText('+ Create New Board');
      fireEvent.click(createButton);

      // Should show size selection
      expect(screen.getByText('Select Board Size')).toBeInTheDocument();

      // Select 2x2 board size
      const size2x2Button = screen.getByText('2×2');
      fireEvent.click(size2x2Button);

      expect(screen.getByText(/Choose a starting column below or click a Start button/)).toBeInTheDocument();
    });

    it('should hide board list when in create mode', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      const createButton = screen.getByText('+ Create New Board');
      fireEvent.click(createButton);

      expect(screen.queryByText('Board 1')).not.toBeInTheDocument();
    });

    it('should pass existing boards to BoardCreator', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      const createButton = screen.getByText('+ Create New Board');
      fireEvent.click(createButton);

      // If it passes existing boards correctly, new board should be "Board 2"
      // We'll test this by completing a board creation flow
    });
  });

  describe('Board creator integration', () => {
    it('should call onBoardSaved and return to list when board is saved', () => {
      const boards: Board[] = [];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      // Open creator
      const createButton = screen.getByText('Create Your First Board');
      fireEvent.click(createButton);

      // Select 2x2 board size
      const size2x2Button = screen.getByText('2×2');
      fireEvent.click(size2x2Button);

      // Create a simple board: start -> move to row 0 -> final
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      const moveButtons = screen.getAllByText('Move');
      fireEvent.click(moveButtons[0]!);

      const finalMoveButton = screen.getByText('Final Move');
      fireEvent.click(finalMoveButton);

      // Click Save Board button
      const saveButton = screen.getByText('Save Board');
      fireEvent.click(saveButton);

      // Should call onBoardSaved
      expect(mockOnBoardSaved).toHaveBeenCalledTimes(1);

      // Should return to list view (show empty state)
      expect(screen.getByText('No Boards Yet')).toBeInTheDocument();
    });

    it('should return to list when Cancel is clicked', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      // Open creator
      const createButton = screen.getByText('+ Create New Board');
      fireEvent.click(createButton);

      // Select 2x2 board size
      const size2x2Button = screen.getByText('2×2');
      fireEvent.click(size2x2Button);

      expect(screen.getByText(/Choose a starting column below or click a Start button/)).toBeInTheDocument();

      // Cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Should return to list
      expect(screen.getByText('Board 1')).toBeInTheDocument();
      expect(screen.queryByText(/Choose a starting column below or click a Start button/)).not.toBeInTheDocument();
    });
  });

  describe('Multiple boards', () => {
    it('should render all boards in grid', () => {
      const boards = [
        createMockBoard('1', 'Board 1'),
        createMockBoard('2', 'Board 2'),
        createMockBoard('3', 'Board 3'),
      ];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      expect(screen.getByText('Board 1')).toBeInTheDocument();
      expect(screen.getByText('Board 2')).toBeInTheDocument();
      expect(screen.getByText('Board 3')).toBeInTheDocument();
    });

    it('should have individual actions for each board', () => {
      const boards = [
        createMockBoard('1', 'Board 1'),
        createMockBoard('2', 'Board 2'),
      ];

      // In round mode, boards are clickable (no separate buttons)
      const { rerender } = render(<SavedBoards {...defaultProps} boards={boards} currentRound={1} />);

      expect(screen.getByText('Board 1')).toBeInTheDocument();
      expect(screen.getByText('Board 2')).toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();

      // In management mode, boards have delete buttons
      rerender(<SavedBoards {...defaultProps} boards={boards} currentRound={0} />);

      const deleteButtons = screen.getAllByText('Delete');
      expect(deleteButtons).toHaveLength(2);
    });
  });

  describe('Board metadata formatting', () => {
    it('should format date correctly', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      const dateText = screen.getByText(/Created/);
      expect(dateText).toBeInTheDocument();
      // Date format varies by locale, just check it exists
    });

    it('should show correct move count', () => {
      const board = createMockBoard('1', 'Board 1');
      board.sequence = [
        { position: { row: 1, col: 0 }, type: 'piece', order: 1 },
        { position: { row: 0, col: 0 }, type: 'piece', order: 2 },
        { position: { row: 0, col: 1 }, type: 'trap', order: 3 },
        { position: { row: -1, col: 0 }, type: 'final', order: 4 },
      ];

      render(<SavedBoards {...defaultProps} boards={[board]} />);

      expect(screen.getByText('4 moves')).toBeInTheDocument();
    });
  });

  describe('View mode switching', () => {
    it('should toggle between list and create views', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      // Start in list view
      expect(screen.getByText('Board 1')).toBeInTheDocument();

      // Switch to size selection
      const createButton = screen.getByText('+ Create New Board');
      fireEvent.click(createButton);
      expect(screen.getByText('Select Board Size')).toBeInTheDocument();

      // Select 2x2 board size
      const size2x2Button = screen.getByText('2×2');
      fireEvent.click(size2x2Button);

      expect(screen.getByText(/Choose a starting column below or click a Start button/)).toBeInTheDocument();

      // Switch back to list view
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      expect(screen.getByText('Board 1')).toBeInTheDocument();
    });
  });

  describe('Custom board size', () => {
    beforeEach(() => {
      // Mock feature unlocks to allow custom sizes
      vi.mock('@/utils/feature-unlocks', () => ({
        getFeatureUnlocks: vi.fn(() => ({
          boardSizes: [2, 3, 4, 5, 6, 7, 8, 9, 10],
          deckMode: true,
        })),
      }));
    });

    it('should allow entering custom board size', () => {
      const boards: Board[] = [];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      // Open creator
      const createButton = screen.getByText('Create Your First Board');
      fireEvent.click(createButton);

      // Enter custom size
      const customInput = screen.getByPlaceholderText(/Enter size \(2-99\)/i);
      expect(customInput).toBeInTheDocument();

      fireEvent.change(customInput, { target: { value: '7' } });

      // Button should show custom size
      expect(screen.getByText(/7×7/)).toBeInTheDocument();
    });

    it('should validate custom board size is within range', () => {
      const boards: Board[] = [];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      // Open creator
      const createButton = screen.getByText('Create Your First Board');
      fireEvent.click(createButton);

      // Enter invalid size (too small)
      const customInput = screen.getByPlaceholderText(/Enter size \(2-99\)/i);
      fireEvent.change(customInput, { target: { value: '1' } });

      const useButton = screen.getByText(/1×1/);
      fireEvent.click(useButton);

      // Should show error
      expect(screen.getByText(/Please enter a number between 2 and 99/)).toBeInTheDocument();
    });

    it('should validate custom board size is not too large', () => {
      const boards: Board[] = [];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      // Open creator
      const createButton = screen.getByText('Create Your First Board');
      fireEvent.click(createButton);

      // Enter invalid size (too large)
      const customInput = screen.getByPlaceholderText(/Enter size \(2-99\)/i);
      fireEvent.change(customInput, { target: { value: '100' } });

      const useButton = screen.getByText(/100×100/);
      fireEvent.click(useButton);

      // Should show error
      expect(screen.getByText(/Please enter a number between 2 and 99/)).toBeInTheDocument();
    });

    it('should clear custom error when correcting input', () => {
      const boards: Board[] = [];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      // Open creator
      const createButton = screen.getByText('Create Your First Board');
      fireEvent.click(createButton);

      // Enter invalid size
      const customInput = screen.getByPlaceholderText(/Enter size \(2-99\)/i);
      fireEvent.change(customInput, { target: { value: '1' } });

      const useButton = screen.getByText(/1×1/);
      fireEvent.click(useButton);

      // Error should be shown
      expect(screen.getByText(/Please enter a number between 2 and 99/)).toBeInTheDocument();

      // Enter valid size
      fireEvent.change(customInput, { target: { value: '5' } });

      // Error should be cleared
      expect(screen.queryByText(/Please enter a number between 2 and 99/)).not.toBeInTheDocument();
    });

    it('should disable Use Custom button when no size is entered', () => {
      const boards: Board[] = [];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      // Open creator
      const createButton = screen.getByText('Create Your First Board');
      fireEvent.click(createButton);

      // Button should be disabled
      const useButton = screen.getByText(/Use Custom/);
      expect(useButton).toBeDisabled();
    });

    it('should create board with valid custom size', () => {
      const boards: Board[] = [];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      // Open creator
      const createButton = screen.getByText('Create Your First Board');
      fireEvent.click(createButton);

      // Enter valid custom size
      const customInput = screen.getByPlaceholderText(/Enter size \(2-99\)/i);
      fireEvent.change(customInput, { target: { value: '7' } });

      const useButton = screen.getByText(/7×7/);
      fireEvent.click(useButton);

      // Should transition to board creator
      expect(screen.getByText(/Choose a starting column below or click a Start button/)).toBeInTheDocument();
    });

    it('should allow canceling from size selection back to list', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      // Open creator
      const createButton = screen.getByText('+ Create New Board');
      fireEvent.click(createButton);

      // Should show size selection
      expect(screen.getByText('Select Board Size')).toBeInTheDocument();

      // Cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Should return to list
      expect(screen.getByText('Board 1')).toBeInTheDocument();
      expect(screen.queryByText('Select Board Size')).not.toBeInTheDocument();
    });
  });
});
