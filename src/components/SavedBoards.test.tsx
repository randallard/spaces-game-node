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
      const size2x2Button = screen.getByText('2x2');
      fireEvent.click(size2x2Button);

      // Should show board creator (look for "Choose a starting square")
      expect(screen.getByText('Choose a starting square')).toBeInTheDocument();
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
      expect(thumbnail).toHaveAttribute('src', boards[0]!.thumbnail);
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

    it('should show Select button in round mode', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} currentRound={1} />);

      expect(screen.getByText('Select')).toBeInTheDocument();
    });

    it('should not show Select button in management mode', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} currentRound={0} />);

      expect(screen.queryByText('Select')).not.toBeInTheDocument();
    });

    it('should always show Delete button', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      // Round mode
      const { rerender } = render(<SavedBoards {...defaultProps} boards={boards} currentRound={1} />);
      expect(screen.getByText('Delete')).toBeInTheDocument();

      // Management mode
      rerender(<SavedBoards {...defaultProps} boards={boards} currentRound={0} />);
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  describe('Board selection', () => {
    it('should call onBoardSelected when Select button is clicked', () => {
      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} currentRound={1} />);

      const selectButton = screen.getByText('Select');
      fireEvent.click(selectButton);

      expect(mockOnBoardSelected).toHaveBeenCalledTimes(1);
      expect(mockOnBoardSelected).toHaveBeenCalledWith(boards[0]);
    });

    it('should pass correct board when multiple boards exist', () => {
      const boards = [
        createMockBoard('1', 'Board 1'),
        createMockBoard('2', 'Board 2'),
      ];

      render(<SavedBoards {...defaultProps} boards={boards} currentRound={1} />);

      const selectButtons = screen.getAllByText('Select');
      fireEvent.click(selectButtons[1]!); // Click second board

      expect(mockOnBoardSelected).toHaveBeenCalledWith(boards[1]);
    });
  });

  describe('Board deletion', () => {
    it('should show confirmation dialog when Delete is clicked', () => {
      const confirmSpy = vi.fn(() => true);
      vi.stubGlobal('confirm', confirmSpy);

      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this board?');
    });

    it('should call onBoardDeleted when deletion is confirmed', () => {
      vi.stubGlobal('confirm', vi.fn(() => true));

      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(mockOnBoardDeleted).toHaveBeenCalledTimes(1);
      expect(mockOnBoardDeleted).toHaveBeenCalledWith('1');
    });

    it('should not call onBoardDeleted when deletion is cancelled', () => {
      vi.stubGlobal('confirm', vi.fn(() => false));

      const boards = [createMockBoard('1', 'Board 1')];

      render(<SavedBoards {...defaultProps} boards={boards} />);

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

      render(<SavedBoards {...defaultProps} boards={boards} />);

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
      const size2x2Button = screen.getByText('2x2');
      fireEvent.click(size2x2Button);

      expect(screen.getByText('Choose a starting square')).toBeInTheDocument();
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
      const size2x2Button = screen.getByText('2x2');
      fireEvent.click(size2x2Button);

      // Create a simple board: start -> move to row 0 -> final
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      const moveButtons = screen.getAllByText('Move');
      fireEvent.click(moveButtons[0]!);

      const finalMoveButton = screen.getByText('Final Move');
      fireEvent.click(finalMoveButton);

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
      const size2x2Button = screen.getByText('2x2');
      fireEvent.click(size2x2Button);

      expect(screen.getByText('Choose a starting square')).toBeInTheDocument();

      // Cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Should return to list
      expect(screen.getByText('Board 1')).toBeInTheDocument();
      expect(screen.queryByText('Choose a starting square')).not.toBeInTheDocument();
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

      render(<SavedBoards {...defaultProps} boards={boards} currentRound={1} />);

      const selectButtons = screen.getAllByText('Select');
      const deleteButtons = screen.getAllByText('Delete');

      expect(selectButtons).toHaveLength(2);
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
      const size2x2Button = screen.getByText('2x2');
      fireEvent.click(size2x2Button);

      expect(screen.getByText('Choose a starting square')).toBeInTheDocument();

      // Switch back to list view
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      expect(screen.getByText('Board 1')).toBeInTheDocument();
    });
  });
});
