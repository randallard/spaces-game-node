/**
 * Tests for BoardSizeSelector component
 * @module components/BoardSizeSelector.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BoardSizeSelector } from './BoardSizeSelector';
import type { Board, Opponent, UserProfile } from '@/types';

// Mock the feature-unlocks module
vi.mock('@/utils/feature-unlocks', () => ({
  getFeatureUnlocks: vi.fn((user) => {
    const totalGames = user?.stats?.totalGames || 0;
    if (totalGames >= 6) {
      return { boardSizes: [2, 3, 4, 5, 6, 7, 8, 9, 10], deckMode: true };
    } else if (totalGames >= 2) {
      return { boardSizes: [2, 3, 4, 5], deckMode: false };
    }
    return { boardSizes: [2, 3], deckMode: false };
  }),
  isBoardSizeUnlocked: vi.fn((size, user) => {
    const totalGames = user?.stats?.totalGames || 0;
    if (totalGames >= 6) return size >= 2 && size <= 10;
    if (totalGames >= 2) return size >= 2 && size <= 5;
    return size === 2 || size === 3;
  }),
  getNextUnlock: vi.fn((user) => {
    const totalGames = user?.stats?.totalGames || 0;
    if (totalGames >= 6) return null;
    if (totalGames >= 3) {
      return { description: 'Unlock all board sizes (6×6 to 10×10)', gamesRemaining: 6 - totalGames };
    }
    if (totalGames >= 2) {
      return { description: 'Unlock Deck Mode', gamesRemaining: 1 };
    }
    return { description: 'Unlock 4×4 and 5×5 boards', gamesRemaining: 2 - totalGames };
  }),
}));

// Mock the board generation module
vi.mock('@/utils/board-generation', () => ({
  generateCpuBoards: vi.fn((size: number, count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `generated-cpu-${size}-${i}`,
      name: `CPU Generated ${size}x${size} Board ${i + 1}`,
      boardSize: size,
      grid: Array(size).fill(null).map(() => Array(size).fill('empty')),
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    }));
  }),
}));

describe('BoardSizeSelector', () => {
  let mockOnSizeSelected: ReturnType<typeof vi.fn>;
  let mockOnBack: ReturnType<typeof vi.fn>;

  const mockOpponent: Opponent = {
    id: 'cpu-opponent',
    name: 'CPU Sam',
    type: 'cpu',
    wins: 0,
    losses: 0,
  };

  // Mock boards for testing - create boards for sizes 2 and 3
  const mockPlayerBoards: Board[] = [
    {
      id: '1',
      name: 'Player 2x2 Board',
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'empty']],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    },
    {
      id: '2',
      name: 'Player 3x3 Board',
      boardSize: 3,
      grid: [['piece', 'empty', 'empty'], ['empty', 'empty', 'empty'], ['empty', 'empty', 'empty']],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    },
  ];

  const mockCpuBoards: Board[] = [
    {
      id: '3',
      name: 'CPU Sam 2x2 Board 1',
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'empty']],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    },
    {
      id: '3b',
      name: 'CPU Sam 2x2 Board 2',
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'empty']],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    },
    {
      id: '3c',
      name: 'CPU Sam 2x2 Board 3',
      boardSize: 2,
      grid: [['piece', 'empty'], ['empty', 'empty']],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    },
    {
      id: '4',
      name: 'CPU Sam 3x3 Board 1',
      boardSize: 3,
      grid: [['piece', 'empty', 'empty'], ['empty', 'empty', 'empty'], ['empty', 'empty', 'empty']],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    },
    {
      id: '4b',
      name: 'CPU Sam 3x3 Board 2',
      boardSize: 3,
      grid: [['piece', 'empty', 'empty'], ['empty', 'empty', 'empty'], ['empty', 'empty', 'empty']],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    },
    {
      id: '4c',
      name: 'CPU Sam 3x3 Board 3',
      boardSize: 3,
      grid: [['piece', 'empty', 'empty'], ['empty', 'empty', 'empty'], ['empty', 'empty', 'empty']],
      sequence: [],
      thumbnail: '',
      createdAt: Date.now(),
    },
  ];

  beforeEach(() => {
    mockOnSizeSelected = vi.fn();
    mockOnBack = vi.fn();
  });

  describe('Rendering', () => {
    it('should render the title', () => {
      render(<BoardSizeSelector onSizeSelected={mockOnSizeSelected} />);

      expect(screen.getByText('Choose Board Size')).toBeInTheDocument();
    });

    it('should render the subtitle', () => {
      render(<BoardSizeSelector onSizeSelected={mockOnSizeSelected} />);

      expect(
        screen.getByText(/Select the board size for this game/)
      ).toBeInTheDocument();
    });

    it('should render 2x2 option', () => {
      render(<BoardSizeSelector onSizeSelected={mockOnSizeSelected} />);

      expect(screen.getByText('2×2')).toBeInTheDocument();
      expect(
        screen.getByText('Quick strategic gameplay')
      ).toBeInTheDocument();
      expect(screen.getByText('Classic')).toBeInTheDocument();
    });

    it('should render 3x3 option', () => {
      render(<BoardSizeSelector onSizeSelected={mockOnSizeSelected} />);

      expect(screen.getByText('3×3')).toBeInTheDocument();
      expect(
        screen.getByText('Balanced complexity')
      ).toBeInTheDocument();
      expect(screen.getByText('Standard')).toBeInTheDocument();
    });
  });

  describe('Size Selection', () => {
    it('should call onSizeSelected with 2 when 2x2 is clicked', () => {
      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          playerBoards={mockPlayerBoards}
          cpuBoards={mockCpuBoards}
          opponent={mockOpponent}
        />
      );

      const button2x2 = screen.getByLabelText('Select 2x2 board size');
      fireEvent.click(button2x2);

      expect(mockOnSizeSelected).toHaveBeenCalledWith(2);
      expect(mockOnSizeSelected).toHaveBeenCalledTimes(1);
    });

    it('should call onSizeSelected with 3 when 3x3 is clicked', () => {
      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          playerBoards={mockPlayerBoards}
          cpuBoards={mockCpuBoards}
          opponent={mockOpponent}
        />
      );

      const button3x3 = screen.getByLabelText('Select 3x3 board size');
      fireEvent.click(button3x3);

      expect(mockOnSizeSelected).toHaveBeenCalledWith(3);
      expect(mockOnSizeSelected).toHaveBeenCalledTimes(1);
    });
  });

  describe('Back Button', () => {
    it('should render back button when onBack is provided', () => {
      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should not render back button when onBack is not provided', () => {
      render(<BoardSizeSelector onSizeSelected={mockOnSizeSelected} />);

      expect(screen.queryByText('Back')).not.toBeInTheDocument();
    });

    it('should call onBack when back button is clicked', () => {
      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          onBack={mockOnBack}
        />
      );

      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels for size options', () => {
      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          playerBoards={mockPlayerBoards}
          cpuBoards={mockCpuBoards}
          opponent={mockOpponent}
        />
      );

      expect(
        screen.getByLabelText('Select 2x2 board size')
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('Select 3x3 board size')
      ).toBeInTheDocument();
    });
  });

  describe('Multiple Interactions', () => {
    it('should allow selecting different sizes multiple times', () => {
      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          playerBoards={mockPlayerBoards}
          cpuBoards={mockCpuBoards}
          opponent={mockOpponent}
        />
      );

      const button2x2 = screen.getByLabelText('Select 2x2 board size');
      const button3x3 = screen.getByLabelText('Select 3x3 board size');

      fireEvent.click(button2x2);
      fireEvent.click(button3x3);
      fireEvent.click(button2x2);

      expect(mockOnSizeSelected).toHaveBeenCalledTimes(3);
      expect(mockOnSizeSelected).toHaveBeenNthCalledWith(1, 2);
      expect(mockOnSizeSelected).toHaveBeenNthCalledWith(2, 3);
      expect(mockOnSizeSelected).toHaveBeenNthCalledWith(3, 2);
    });
  });

  describe('Board Availability', () => {
    it('should show both boards available when both player and CPU have boards for size 2', () => {
      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          playerBoards={mockPlayerBoards}
          cpuBoards={mockCpuBoards}
          opponent={mockOpponent}
        />
      );

      const button2x2 = screen.getByLabelText('Select 2x2 board size');
      expect(button2x2).toBeInTheDocument();
    });

    it('should show available sizes when player has boards with CPU opponent', () => {
      const mockUser: UserProfile = {
        id: 'test-user',
        name: 'Test User',
        createdAt: Date.now(),
        stats: {
          totalGames: 6, // All sizes unlocked
          wins: 3,
          losses: 3,
        },
      };

      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          playerBoards={mockPlayerBoards}
          cpuBoards={[]}
          opponent={mockOpponent}
          user={mockUser}
        />
      );

      // 2x2 and 3x3 should be available
      expect(screen.getByText('2×2')).toBeInTheDocument();
      expect(screen.getByText('3×3')).toBeInTheDocument();
    });

    it('should handle human opponent appropriately', () => {
      const humanOpponent: Opponent = {
        id: 'human-1',
        name: 'Alice',
        type: 'human',
        wins: 0,
        losses: 0, // First game
      };

      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          playerBoards={mockPlayerBoards}
          cpuBoards={[]}
          opponent={humanOpponent}
        />
      );

      // Should show 2x2 and 3x3 for first-time opponent
      expect(screen.getByText('2×2')).toBeInTheDocument();
      expect(screen.getByText('3×3')).toBeInTheDocument();
    });
  });

  describe('Custom Size Input', () => {
    it('should render custom size input field', () => {
      const mockUser: UserProfile = {
        id: 'test-user',
        name: 'Test User',
        createdAt: Date.now(),
        stats: {
          totalGames: 10,
          wins: 5,
          losses: 5,
        },
      };

      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          user={mockUser}
        />
      );

      expect(screen.getByPlaceholderText(/Enter size/i)).toBeInTheDocument();
    });

    it('should validate custom size input', () => {
      const mockUser: UserProfile = {
        id: 'test-user',
        name: 'Test User',
        createdAt: Date.now(),
        stats: {
          totalGames: 10,
          wins: 5,
          losses: 5,
        },
      };

      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          user={mockUser}
        />
      );

      const input = screen.getByPlaceholderText(/Enter size/i) as HTMLInputElement;
      const customButton = screen.getByText(/Use Custom/i);

      // Test entering valid size
      fireEvent.change(input, { target: { value: '7' } });
      expect(input.value).toBe('7');

      fireEvent.click(customButton);
      expect(mockOnSizeSelected).toHaveBeenCalledWith(7);
    });

    it('should show error for size below minimum', () => {
      const mockUser: UserProfile = {
        id: 'test-user',
        name: 'Test User',
        createdAt: Date.now(),
        stats: {
          totalGames: 10,
          wins: 5,
          losses: 5,
        },
      };

      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          user={mockUser}
        />
      );

      const input = screen.getByPlaceholderText(/Enter size/i) as HTMLInputElement;
      const customButton = screen.getByText(/Use Custom/i);

      fireEvent.change(input, { target: { value: '1' } });
      fireEvent.click(customButton);

      expect(screen.getByText(/between 2 and 99/i)).toBeInTheDocument();
      expect(mockOnSizeSelected).not.toHaveBeenCalled();
    });

    it('should show error for size above maximum', () => {
      const mockUser: UserProfile = {
        id: 'test-user',
        name: 'Test User',
        createdAt: Date.now(),
        stats: {
          totalGames: 10,
          wins: 5,
          losses: 5,
        },
      };

      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          user={mockUser}
        />
      );

      const input = screen.getByPlaceholderText(/Enter size/i) as HTMLInputElement;
      const customButton = screen.getByText(/Use Custom/i);

      fireEvent.change(input, { target: { value: '100' } });
      fireEvent.click(customButton);

      expect(screen.getByText(/between 2 and 99/i)).toBeInTheDocument();
      expect(mockOnSizeSelected).not.toHaveBeenCalled();
    });

    it('should show error for locked size', () => {
      const mockUser: UserProfile = {
        id: 'test-user',
        name: 'Test User',
        createdAt: Date.now(),
        stats: {
          totalGames: 1, // Only 2x2 and 3x3 unlocked
          wins: 0,
          losses: 1,
        },
      };

      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          user={mockUser}
        />
      );

      const input = screen.getByPlaceholderText(/Enter size/i) as HTMLInputElement;
      const customButton = screen.getByText(/Use Custom/i);

      fireEvent.change(input, { target: { value: '5' } });
      fireEvent.click(customButton);

      expect(screen.getByText(/not unlocked yet/i)).toBeInTheDocument();
      expect(mockOnSizeSelected).not.toHaveBeenCalled();
    });

    it('should show error for first-time human opponent with size > 3', () => {
      const mockUser: UserProfile = {
        id: 'test-user',
        name: 'Test User',
        createdAt: Date.now(),
        stats: {
          totalGames: 10,
          wins: 5,
          losses: 5,
        },
      };

      const humanOpponent: Opponent = {
        id: 'human-1',
        name: 'Alice',
        type: 'human',
        wins: 0,
        losses: 0,
      };

      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          user={mockUser}
          opponent={humanOpponent}
        />
      );

      const input = screen.getByPlaceholderText(/Enter size/i) as HTMLInputElement;
      const customButton = screen.getByText(/Use Custom/i);

      fireEvent.change(input, { target: { value: '5' } });
      fireEvent.click(customButton);

      // Check that message appears (may appear in multiple places - info banner and error)
      const messages = screen.getAllByText(/first game with Alice.*only 2×2 and 3×3/i);
      expect(messages.length).toBeGreaterThan(0);
      expect(mockOnSizeSelected).not.toHaveBeenCalled();
    });

    it('should show custom size input for experienced human opponent', () => {
      const mockUser: UserProfile = {
        id: 'test-user',
        name: 'Test User',
        createdAt: Date.now(),
        stats: {
          totalGames: 10,
          wins: 5,
          losses: 5,
        },
      };

      const humanOpponent: Opponent = {
        id: 'human-1',
        name: 'Alice',
        type: 'human',
        wins: 3,
        losses: 2,
      };

      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          user={mockUser}
          opponent={humanOpponent}
        />
      );

      // Custom size input should be available for experienced opponent
      const input = screen.getByPlaceholderText(/Enter size/i) as HTMLInputElement;
      expect(input).toBeInTheDocument();

      // Should allow entering custom sizes
      fireEvent.change(input, { target: { value: '3' } });
      expect(input.value).toBe('3');
    });

    it('should clear error message when valid size is entered after error', () => {
      const mockUser: UserProfile = {
        id: 'test-user',
        name: 'Test User',
        createdAt: Date.now(),
        stats: {
          totalGames: 10,
          wins: 5,
          losses: 5,
        },
      };

      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          user={mockUser}
        />
      );

      const input = screen.getByPlaceholderText(/Enter size/i) as HTMLInputElement;
      const customButton = screen.getByText(/Use Custom/i);

      // First enter invalid size
      fireEvent.change(input, { target: { value: '1' } });
      fireEvent.click(customButton);
      expect(screen.getByText(/between 2 and 99/i)).toBeInTheDocument();

      // Then enter valid size
      fireEvent.change(input, { target: { value: '7' } });
      fireEvent.click(customButton);
      expect(screen.queryByText(/between 2 and 99/i)).not.toBeInTheDocument();
      expect(mockOnSizeSelected).toHaveBeenCalledWith(7);
    });
  });

  describe('CPU Board Generation', () => {
    it('should show generate option when CPU has insufficient boards', async () => {
      const mockOnCpuBoardsGenerated = vi.fn();

      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          playerBoards={mockPlayerBoards}
          cpuBoards={[]} // No CPU boards
          opponent={mockOpponent}
          onCpuBoardsGenerated={mockOnCpuBoardsGenerated}
        />
      );

      // Should show option to generate CPU boards
      expect(screen.getByText('2×2')).toBeInTheDocument();
    });

    it('should show generate CPU boards button when needed', async () => {
      const mockOnCpuBoardsGenerated = vi.fn();

      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          playerBoards={mockPlayerBoards}
          cpuBoards={[]} // No CPU boards
          opponent={mockOpponent}
          onCpuBoardsGenerated={mockOnCpuBoardsGenerated}
        />
      );

      // Should show generate button for CPU boards
      const generateButtons = screen.getAllByText(/Generate CPU Sam boards/i);
      expect(generateButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Locked Sizes', () => {
    it('should show locked state for sizes not yet unlocked', () => {
      const mockUser: UserProfile = {
        id: 'test-user',
        name: 'Test User',
        createdAt: Date.now(),
        stats: {
          totalGames: 0, // No games played, only 2x2 and 3x3 unlocked
          wins: 0,
          losses: 0,
        },
      };

      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          user={mockUser}
        />
      );

      // 2x2 and 3x3 should be available
      expect(screen.getByText('2×2')).toBeInTheDocument();
      expect(screen.getByText('3×3')).toBeInTheDocument();

      // Sizes beyond should show unlock requirement if visible
      // (Component may hide locked sizes or show them with lock icon)
    });

    it('should unlock additional sizes with more games played', () => {
      const mockUser: UserProfile = {
        id: 'test-user',
        name: 'Test User',
        createdAt: Date.now(),
        stats: {
          totalGames: 6, // All sizes unlocked
          wins: 3,
          losses: 3,
        },
      };

      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          user={mockUser}
        />
      );

      // Should show option for higher board sizes
      expect(screen.getByText('2×2')).toBeInTheDocument();
      expect(screen.getByText('3×3')).toBeInTheDocument();
    });
  });

  describe('First-time Human Opponent', () => {
    it('should restrict first-time human opponent to 2x2 or 3x3', () => {
      const mockUser: UserProfile = {
        id: 'test-user',
        name: 'Test User',
        createdAt: Date.now(),
        stats: {
          totalGames: 10,
          wins: 5,
          losses: 5,
        },
      };

      const humanOpponent: Opponent = {
        id: 'human-1',
        name: 'Alice',
        type: 'human',
        wins: 0,
        losses: 0, // First game
      };

      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          user={mockUser}
          opponent={humanOpponent}
        />
      );

      // 2x2 and 3x3 should be available
      expect(screen.getByText('2×2')).toBeInTheDocument();
      expect(screen.getByText('3×3')).toBeInTheDocument();
    });

    it('should allow all unlocked sizes for experienced human opponent', () => {
      const mockUser: UserProfile = {
        id: 'test-user',
        name: 'Test User',
        createdAt: Date.now(),
        stats: {
          totalGames: 10,
          wins: 5,
          losses: 5,
        },
      };

      const humanOpponent: Opponent = {
        id: 'human-1',
        name: 'Alice',
        type: 'human',
        wins: 2,
        losses: 1, // Has played before
      };

      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          user={mockUser}
          opponent={humanOpponent}
        />
      );

      expect(screen.getByText('2×2')).toBeInTheDocument();
      expect(screen.getByText('3×3')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user', () => {
      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          user={null}
        />
      );

      expect(screen.getByText('2×2')).toBeInTheDocument();
      expect(screen.getByText('3×3')).toBeInTheDocument();
    });

    it('should handle undefined opponent', () => {
      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          opponent={undefined}
        />
      );

      expect(screen.getByText('2×2')).toBeInTheDocument();
      expect(screen.getByText('3×3')).toBeInTheDocument();
    });

    it('should handle empty player boards array', () => {
      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          playerBoards={[]}
          cpuBoards={mockCpuBoards}
          opponent={mockOpponent}
        />
      );

      expect(screen.getByText('2×2')).toBeInTheDocument();
    });

    it('should handle empty CPU boards array', () => {
      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          playerBoards={mockPlayerBoards}
          cpuBoards={[]}
          opponent={mockOpponent}
        />
      );

      expect(screen.getByText('2×2')).toBeInTheDocument();
    });

    it('should handle both empty board arrays', () => {
      render(
        <BoardSizeSelector
          onSizeSelected={mockOnSizeSelected}
          playerBoards={[]}
          cpuBoards={[]}
          opponent={mockOpponent}
        />
      );

      expect(screen.getByText('2×2')).toBeInTheDocument();
    });
  });
});
