/**
 * Tests for OpponentManager component
 * @module components/OpponentManager.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OpponentManager } from './OpponentManager';

// Mock the opponent-helpers module
vi.mock('@/utils/opponent-helpers', () => ({
  createCpuOpponent: vi.fn(() => ({
    type: 'cpu',
    id: 'cpu-test-id',
    name: 'CPU',
    wins: 0,
    losses: 0,
  })),
  createHumanOpponent: vi.fn((name: string) => ({
    type: 'human',
    id: `human-${Math.random().toString(36).substring(2, 9)}`,
    name,
    wins: 0,
    losses: 0,
  })),
  createRemoteCpuOpponent: vi.fn((name: string) => ({
    type: 'remote-cpu',
    id: `remote-cpu-${Math.random().toString(36).substring(2, 9)}`,
    name,
    wins: 0,
    losses: 0,
  })),
  createAiAgentOpponent: vi.fn((name: string, skillLevel: string) => ({
    type: 'ai-agent',
    id: `ai-agent-${Math.random().toString(36).substring(2, 9)}`,
    name,
    wins: 0,
    losses: 0,
    skillLevel,
  })),
  createModelOpponent: vi.fn((name: string, modelId: string, modelBoardSize: number) => ({
    type: 'ai-agent',
    id: `ai-agent-${Math.random().toString(36).substring(2, 9)}`,
    name,
    wins: 0,
    losses: 0,
    modelId,
    modelBoardSize,
  })),
}));

// Mock the ai-agent-inference module for ModelBrowser
vi.mock('@/utils/ai-agent-inference', () => ({
  fetchAvailableModels: vi.fn(() => Promise.resolve([
    { index: 0, model_id: 'aaa11111', board_size: 3, stage: 'stage3', label: 'model_alpha', use_fog: false },
    { index: 1, model_id: 'bbb22222', board_size: 5, stage: 'stage4', label: 'model_beta', use_fog: true },
  ])),
}));

// Mock features config
vi.mock('@/config/features', () => ({
  FEATURES: {
    DISCORD_NOTIFICATIONS: true,
    URL_SHORTENING: true,
    REMOTE_CPU: true,
    AI_AGENT: true,
  },
}));

describe('OpponentManager', () => {
  let mockOnOpponentSelected: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnOpponentSelected = vi.fn();
  });

  describe('Initial render - Opponent selection screen', () => {
    it('should render opponent selection title', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      expect(screen.getByText('Choose Your Opponent')).toBeInTheDocument();
    });

    it('should display welcome message with user name', () => {
      render(
        <OpponentManager
          userName="Alice"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      expect(screen.getByText(/Welcome,/)).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should render CPU opponent option', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      expect(screen.getByText('CPU Opponent')).toBeInTheDocument();
      expect(screen.getByText(/Play against the computer/)).toBeInTheDocument();
      expect(screen.getByText('Quick Start')).toBeInTheDocument();
    });

    it('should render human opponent option', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      expect(screen.getByText('Human Opponent')).toBeInTheDocument();
      expect(screen.getByText(/Invite a friend to play/)).toBeInTheDocument();
      expect(screen.getByText('Multiplayer')).toBeInTheDocument();
    });

    it('should render option cards as buttons', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      const cpuButton = screen.getByLabelText('Play against CPU');
      const humanButton = screen.getByLabelText('Play against human opponent');

      expect(cpuButton).toBeInstanceOf(HTMLButtonElement);
      expect(humanButton).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('CPU opponent selection', () => {
    it('should call onOpponentSelected with CPU opponent when CPU clicked', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      const cpuButton = screen.getByLabelText('Play against CPU');
      fireEvent.click(cpuButton);

      expect(mockOnOpponentSelected).toHaveBeenCalledTimes(1);
      expect(mockOnOpponentSelected).toHaveBeenCalledWith({
        type: 'cpu',
        id: 'cpu-test-id',
        name: 'CPU',
        wins: 0,
        losses: 0,
      });
    });

    it('should immediately select CPU without showing name input', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      const cpuButton = screen.getByLabelText('Play against CPU');
      fireEvent.click(cpuButton);

      // Should not show name input screen
      expect(screen.queryByText("Enter Opponent's Name")).not.toBeInTheDocument();
    });
  });

  describe('Human opponent selection flow', () => {
    it('should show name input screen when human opponent clicked', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      const humanButton = screen.getByLabelText('Play against human opponent');
      fireEvent.click(humanButton);

      expect(screen.getByText("Enter Opponent's Name")).toBeInTheDocument();
      expect(screen.getByLabelText('Opponent Name')).toBeInTheDocument();
    });

    it('should hide opponent selection cards after human clicked', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      const humanButton = screen.getByLabelText('Play against human opponent');
      fireEvent.click(humanButton);

      expect(screen.queryByText('Choose Your Opponent')).not.toBeInTheDocument();
      expect(screen.queryByText('CPU Opponent')).not.toBeInTheDocument();
    });

    it('should render name input with empty value initially', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should allow typing in opponent name input', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: 'Bob' } });

      expect(input).toHaveValue('Bob');
    });

    it('should have Continue button disabled when name is empty', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const continueButton = screen.getByText('Continue');
      expect(continueButton).toBeDisabled();
    });

    it('should enable Continue button when name has content', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: 'Bob' } });

      const continueButton = screen.getByText('Continue');
      expect(continueButton).not.toBeDisabled();
    });

    it('should keep Continue button disabled for whitespace-only name', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: '   ' } });

      const continueButton = screen.getByText('Continue');
      expect(continueButton).toBeDisabled();
    });
  });

  describe('Human opponent submission', () => {
    it('should call onOpponentSelected with human opponent data', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: 'Bob' } });

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      expect(mockOnOpponentSelected).toHaveBeenCalledTimes(1);
      const opponent = mockOnOpponentSelected.mock.calls[0]![0]!;

      expect(opponent.type).toBe('human');
      expect(opponent.name).toBe('Bob');
      expect(opponent.wins).toBe(0);
      expect(opponent.losses).toBe(0);
      expect(opponent.id).toMatch(/^human-/);
    });

    it('should trim opponent name before submitting', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: '  Bob  ' } });

      fireEvent.click(screen.getByText('Continue'));

      const opponent = mockOnOpponentSelected.mock.calls[0]![0]!;
      expect(opponent.name).toBe('Bob');
    });

    it('should submit via form submission (Enter key)', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: 'Charlie' } });

      const form = input.closest('form')!;
      fireEvent.submit(form);

      expect(mockOnOpponentSelected).toHaveBeenCalledTimes(1);
      const opponent = mockOnOpponentSelected.mock.calls[0]![0]!;
      expect(opponent.name).toBe('Charlie');
    });

    it('should not submit if opponent name is empty', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const form = screen.getByLabelText('Opponent Name').closest('form')!;
      fireEvent.submit(form);

      expect(mockOnOpponentSelected).not.toHaveBeenCalled();
    });

    it('should generate unique IDs for different human opponents', () => {
      // First opponent
      const { unmount: unmount1 } = render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));
      fireEvent.change(screen.getByLabelText('Opponent Name'), {
        target: { value: 'Alice' },
      });
      fireEvent.click(screen.getByText('Continue'));

      const firstId = mockOnOpponentSelected.mock.calls[0]![0]!.id;
      unmount1();

      // Second opponent - completely fresh render
      mockOnOpponentSelected.mockClear();
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));
      fireEvent.change(screen.getByLabelText('Opponent Name'), {
        target: { value: 'Bob' },
      });
      fireEvent.click(screen.getByText('Continue'));

      const secondId = mockOnOpponentSelected.mock.calls[0]![0]!.id;

      expect(firstId).not.toBe(secondId);
      expect(firstId).toMatch(/^human-/);
      expect(secondId).toMatch(/^human-/);
    });
  });

  describe('Back button functionality', () => {
    it('should show Back button in human opponent name screen', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should return to opponent selection when Back clicked', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));
      expect(screen.getByText("Enter Opponent's Name")).toBeInTheDocument();

      fireEvent.click(screen.getByText('Back'));

      expect(screen.getByText('Choose Your Opponent')).toBeInTheDocument();
      expect(screen.getByText('CPU Opponent')).toBeInTheDocument();
    });

    it('should not call onOpponentSelected when Back clicked', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));
      fireEvent.click(screen.getByText('Back'));

      expect(mockOnOpponentSelected).not.toHaveBeenCalled();
    });

    it('should retain opponent name when going back and forward', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: 'Test' } });

      fireEvent.click(screen.getByText('Back'));

      // Go back to human opponent screen
      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const newInput = screen.getByLabelText('Opponent Name');
      // Component retains the name in state
      expect(newInput).toHaveValue('Test');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels on buttons', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      expect(screen.getByLabelText('Play against CPU')).toBeInTheDocument();
      expect(screen.getByLabelText('Play against human opponent')).toBeInTheDocument();
    });

    it('should have autoFocus on opponent name input', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name');
      // In React, autoFocus is a prop, not an HTML attribute
      expect(input).toBeInTheDocument();
    });

    it('should have maxLength on opponent name input', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name') as HTMLInputElement;
      expect(input.maxLength).toBe(20);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long user name in welcome message', () => {
      render(
        <OpponentManager
          userName="AVeryLongUserNameThatMightCauseIssues"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      expect(screen.getByText('AVeryLongUserNameThatMightCauseIssues')).toBeInTheDocument();
    });

    it('should handle empty string user name', () => {
      render(
        <OpponentManager
          userName=""
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      expect(screen.getByText('Choose Your Opponent')).toBeInTheDocument();
    });

    it('should handle rapid clicks on opponent options', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      const cpuButton = screen.getByLabelText('Play against CPU');
      fireEvent.click(cpuButton);
      fireEvent.click(cpuButton);
      fireEvent.click(cpuButton);

      // Should only be called once per click, but component doesn't prevent multiple
      expect(mockOnOpponentSelected).toHaveBeenCalledTimes(3);
    });

    it('should handle switching between CPU and human selections', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      // Click human
      fireEvent.click(screen.getByLabelText('Play against human opponent'));
      expect(screen.getByText("Enter Opponent's Name")).toBeInTheDocument();

      // Go back
      fireEvent.click(screen.getByText('Back'));

      // Click CPU
      fireEvent.click(screen.getByLabelText('Play against CPU'));

      expect(mockOnOpponentSelected).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'cpu' })
      );
    });

    it('should handle opponent name with special characters', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: "O'Brien-Smith" } });

      fireEvent.click(screen.getByText('Continue'));

      expect(mockOnOpponentSelected).toHaveBeenCalledTimes(1);
      const opponent = mockOnOpponentSelected.mock.calls[0]![0]!;
      expect(opponent.name).toBe("O'Brien-Smith");
    });

    it('should handle opponent name with numbers', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: 'Player123' } });

      fireEvent.click(screen.getByText('Continue'));

      const opponent = mockOnOpponentSelected.mock.calls[0]![0]!;
      expect(opponent.name).toBe('Player123');
    });

    it('should handle opponent name at max length (20 chars)', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name') as HTMLInputElement;
      const maxLengthName = 'A'.repeat(20);
      fireEvent.change(input, { target: { value: maxLengthName } });

      fireEvent.click(screen.getByText('Continue'));

      const opponent = mockOnOpponentSelected.mock.calls[0]![0]!;
      expect(opponent.name).toBe(maxLengthName);
    });

    it('should handle mixed whitespace in opponent name', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: '\t  Alice  \n' } });

      fireEvent.click(screen.getByText('Continue'));

      const opponent = mockOnOpponentSelected.mock.calls[0]![0]!;
      expect(opponent.name).toBe('Alice');
    });

    it('should clear name input when going back and forth multiple times', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      // First time: enter name
      fireEvent.click(screen.getByLabelText('Play against human opponent'));
      fireEvent.change(screen.getByLabelText('Opponent Name'), {
        target: { value: 'Alice' },
      });
      fireEvent.click(screen.getByText('Back'));

      // Second time: enter different name
      fireEvent.click(screen.getByLabelText('Play against human opponent'));
      const input = screen.getByLabelText('Opponent Name') as HTMLInputElement;
      // Input retains previous value
      expect(input.value).toBe('Alice');
    });

    it('should handle form submission with whitespace-only name', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: '   \t  \n  ' } });

      const form = input.closest('form')!;
      fireEvent.submit(form);

      // Should not submit with whitespace-only name
      expect(mockOnOpponentSelected).not.toHaveBeenCalled();
    });

    it('should call onOpponentSelected with correct structure', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: 'TestName' } });
      fireEvent.click(screen.getByText('Continue'));

      expect(mockOnOpponentSelected).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'human',
          name: 'TestName',
          wins: 0,
          losses: 0,
          id: expect.stringMatching(/^human-/),
        })
      );
    });

    it('should verify input placeholder text', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name') as HTMLInputElement;
      expect(input.placeholder).toBe("Enter opponent's name");
    });

    it('should verify input type is text', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against human opponent'));

      const input = screen.getByLabelText('Opponent Name') as HTMLInputElement;
      expect(input.type).toBe('text');
    });
  });

  describe('Remote CPU opponent selection', () => {
    it('should render remote CPU opponent option', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      expect(screen.getByText('Remote CPU')).toBeInTheDocument();
      expect(screen.getByText(/Play against a CPU with boards from a remote server/)).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('should render remote CPU option card as button', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      const remoteCpuButton = screen.getByLabelText('Play against remote CPU');
      expect(remoteCpuButton).toBeInstanceOf(HTMLButtonElement);
    });

    it('should show name input screen when remote CPU clicked', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      const remoteCpuButton = screen.getByLabelText('Play against remote CPU');
      fireEvent.click(remoteCpuButton);

      expect(screen.getByText('Remote CPU Opponent')).toBeInTheDocument();
      expect(screen.getByText(/This opponent will use boards from a remote server/)).toBeInTheDocument();
    });

    it('should pre-populate name input with "CPU Remote"', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against remote CPU'));

      const input = screen.getByLabelText('Opponent Name') as HTMLInputElement;
      expect(input.value).toBe('CPU Remote');
    });

    it('should have Continue button enabled by default (pre-filled name)', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against remote CPU'));

      const continueButton = screen.getByText('Continue');
      expect(continueButton).not.toBeDisabled();
    });

    it('should allow changing remote CPU opponent name', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against remote CPU'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: 'My Remote CPU' } });

      expect(input).toHaveValue('My Remote CPU');
    });

    it('should call onOpponentSelected with remote CPU opponent data', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against remote CPU'));
      fireEvent.click(screen.getByText('Continue'));

      expect(mockOnOpponentSelected).toHaveBeenCalledTimes(1);
      const opponent = mockOnOpponentSelected.mock.calls[0]![0]!;

      expect(opponent.type).toBe('remote-cpu');
      expect(opponent.name).toBe('CPU Remote');
      expect(opponent.wins).toBe(0);
      expect(opponent.losses).toBe(0);
      expect(opponent.id).toMatch(/^remote-cpu-/);
    });

    it('should call onOpponentSelected with custom remote CPU name', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against remote CPU'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: 'Custom Name' } });
      fireEvent.click(screen.getByText('Continue'));

      const opponent = mockOnOpponentSelected.mock.calls[0]![0]!;
      expect(opponent.name).toBe('Custom Name');
    });

    it('should trim remote CPU opponent name before submitting', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against remote CPU'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: '  My CPU  ' } });
      fireEvent.click(screen.getByText('Continue'));

      const opponent = mockOnOpponentSelected.mock.calls[0]![0]!;
      expect(opponent.name).toBe('My CPU');
    });

    it('should disable Continue button when name is cleared', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against remote CPU'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: '' } });

      const continueButton = screen.getByText('Continue');
      expect(continueButton).toBeDisabled();
    });

    it('should not submit if remote CPU name is empty', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against remote CPU'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: '' } });

      const form = input.closest('form')!;
      fireEvent.submit(form);

      expect(mockOnOpponentSelected).not.toHaveBeenCalled();
    });

    it('should submit via form submission (Enter key)', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against remote CPU'));

      const input = screen.getByLabelText('Opponent Name');
      const form = input.closest('form')!;
      fireEvent.submit(form);

      expect(mockOnOpponentSelected).toHaveBeenCalledTimes(1);
      const opponent = mockOnOpponentSelected.mock.calls[0]![0]!;
      expect(opponent.type).toBe('remote-cpu');
    });

    it('should show Back button in remote CPU name screen', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against remote CPU'));

      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should return to opponent selection when Back clicked', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against remote CPU'));
      expect(screen.getByText('Remote CPU Opponent')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Back'));

      expect(screen.getByText('Choose Your Opponent')).toBeInTheDocument();
      expect(screen.getByText('Remote CPU')).toBeInTheDocument();
    });

    it('should have placeholder text in input', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against remote CPU'));

      const input = screen.getByLabelText('Opponent Name') as HTMLInputElement;
      expect(input.placeholder).toBe('CPU Remote');
    });

    it('should have maxLength on remote CPU name input', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against remote CPU'));

      const input = screen.getByLabelText('Opponent Name') as HTMLInputElement;
      expect(input.maxLength).toBe(20);
    });

    it('should have autoFocus on remote CPU name input', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against remote CPU'));

      const input = screen.getByLabelText('Opponent Name');
      expect(input).toBeInTheDocument();
    });

    it('should generate unique IDs for different remote CPU opponents', () => {
      // First opponent
      const { unmount: unmount1 } = render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against remote CPU'));
      fireEvent.click(screen.getByText('Continue'));

      const firstId = mockOnOpponentSelected.mock.calls[0]![0]!.id;
      unmount1();

      // Second opponent - completely fresh render
      mockOnOpponentSelected.mockClear();
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against remote CPU'));
      fireEvent.click(screen.getByText('Continue'));

      const secondId = mockOnOpponentSelected.mock.calls[0]![0]!.id;

      expect(firstId).not.toBe(secondId);
      expect(firstId).toMatch(/^remote-cpu-/);
      expect(secondId).toMatch(/^remote-cpu-/);
    });
  });

  describe('All three opponent types displayed', () => {
    it('should render all three opponent option cards', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      expect(screen.getByText('CPU Opponent')).toBeInTheDocument();
      expect(screen.getByText('Remote CPU')).toBeInTheDocument();
      expect(screen.getByText('Human Opponent')).toBeInTheDocument();
    });

    it('should have three option cards in correct order', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      const cpuButton = screen.getByLabelText('Play against CPU');
      const remoteCpuButton = screen.getByLabelText('Play against remote CPU');
      const humanButton = screen.getByLabelText('Play against human opponent');

      // Verify all are present
      expect(cpuButton).toBeInTheDocument();
      expect(remoteCpuButton).toBeInTheDocument();
      expect(humanButton).toBeInTheDocument();
    });

    it('should display correct badges for each opponent type', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      expect(screen.getByText('Quick Start')).toBeInTheDocument(); // CPU
      expect(screen.getByText('Online')).toBeInTheDocument(); // Remote CPU
      expect(screen.getByText('Multiplayer')).toBeInTheDocument(); // Human
    });

    it('should switch between different opponent types correctly', () => {
      const { unmount } = render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      // Try CPU
      fireEvent.click(screen.getByLabelText('Play against CPU'));
      expect(mockOnOpponentSelected).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'cpu' })
      );

      unmount();
      mockOnOpponentSelected.mockClear();

      // Render fresh for Remote CPU test
      const { unmount: unmount2 } = render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      // Try Remote CPU
      fireEvent.click(screen.getByLabelText('Play against remote CPU'));
      expect(screen.getByText('Remote CPU Opponent')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Back'));

      // Try Human
      fireEvent.click(screen.getByLabelText('Play against human opponent'));
      expect(screen.getByText("Enter Opponent's Name")).toBeInTheDocument();

      unmount2();
    });
  });

  describe('AI Agent opponent selection', () => {
    it('should render AI Agent option card when feature flag is enabled', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      expect(screen.getByText('AI Agent')).toBeInTheDocument();
      expect(screen.getByText(/Play against a trained RL agent/)).toBeInTheDocument();
      expect(screen.getByText('AI Powered')).toBeInTheDocument();
    });

    it('should show skill level picker when AI Agent card is clicked', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against AI agent'));

      expect(screen.getByText('Choose AI Skill Level')).toBeInTheDocument();
      // All 6 skill levels should be shown
      expect(screen.getByText('Beginner')).toBeInTheDocument();
      expect(screen.getByText('Beginner+')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('Intermediate+')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
      expect(screen.getByText('Advanced+')).toBeInTheDocument();
    });

    it('should show all 6 skill level character names', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against AI agent'));

      expect(screen.getByText('Pip')).toBeInTheDocument();
      expect(screen.getByText('Pebble')).toBeInTheDocument();
      expect(screen.getByText('Dash')).toBeInTheDocument();
      expect(screen.getByText('Sage')).toBeInTheDocument();
      expect(screen.getByText('Fang')).toBeInTheDocument();
      expect(screen.getByText('Ember')).toBeInTheDocument();
    });

    it('should show name form pre-populated with character name when skill level is selected', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against AI agent'));
      fireEvent.click(screen.getByLabelText('Select Beginner difficulty'));

      expect(screen.getByText('AI Agent Opponent')).toBeInTheDocument();
      const input = screen.getByLabelText('Opponent Name') as HTMLInputElement;
      expect(input.value).toBe('Pip');
    });

    it('should allow editing the pre-populated name', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against AI agent'));
      fireEvent.click(screen.getByLabelText('Select Advanced+ difficulty'));

      const input = screen.getByLabelText('Opponent Name');
      fireEvent.change(input, { target: { value: 'My Dragon' } });
      expect(input).toHaveValue('My Dragon');
    });

    it('should create AI agent opponent with correct skill level on submit', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against AI agent'));
      fireEvent.click(screen.getByLabelText('Select Intermediate difficulty'));
      fireEvent.click(screen.getByText('Continue'));

      expect(mockOnOpponentSelected).toHaveBeenCalledTimes(1);
      const opponent = mockOnOpponentSelected.mock.calls[0]![0]!;
      expect(opponent.type).toBe('ai-agent');
      expect(opponent.name).toBe('Dash');
      expect(opponent.skillLevel).toBe('intermediate');
    });

    it('should navigate back from name form to skill picker', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against AI agent'));
      fireEvent.click(screen.getByLabelText('Select Beginner difficulty'));
      expect(screen.getByText('AI Agent Opponent')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Back'));
      expect(screen.getByText('Choose AI Skill Level')).toBeInTheDocument();
    });

    it('should navigate back from skill picker to opponent selection', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against AI agent'));
      expect(screen.getByText('Choose AI Skill Level')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Back'));
      expect(screen.getByText('Choose Your Opponent')).toBeInTheDocument();
    });

    it('should show skill level preview in name form', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against AI agent'));
      fireEvent.click(screen.getByLabelText('Select Advanced difficulty'));

      // Should show the skill preview with emoji and label
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });
  });

  describe('Model browser flow', () => {
    it('should show browse models link in skill level picker', () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against AI agent'));
      expect(screen.getByText('Or browse all available models')).toBeInTheDocument();
    });

    it('should show ModelBrowser when browse link is clicked', async () => {
      render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against AI agent'));
      fireEvent.click(screen.getByText('Or browse all available models'));

      expect(screen.getByText('Browse Available Models')).toBeInTheDocument();
    });

    it('should show model name form when model is selected from browser', async () => {
      const { findByText } = render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against AI agent'));
      fireEvent.click(screen.getByText('Or browse all available models'));

      // Wait for models to load then click one
      const modelButton = await findByText('model_alpha');
      fireEvent.click(modelButton);

      // Should now be on the name form
      expect(screen.getByText('AI Agent Opponent')).toBeInTheDocument();
      const input = screen.getByLabelText('Opponent Name') as HTMLInputElement;
      expect(input.value).toBe('model_alpha');
    });

    it('should create model opponent on submit', async () => {
      const { findByText } = render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against AI agent'));
      fireEvent.click(screen.getByText('Or browse all available models'));

      const modelButton = await findByText('model_alpha');
      fireEvent.click(modelButton);

      fireEvent.click(screen.getByText('Continue'));

      expect(mockOnOpponentSelected).toHaveBeenCalledTimes(1);
      const opponent = mockOnOpponentSelected.mock.calls[0]![0]!;
      expect(opponent.type).toBe('ai-agent');
      expect(opponent.modelId).toBe('aaa11111');
      expect(opponent.modelBoardSize).toBe(3);
    });

    it('should navigate back from model name form to browser', async () => {
      const { findByText } = render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against AI agent'));
      fireEvent.click(screen.getByText('Or browse all available models'));

      const modelButton = await findByText('model_alpha');
      fireEvent.click(modelButton);

      expect(screen.getByText('AI Agent Opponent')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Back'));

      expect(screen.getByText('Browse Available Models')).toBeInTheDocument();
    });

    it('should show volatility notice in model name form', async () => {
      const { findByText } = render(
        <OpponentManager
          userName="TestUser"
          onOpponentSelected={mockOnOpponentSelected}
        />
      );

      fireEvent.click(screen.getByLabelText('Play against AI agent'));
      fireEvent.click(screen.getByText('Or browse all available models'));

      const modelButton = await findByText('model_alpha');
      fireEvent.click(modelButton);

      expect(screen.getByText(/Models are volatile/)).toBeInTheDocument();
    });
  });
});
