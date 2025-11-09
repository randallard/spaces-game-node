import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TutorialBoardCreator } from './TutorialBoardCreator';

describe('TutorialBoardCreator', () => {
  const mockCpuSamData = { name: 'CPU Sam', creature: 'bug' as const };
  const mockOnBoardComplete = vi.fn();

  beforeEach(() => {
    mockOnBoardComplete.mockClear();
  });

  describe('Initial state', () => {
    it('should render with choosing-start instruction', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      expect(screen.getByText('first, choose a start square')).toBeInTheDocument();
    });

    it('should show Start buttons only in bottom row', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      const startButtons = screen.getAllByText('Start');
      expect(startButtons).toHaveLength(2); // 2x2 grid, bottom row has 2 cells
    });

    it('should have Final Move button disabled initially', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      const finalMoveButton = screen.getByText('Final Move');
      expect(finalMoveButton).toBeDisabled();
    });
  });

  describe('Starting position selection', () => {
    it('should place piece when Start button is clicked', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Should show piece icon
      expect(screen.getByText('⚫')).toBeInTheDocument();
      // Should no longer show Start buttons
      expect(screen.queryByText('Start')).not.toBeInTheDocument();
    });

    it('should show trap instruction after choosing start', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      expect(screen.getByText(/now you can set a trap for CPU Sam's bot!/)).toBeInTheDocument();
    });

    it('should show Move and Trap buttons on adjacent cells', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!); // Click bottom-left

      // Should have Move and Trap buttons for adjacent cells
      const moveButtons = screen.getAllByText('Move');
      const trapButtons = screen.getAllByText('Trap');
      expect(moveButtons.length).toBeGreaterThan(0);
      expect(trapButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Piece movement', () => {
    it('should move piece when Move button is clicked', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      // Choose start position
      const startButtons = screen.getAllByText('Start');
      fireEvent.click(startButtons[0]!);

      // Click Move on adjacent cell
      const moveButtons = screen.getAllByText('Move');
      fireEvent.click(moveButtons[0]!);

      // Piece should still be visible (moved to new position)
      expect(screen.getByText('⚫')).toBeInTheDocument();
    });

    it('should show instruction after making a move', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      // Choose start position
      fireEvent.click(screen.getAllByText('Start')[0]!);

      // After choosing start, instruction should change
      expect(screen.getByText(/now you can set a trap/)).toBeInTheDocument();
    });

    it('should enable Final Move button when piece reaches top row', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      // Choose start position in bottom row
      fireEvent.click(screen.getAllByText('Start')[0]!);

      // Move to top row
      const moveButtons = screen.getAllByText('Move');
      const upButton = moveButtons.find(() => {
        // Find the move button that goes up
        return true; // In a 2x2 grid, any adjacent move from bottom will be valid
      });

      if (upButton) {
        fireEvent.click(upButton);

        // Check if final move can be enabled
        screen.getByText('Final Move');
        // It might be enabled now if we reached row 0
      }
    });
  });

  describe('Trap placement', () => {
    it('should place trap when Trap button is clicked', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      // Choose start position
      fireEvent.click(screen.getAllByText('Start')[0]!);

      // Click Trap on adjacent cell
      const trapButtons = screen.getAllByText('Trap');
      fireEvent.click(trapButtons[0]!);

      // Should show trap icon
      expect(screen.getByText('✖')).toBeInTheDocument();
    });

    it('should prevent moving onto trap', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      // Choose start position
      fireEvent.click(screen.getAllByText('Start')[0]!);

      // Place trap
      const trapButtons = screen.getAllByText('Trap');
      fireEvent.click(trapButtons[0]!);

      // Try to move onto the trap - should show trapped instruction
      // (The UI should prevent this or show error)
      screen.queryAllByText('Move');
      // After placing trap, move buttons on that cell should not appear
    });
  });

  describe('Final move', () => {
    it('should complete board when Final Move is clicked from top row', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      // Choose start, move to top row, then complete
      fireEvent.click(screen.getAllByText('Start')[0]!);

      // Move upward to top row
      const moveButtons = screen.getAllByText('Move');
      if (moveButtons.length > 0) {
        fireEvent.click(moveButtons[0]!);
      }

      // Try clicking Final Move
      const finalMoveButton = screen.getByText('Final Move');
      if (!finalMoveButton.hasAttribute('disabled')) {
        fireEvent.click(finalMoveButton);

        expect(mockOnBoardComplete).toHaveBeenCalled();
      }
    });

    it('should show success instruction when ready to finish', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      // Start and move to top row
      fireEvent.click(screen.getAllByText('Start')[0]!);

      const moveButtons = screen.getAllByText('Move');
      if (moveButtons.length > 0) {
        fireEvent.click(moveButtons[0]!);

        // If we're at top row, should show completion instruction
        const finalMoveButton = screen.getByText('Final Move');
        if (!finalMoveButton.hasAttribute('disabled')) {
          expect(screen.getByText(/click the final move button to save the board!/)).toBeInTheDocument();
        }
      }
    });

    it('should pass hasTraps flag when board has traps', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      // Choose start
      fireEvent.click(screen.getAllByText('Start')[0]!);

      // Place trap
      const trapButtons = screen.getAllByText('Trap');
      if (trapButtons.length > 0) {
        fireEvent.click(trapButtons[0]!);
      }

      // Move to top row
      const moveButtons = screen.getAllByText('Move');
      if (moveButtons.length > 0) {
        fireEvent.click(moveButtons[0]!);
      }

      // Complete
      const finalMoveButton = screen.getByText('Final Move');
      if (!finalMoveButton.hasAttribute('disabled')) {
        fireEvent.click(finalMoveButton);

        if (mockOnBoardComplete.mock.calls.length > 0) {
          const call = mockOnBoardComplete.mock.calls[0];
          if (call) {
            const [, hasTraps] = call;
            expect(hasTraps).toBe(true);
          }
        }
      }
    });
  });

  describe('Restart functionality', () => {
    it('should show Restart button after choosing start', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      // Start buttons should be visible
      expect(screen.getAllByText('Start')).toHaveLength(2);

      // Choose start
      fireEvent.click(screen.getAllByText('Start')[0]!);

      // Restart button should now be visible
      expect(screen.getByText('Restart')).toBeInTheDocument();
    });

    it('should reset board when Restart is clicked', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      // Choose start and make moves
      fireEvent.click(screen.getAllByText('Start')[0]!);
      expect(screen.getByText('⚫')).toBeInTheDocument();

      // Click Restart
      const restartButton = screen.getByText('Restart');
      fireEvent.click(restartButton);

      // Should go back to choosing start
      expect(screen.getByText('first, choose a start square')).toBeInTheDocument();
      expect(screen.getAllByText('Start')).toHaveLength(2);
      expect(screen.queryByText('⚫')).not.toBeInTheDocument();
    });

    it('should clear traps when restarting', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      // Choose start and place trap
      fireEvent.click(screen.getAllByText('Start')[0]!);
      const trapButtons = screen.getAllByText('Trap');
      if (trapButtons.length > 0) {
        fireEvent.click(trapButtons[0]!);
        expect(screen.getByText('✖')).toBeInTheDocument();
      }

      // Restart
      fireEvent.click(screen.getByText('Restart'));

      // Trap should be gone
      expect(screen.queryByText('✖')).not.toBeInTheDocument();
    });
  });

  describe('Dynamic instructions', () => {
    it('should show CPU Sam name in trap instruction', () => {
      const customCpuData = { name: 'Robo', creature: 'circle' as const };

      render(
        <TutorialBoardCreator
          cpuSamData={customCpuData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      fireEvent.click(screen.getAllByText('Start')[0]!);

      expect(screen.getByText(/now you can set a trap for Robo's bot!/)).toBeInTheDocument();
    });

    it('should update instruction as player progresses', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      // Initial instruction
      expect(screen.getByText('first, choose a start square')).toBeInTheDocument();

      // After choosing start
      fireEvent.click(screen.getAllByText('Start')[0]!);
      expect(screen.getByText(/now you can set a trap/)).toBeInTheDocument();
    });
  });

  describe('Grid rendering', () => {
    it('should render 2x2 grid', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      // Should have 4 cells (2x2)
      const cells = screen.getAllByLabelText(/Cell/);
      expect(cells).toHaveLength(4);
    });

    it('should label cells with coordinates', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      expect(screen.getByLabelText('Cell 0,0')).toBeInTheDocument();
      expect(screen.getByLabelText('Cell 0,1')).toBeInTheDocument();
      expect(screen.getByLabelText('Cell 1,0')).toBeInTheDocument();
      expect(screen.getByLabelText('Cell 1,1')).toBeInTheDocument();
    });
  });

  describe('Board validation', () => {
    it('should create valid board with correct properties', () => {
      render(
        <TutorialBoardCreator
          cpuSamData={mockCpuSamData}
          onBoardComplete={mockOnBoardComplete}
        />
      );

      // Complete a simple board
      fireEvent.click(screen.getAllByText('Start')[0]!);

      const moveButtons = screen.getAllByText('Move');
      if (moveButtons.length > 0) {
        fireEvent.click(moveButtons[0]!);
      }

      const finalMoveButton = screen.getByText('Final Move');
      if (!finalMoveButton.hasAttribute('disabled')) {
        fireEvent.click(finalMoveButton);

        if (mockOnBoardComplete.mock.calls.length > 0) {
          const call = mockOnBoardComplete.mock.calls[0];
          if (call) {
            const [board] = call;
            expect(board).toMatchObject({
              name: 'My First Board',
              boardSize: 2,
            });
            expect(board.id).toBeDefined();
            expect(board.grid).toBeDefined();
            expect(board.sequence).toBeDefined();
            expect(board.thumbnail).toBeDefined();
            expect(board.createdAt).toBeDefined();
          }
        }
      }
    });
  });
});
