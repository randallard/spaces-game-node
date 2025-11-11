/**
 * Tests for DeckManager component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeckManager } from './DeckManager';
import type { Deck, Board, Opponent } from '@/types';

describe('DeckManager', () => {
  const mockOnDeckSelected = vi.fn();
  const mockOnCreateDeck = vi.fn();
  const mockOnEditDeck = vi.fn();
  const mockOnDeleteDeck = vi.fn();

  const createMockBoard = (id: string, name: string): Board => ({
    id,
    name,
    boardSize: 2,
    grid: [
      ['piece', 'empty'],
      ['empty', 'empty'],
    ],
    sequence: [{ position: { row: 0, col: 0 }, type: 'piece', order: 1 }],
    thumbnail: `data:image/svg+xml,%3Csvg%3E${id}%3C/svg%3E`,
    createdAt: Date.now(),
  });

  const createMockDeck = (id: string, name: string, boardCount: number = 10): Deck => ({
    id,
    name,
    boards: Array.from({ length: boardCount }, (_, i) =>
      createMockBoard(`board-${id}-${i}`, `Board ${i + 1}`)
    ),
    createdAt: Date.now(),
  });

  const mockOpponents: Opponent[] = [
    {
      id: 'opponent-1',
      name: 'CPU Sam',
      type: 'cpu',
      wins: 5,
      losses: 3,
    },
    {
      id: 'opponent-2',
      name: 'CPU Tougher',
      type: 'cpu',
      wins: 2,
      losses: 8,
    },
  ];

  const defaultProps = {
    decks: [],
    opponents: mockOpponents,
    onDeckSelected: mockOnDeckSelected,
    onCreateDeck: mockOnCreateDeck,
    onEditDeck: mockOnEditDeck,
    onDeleteDeck: mockOnDeleteDeck,
    userName: 'TestUser',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  describe('Header', () => {
    it('should display title', () => {
      render(<DeckManager {...defaultProps} />);

      expect(screen.getByText('Select a Deck to Play')).toBeInTheDocument();
    });

    it('should display create new deck button in header', () => {
      render(<DeckManager {...defaultProps} />);

      const createButtons = screen.getAllByText('+ Create New Deck');
      expect(createButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should call onCreateDeck when header create button clicked', () => {
      render(<DeckManager {...defaultProps} />);

      const createButtons = screen.getAllByText('+ Create New Deck');
      fireEvent.click(createButtons[0]!);

      expect(mockOnCreateDeck).toHaveBeenCalledTimes(1);
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no decks exist', () => {
      render(<DeckManager {...defaultProps} decks={[]} />);

      expect(
        screen.getByText("You don't have any decks yet. Create one to get started!")
      ).toBeInTheDocument();
    });

    it('should show create first deck button in empty state', () => {
      render(<DeckManager {...defaultProps} decks={[]} />);

      expect(screen.getByText('Create Your First Deck')).toBeInTheDocument();
    });

    it('should call onCreateDeck when empty state button clicked', () => {
      render(<DeckManager {...defaultProps} decks={[]} />);

      const createButton = screen.getByText('Create Your First Deck');
      fireEvent.click(createButton);

      expect(mockOnCreateDeck).toHaveBeenCalledTimes(1);
    });
  });

  describe('Deck cards', () => {
    it('should display deck cards when decks exist', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      expect(screen.getByText('My Deck')).toBeInTheDocument();
    });

    it('should display multiple deck cards', () => {
      const decks = [
        createMockDeck('deck-1', 'Deck 1'),
        createMockDeck('deck-2', 'Deck 2'),
        createMockDeck('deck-3', 'Deck 3'),
      ];

      render(<DeckManager {...defaultProps} decks={decks} />);

      expect(screen.getByText('Deck 1')).toBeInTheDocument();
      expect(screen.getByText('Deck 2')).toBeInTheDocument();
      expect(screen.getByText('Deck 3')).toBeInTheDocument();
    });

    it('should display board count', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      expect(screen.getByText('10 boards')).toBeInTheDocument();
    });

    it('should display first 5 board thumbnails', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      // Should have 5 thumbnail images
      const thumbnails = screen.getAllByAltText(/Board \d+/);
      expect(thumbnails.length).toBe(5);
    });

    it('should show +5 indicator when more than 5 boards', () => {
      const decks = [createMockDeck('deck-1', 'My Deck', 10)];

      render(<DeckManager {...defaultProps} decks={decks} />);

      expect(screen.getByText('+5')).toBeInTheDocument();
    });

    it('should display all 10 board names in list', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      // Check for round labels R1 through R10
      expect(screen.getByText('R1:')).toBeInTheDocument();
      expect(screen.getByText('R10:')).toBeInTheDocument();

      // Check for board names
      const board1Elements = screen.getAllByText('Board 1');
      expect(board1Elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Play button and opponent selection modal', () => {
    it('should display play button for each deck', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      const playButtons = screen.getAllByRole('button', { name: /Play/ });
      expect(playButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should show opponent selection modal when play button clicked', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      const playButton = screen.getAllByRole('button', { name: /Play/ })[0]!;
      fireEvent.click(playButton);

      expect(screen.getByText('Select Opponent')).toBeInTheDocument();
      expect(screen.getByText('CPU Sam')).toBeInTheDocument();
      expect(screen.getByText('CPU Tougher')).toBeInTheDocument();
    });

    it('should display deck name in modal subtitle', () => {
      const decks = [createMockDeck('deck-1', 'My Awesome Deck')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      const playButton = screen.getAllByRole('button', { name: /Play/ })[0]!;
      fireEvent.click(playButton);

      expect(screen.getByText('Playing with:')).toBeInTheDocument();
      const deckNames = screen.getAllByText('My Awesome Deck');
      expect(deckNames.length).toBeGreaterThanOrEqual(1);
    });

    it('should call onDeckSelected with deck and opponent when opponent selected', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      const playButton = screen.getAllByRole('button', { name: /Play/ })[0]!;
      fireEvent.click(playButton);

      const opponentButton = screen.getByText('CPU Sam');
      fireEvent.click(opponentButton);

      expect(mockOnDeckSelected).toHaveBeenCalledTimes(1);
      expect(mockOnDeckSelected).toHaveBeenCalledWith(decks[0], mockOpponents[0]);
    });

    it('should hide modal after opponent is selected', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      const playButton = screen.getAllByRole('button', { name: /Play/ })[0]!;
      fireEvent.click(playButton);

      expect(screen.getByText('Select Opponent')).toBeInTheDocument();

      const opponentButton = screen.getByText('CPU Sam');
      fireEvent.click(opponentButton);

      expect(screen.queryByText('Select Opponent')).not.toBeInTheDocument();
    });

    it('should close modal when clicking overlay', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      const playButton = screen.getAllByRole('button', { name: /Play/ })[0]!;
      fireEvent.click(playButton);

      expect(screen.getByText('Select Opponent')).toBeInTheDocument();

      // Click overlay (the parent div with modalOverlay class)
      const modal = screen.getByText('Select Opponent').closest('[class*="modalOverlay"]');
      if (modal) {
        fireEvent.click(modal);
      }

      expect(screen.queryByText('Select Opponent')).not.toBeInTheDocument();
    });

    it('should close modal when clicking close button', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      const playButton = screen.getAllByRole('button', { name: /Play/ })[0]!;
      fireEvent.click(playButton);

      expect(screen.getByText('Select Opponent')).toBeInTheDocument();

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(screen.queryByText('Select Opponent')).not.toBeInTheDocument();
    });
  });

  describe('Edit button', () => {
    it('should display edit button for each deck', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should call onEditDeck when edit button clicked', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(mockOnEditDeck).toHaveBeenCalledTimes(1);
      expect(mockOnEditDeck).toHaveBeenCalledWith(decks[0]);
    });

    it('should call onEditDeck with correct deck when multiple decks', () => {
      const decks = [
        createMockDeck('deck-1', 'Deck 1'),
        createMockDeck('deck-2', 'Deck 2'),
      ];

      render(<DeckManager {...defaultProps} decks={decks} />);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]!); // Click first deck's edit button

      expect(mockOnEditDeck).toHaveBeenCalledWith(decks[0]);
    });
  });

  describe('Delete button', () => {
    it('should display delete button for each deck', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should show confirmation dialog when delete button clicked', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete "My Deck"?');
    });

    it('should call onDeleteDeck when delete confirmed', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];
      vi.stubGlobal('confirm', vi.fn(() => true));

      render(<DeckManager {...defaultProps} decks={decks} />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(mockOnDeleteDeck).toHaveBeenCalledTimes(1);
      expect(mockOnDeleteDeck).toHaveBeenCalledWith('deck-1');
    });

    it('should not call onDeleteDeck when delete cancelled', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];
      vi.stubGlobal('confirm', vi.fn(() => false));

      render(<DeckManager {...defaultProps} decks={decks} />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(mockOnDeleteDeck).not.toHaveBeenCalled();
    });

    it('should call onDeleteDeck with correct deck ID when multiple decks', () => {
      const decks = [
        createMockDeck('deck-1', 'Deck 1'),
        createMockDeck('deck-2', 'Deck 2'),
      ];
      vi.stubGlobal('confirm', vi.fn(() => true));

      render(<DeckManager {...defaultProps} decks={decks} />);

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[1]!); // Delete second deck

      expect(mockOnDeleteDeck).toHaveBeenCalledWith('deck-2');
    });
  });

  describe('Board thumbnails', () => {
    it('should display thumbnail with title attribute', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      const thumbnail = screen.getByTitle('Round 1: Board 1');
      expect(thumbnail).toBeInTheDocument();
    });

    it('should display correct thumbnail src', () => {
      const decks = [createMockDeck('deck-1', 'My Deck')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      const thumbnails = screen.getAllByAltText(/Board \d+/);
      expect(thumbnails[0]).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml'));
    });
  });

  describe('Edge cases', () => {
    it('should handle deck with special characters in name', () => {
      const decks = [createMockDeck('deck-1', 'Deck #1 (v2.0)')];

      render(<DeckManager {...defaultProps} decks={decks} />);

      expect(screen.getByText('Deck #1 (v2.0)')).toBeInTheDocument();
    });

    it('should handle long deck names', () => {
      const decks = [
        createMockDeck('deck-1', 'This is a very long deck name that might need truncation'),
      ];

      render(<DeckManager {...defaultProps} decks={decks} />);

      expect(
        screen.getByText('This is a very long deck name that might need truncation')
      ).toBeInTheDocument();
    });

    it('should handle deck with boards that have same name', () => {
      const deck: Deck = {
        id: 'deck-1',
        name: 'Same Boards',
        boards: Array.from({ length: 10 }, (_, i) =>
          createMockBoard(`board-${i}`, 'Same Board')
        ),
        createdAt: Date.now(),
      };

      render(<DeckManager {...defaultProps} decks={[deck]} />);

      expect(screen.getByText('Same Boards')).toBeInTheDocument();
    });

    it('should handle empty board names gracefully', () => {
      const deck: Deck = {
        id: 'deck-1',
        name: 'Empty Names',
        boards: Array.from({ length: 10 }, (_, i) => createMockBoard(`board-${i}`, '')),
        createdAt: Date.now(),
      };

      render(<DeckManager {...defaultProps} decks={[deck]} />);

      expect(screen.getByText('Empty Names')).toBeInTheDocument();
    });
  });

  describe('Multiple decks interaction', () => {
    it('should handle clicking play on different decks', () => {
      const decks = [
        createMockDeck('deck-1', 'Deck 1'),
        createMockDeck('deck-2', 'Deck 2'),
        createMockDeck('deck-3', 'Deck 3'),
      ];

      render(<DeckManager {...defaultProps} decks={decks} />);

      const playButtons = screen.getAllByRole('button', { name: /Play/ });

      // Click first deck's play button
      fireEvent.click(playButtons[0]!);
      // Select opponent for first deck
      fireEvent.click(screen.getByText('CPU Sam'));
      expect(mockOnDeckSelected).toHaveBeenCalledWith(decks[0], mockOpponents[0]);

      // Click third deck's play button
      fireEvent.click(playButtons[2]!);
      // Select opponent for third deck
      fireEvent.click(screen.getByText('CPU Tougher'));
      expect(mockOnDeckSelected).toHaveBeenCalledWith(decks[2], mockOpponents[1]);

      expect(mockOnDeckSelected).toHaveBeenCalledTimes(2);
    });

    it('should handle editing and deleting different decks', () => {
      const decks = [
        createMockDeck('deck-1', 'Deck 1'),
        createMockDeck('deck-2', 'Deck 2'),
      ];
      vi.stubGlobal('confirm', vi.fn(() => true));

      render(<DeckManager {...defaultProps} decks={decks} />);

      const editButtons = screen.getAllByText('Edit');
      const deleteButtons = screen.getAllByText('Delete');

      // Edit first deck
      fireEvent.click(editButtons[0]!);
      expect(mockOnEditDeck).toHaveBeenCalledWith(decks[0]);

      // Delete second deck
      fireEvent.click(deleteButtons[1]!);
      expect(mockOnDeleteDeck).toHaveBeenCalledWith('deck-2');
    });
  });
});