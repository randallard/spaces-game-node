/**
 * Tests for DeckCreator component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeckCreator } from './DeckCreator';
import type { Board, Deck } from '@/types';

describe('DeckCreator', () => {
  const mockOnDeckSaved = vi.fn();
  const mockOnCancel = vi.fn();

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
    availableBoards: [
      createMockBoard('1', 'Board 1'),
      createMockBoard('2', 'Board 2'),
      createMockBoard('3', 'Board 3'),
    ],
    onDeckSaved: mockOnDeckSaved,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
  });

  describe('Rendering', () => {
    it('should render with "Create New Deck" title when no existing deck', () => {
      render(<DeckCreator {...defaultProps} />);

      expect(screen.getByText('Create New Deck')).toBeInTheDocument();
    });

    it('should render with "Edit Deck" title when editing existing deck', () => {
      const existingDeck: Deck = {
        id: 'deck-1',
        name: 'My Deck',
        boards: Array(10).fill(defaultProps.availableBoards[0]!),
        createdAt: Date.now(),
      };

      render(<DeckCreator {...defaultProps} existingDeck={existingDeck} />);

      expect(screen.getByText('Edit Deck')).toBeInTheDocument();
    });

    it('should show deck name input', () => {
      render(<DeckCreator {...defaultProps} />);

      const input = screen.getByPlaceholderText('Enter deck name...');
      expect(input).toBeInTheDocument();
    });

    it('should show available boards section', () => {
      render(<DeckCreator {...defaultProps} />);

      expect(screen.getByText(/Available Boards/)).toBeInTheDocument();
      expect(screen.getByText('Board 1')).toBeInTheDocument();
      expect(screen.getByText('Board 2')).toBeInTheDocument();
      expect(screen.getByText('Board 3')).toBeInTheDocument();
    });

    it('should show selected boards section with 10 slots', () => {
      render(<DeckCreator {...defaultProps} />);

      expect(screen.getByText('Selected Boards (0/10)')).toBeInTheDocument();

      // Should show 10 empty slots
      const emptySlots = screen.getAllByText(/Round \d+/);
      expect(emptySlots).toHaveLength(10);
    });

    it('should show cancel button', () => {
      render(<DeckCreator {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should show disabled save button initially', () => {
      render(<DeckCreator {...defaultProps} />);

      const saveButton = screen.getByText('Create Deck');
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Deck name input', () => {
    it('should update deck name when typing', () => {
      render(<DeckCreator {...defaultProps} />);

      const input = screen.getByPlaceholderText('Enter deck name...');
      fireEvent.change(input, { target: { value: 'My New Deck' } });

      expect(input).toHaveValue('My New Deck');
    });

    it('should pre-fill deck name when editing existing deck', () => {
      const existingDeck: Deck = {
        id: 'deck-1',
        name: 'Existing Deck',
        boards: Array(10).fill(defaultProps.availableBoards[0]!),
        createdAt: Date.now(),
      };

      render(<DeckCreator {...defaultProps} existingDeck={existingDeck} />);

      const input = screen.getByPlaceholderText('Enter deck name...');
      expect(input).toHaveValue('Existing Deck');
    });

    it('should respect maxLength of 50 characters', () => {
      render(<DeckCreator {...defaultProps} />);

      const input = screen.getByPlaceholderText('Enter deck name...');
      expect(input).toHaveAttribute('maxLength', '50');
    });
  });

  describe('Board selection', () => {
    it('should add board to selected boards when clicked', () => {
      render(<DeckCreator {...defaultProps} />);

      const board1 = screen.getByText('Board 1');
      fireEvent.click(board1);

      expect(screen.getByText('Selected Boards (1/10)')).toBeInTheDocument();
    });

    it('should allow selecting multiple boards', () => {
      render(<DeckCreator {...defaultProps} />);

      fireEvent.click(screen.getByText('Board 1'));
      fireEvent.click(screen.getByText('Board 2'));
      fireEvent.click(screen.getByText('Board 3'));

      expect(screen.getByText('Selected Boards (3/10)')).toBeInTheDocument();
    });

    it('should allow reusing the same board', () => {
      render(<DeckCreator {...defaultProps} />);

      const board1 = screen.getByText('Board 1');
      fireEvent.click(board1);
      fireEvent.click(board1);
      fireEvent.click(board1);

      expect(screen.getByText('Selected Boards (3/10)')).toBeInTheDocument();
    });

    it('should not allow selecting more than 10 boards', () => {
      render(<DeckCreator {...defaultProps} />);

      const board1 = screen.getByText('Board 1');
      // Try to select 11 boards
      for (let i = 0; i < 11; i++) {
        fireEvent.click(board1);
      }

      // Should stop at 10
      expect(screen.getByText('Selected Boards (10/10)')).toBeInTheDocument();
    });

    it('should pre-fill selected boards when editing existing deck', () => {
      const existingDeck: Deck = {
        id: 'deck-1',
        name: 'Existing Deck',
        boards: Array(10).fill(defaultProps.availableBoards[0]!),
        createdAt: Date.now(),
      };

      render(<DeckCreator {...defaultProps} existingDeck={existingDeck} />);

      expect(screen.getByText('Selected Boards (10/10)')).toBeInTheDocument();
    });
  });

  describe('Board removal', () => {
    it('should remove board when remove button is clicked', () => {
      render(<DeckCreator {...defaultProps} />);

      // Add a board
      fireEvent.click(screen.getByText('Board 1'));
      expect(screen.getByText('Selected Boards (1/10)')).toBeInTheDocument();

      // Remove it
      const removeButton = screen.getByText('×');
      fireEvent.click(removeButton);

      expect(screen.getByText('Selected Boards (0/10)')).toBeInTheDocument();
    });

    it('should remove correct board from multiple selections', () => {
      render(<DeckCreator {...defaultProps} />);

      // Add three different boards
      fireEvent.click(screen.getByText('Board 1'));
      fireEvent.click(screen.getByText('Board 2'));
      fireEvent.click(screen.getByText('Board 3'));

      expect(screen.getByText('Selected Boards (3/10)')).toBeInTheDocument();

      // Get all remove buttons and click the middle one
      const removeButtons = screen.getAllByText('×');
      fireEvent.click(removeButtons[1]!); // Remove the second board

      expect(screen.getByText('Selected Boards (2/10)')).toBeInTheDocument();
    });
  });

  describe('Save button', () => {
    it('should be disabled when deck name is empty', () => {
      render(<DeckCreator {...defaultProps} />);

      // Add 10 boards
      const board1 = screen.getByText('Board 1');
      for (let i = 0; i < 10; i++) {
        fireEvent.click(board1);
      }

      const saveButton = screen.getByText('Create Deck');
      expect(saveButton).toBeDisabled();
    });

    it('should be disabled when less than 10 boards selected', () => {
      render(<DeckCreator {...defaultProps} />);

      const input = screen.getByPlaceholderText('Enter deck name...');
      fireEvent.change(input, { target: { value: 'My Deck' } });

      // Add only 5 boards
      const board1 = screen.getByText('Board 1');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(board1);
      }

      const saveButton = screen.getByText('Create Deck');
      expect(saveButton).toBeDisabled();
    });

    it('should be enabled when deck name is set and 10 boards are selected', () => {
      render(<DeckCreator {...defaultProps} />);

      const input = screen.getByPlaceholderText('Enter deck name...');
      fireEvent.change(input, { target: { value: 'My Deck' } });

      // Add 10 boards
      const board1 = screen.getByText('Board 1');
      for (let i = 0; i < 10; i++) {
        fireEvent.click(board1);
      }

      const saveButton = screen.getByText('Create Deck');
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Saving deck', () => {
    it('should call onDeckSaved with valid deck when all requirements met', () => {
      render(<DeckCreator {...defaultProps} />);

      const input = screen.getByPlaceholderText('Enter deck name...');
      fireEvent.change(input, { target: { value: 'My Complete Deck' } });

      // Add 10 boards
      const board1 = screen.getByText('Board 1');
      for (let i = 0; i < 10; i++) {
        fireEvent.click(board1);
      }

      const saveButton = screen.getByText('Create Deck');
      fireEvent.click(saveButton);

      expect(mockOnDeckSaved).toHaveBeenCalledTimes(1);

      const savedDeck = mockOnDeckSaved.mock.calls[0]![0] as Deck;
      expect(savedDeck.name).toBe('My Complete Deck');
      expect(savedDeck.boards).toHaveLength(10);
      expect(savedDeck.id).toBeDefined();
      expect(savedDeck.createdAt).toBeDefined();
    });

    it('should trim whitespace from deck name', () => {
      render(<DeckCreator {...defaultProps} />);

      const input = screen.getByPlaceholderText('Enter deck name...');
      fireEvent.change(input, { target: { value: '  My Deck  ' } });

      // Add 10 boards
      const board1 = screen.getByText('Board 1');
      for (let i = 0; i < 10; i++) {
        fireEvent.click(board1);
      }

      const saveButton = screen.getByText('Create Deck');
      fireEvent.click(saveButton);

      const savedDeck = mockOnDeckSaved.mock.calls[0]![0] as Deck;
      expect(savedDeck.name).toBe('My Deck');
    });

    it('should preserve deck ID when editing existing deck', () => {
      const existingDeck: Deck = {
        id: 'existing-deck-id',
        name: 'Existing Deck',
        boards: Array(10).fill(defaultProps.availableBoards[0]!),
        createdAt: 123456789,
      };

      render(<DeckCreator {...defaultProps} existingDeck={existingDeck} />);

      const saveButton = screen.getByText('Update Deck');
      fireEvent.click(saveButton);

      const savedDeck = mockOnDeckSaved.mock.calls[0]![0] as Deck;
      expect(savedDeck.id).toBe('existing-deck-id');
      expect(savedDeck.createdAt).toBe(123456789);
    });

    it('should generate new ID when creating new deck', () => {
      render(<DeckCreator {...defaultProps} />);

      const input = screen.getByPlaceholderText('Enter deck name...');
      fireEvent.change(input, { target: { value: 'New Deck' } });

      // Add 10 boards
      const board1 = screen.getByText('Board 1');
      for (let i = 0; i < 10; i++) {
        fireEvent.click(board1);
      }

      const saveButton = screen.getByText('Create Deck');
      fireEvent.click(saveButton);

      const savedDeck = mockOnDeckSaved.mock.calls[0]![0] as Deck;
      expect(savedDeck.id).toBeDefined();
      expect(savedDeck.id).not.toBe('existing-deck-id');
      expect(savedDeck.createdAt).toBeGreaterThan(0);
    });
  });

  describe('Cancel button', () => {
    it('should call onCancel when clicked', () => {
      render(<DeckCreator {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Empty board slots', () => {
    it('should show empty slot placeholders for remaining slots', () => {
      render(<DeckCreator {...defaultProps} />);

      // Add 3 boards
      const board1 = screen.getByText('Board 1');
      for (let i = 0; i < 3; i++) {
        fireEvent.click(board1);
      }

      // Should show 3 filled + 7 empty = 10 total rounds
      expect(screen.getByText('Round 1')).toBeInTheDocument();
      expect(screen.getByText('Round 10')).toBeInTheDocument();
    });
  });
});
