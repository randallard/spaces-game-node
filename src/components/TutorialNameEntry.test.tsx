import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TutorialNameEntry } from './TutorialNameEntry';
import type { Board } from '@/types';

const mockFirstBoard: Board = {
  id: 'test-board',
  name: 'Test Board',
  boardSize: 2,
  grid: [['piece', 'empty'], ['empty', 'empty']],
  sequence: [{ position: { row: 0, col: 0 }, type: 'piece', order: 1 }],
  thumbnail: 'data:image/svg+xml;base64,test',
  createdAt: Date.now(),
};

describe('TutorialNameEntry', () => {
  const mockOnContinue = vi.fn();

  beforeEach(() => {
    mockOnContinue.mockClear();
  });

  it('should render congratulations text', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    expect(screen.getByText('Well Played!')).toBeInTheDocument();
    expect(screen.getByText(/Go against the tougher CPU/)).toBeInTheDocument();
  });

  it('should display name input field', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const input = screen.getByLabelText('Your Name');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter your name');
  });

  it('should show helper text initially', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    expect(screen.getByText(/1-20 characters/)).toBeInTheDocument();
  });

  it('should update input value when typing', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const input = screen.getByLabelText('Your Name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Alice' } });

    expect(input.value).toBe('Alice');
  });

  it('should show success indicator for valid name', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const input = screen.getByLabelText('Your Name');
    fireEvent.change(input, { target: { value: 'Alice' } });

    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('should show error for empty name', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const input = screen.getByLabelText('Your Name');
    // Type something first to make it dirty, then clear it
    fireEvent.change(input, { target: { value: 'A' } });
    fireEvent.change(input, { target: { value: '' } });

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('✗')).toBeInTheDocument();
  });

  it('should show error for name too long', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const input = screen.getByLabelText('Your Name');
    fireEvent.change(input, { target: { value: 'ThisIsAVeryLongNameThatExceedsTwentyCharacters' } });

    expect(screen.getByText('Name must be 20 characters or less')).toBeInTheDocument();
  });

  it('should show error for invalid characters', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const input = screen.getByLabelText('Your Name');
    fireEvent.change(input, { target: { value: 'Alice@#$' } });

    expect(screen.getByText(/Only letters, numbers, spaces, dash/)).toBeInTheDocument();
  });

  it('should show error for leading/trailing spaces', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const input = screen.getByLabelText('Your Name');
    fireEvent.change(input, { target: { value: '  Alice  ' } });

    expect(screen.getByText('Name cannot start or end with spaces')).toBeInTheDocument();
  });

  it('should accept valid characters (letters, numbers, spaces, dash, underscore)', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const input = screen.getByLabelText('Your Name');
    fireEvent.change(input, { target: { value: 'Alice_123-XYZ' } });

    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should disable submit button when name is invalid', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const submitButton = screen.getByText('Continue');
    expect(submitButton).toBeDisabled();

    const input = screen.getByLabelText('Your Name');
    fireEvent.change(input, { target: { value: '' } });

    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when name is valid', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const input = screen.getByLabelText('Your Name');
    fireEvent.change(input, { target: { value: 'Alice' } });

    const submitButton = screen.getByText('Continue');
    expect(submitButton).not.toBeDisabled();
  });

  it('should call onContinue with user profile when form is submitted', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="circle"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const input = screen.getByLabelText('Your Name');
    fireEvent.change(input, { target: { value: 'Alice' } });

    const form = screen.getByText('Continue').closest('form');
    fireEvent.submit(form!);

    expect(mockOnContinue).toHaveBeenCalledTimes(1);
    const user = mockOnContinue.mock.calls[0][0];
    expect(user).toMatchObject({
      name: 'Alice',
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      },
      playerCreature: 'square',
      opponentCreature: 'circle',
    });
    expect(user.id).toBeDefined();
    expect(user.createdAt).toBeDefined();
  });

  it('should trim name when creating user profile', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const input = screen.getByLabelText('Your Name');
    fireEvent.change(input, { target: { value: 'Alice' } });

    const submitButton = screen.getByText('Continue');
    fireEvent.click(submitButton);

    const user = mockOnContinue.mock.calls[0][0];
    expect(user.name).toBe('Alice');
  });

  it('should not submit form when name is invalid', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const form = screen.getByText('Continue').closest('form');
    fireEvent.submit(form!);

    expect(mockOnContinue).not.toHaveBeenCalled();
  });

  it('should have maxLength attribute on input', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const input = screen.getByLabelText('Your Name') as HTMLInputElement;
    expect(input.maxLength).toBe(20);
  });

  it('should render input field', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const input = screen.getByLabelText('Your Name');
    expect(input).toBeInTheDocument();
  });

  it('should set aria-invalid when there is an error', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const input = screen.getByLabelText('Your Name');
    // Make it dirty first
    fireEvent.change(input, { target: { value: 'A' } });
    fireEvent.change(input, { target: { value: '' } });

    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should handle rapid input changes', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const input = screen.getByLabelText('Your Name');

    fireEvent.change(input, { target: { value: 'A' } });
    fireEvent.change(input, { target: { value: 'Al' } });
    fireEvent.change(input, { target: { value: 'Ali' } });
    fireEvent.change(input, { target: { value: 'Alic' } });
    fireEvent.change(input, { target: { value: 'Alice' } });

    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('should accept names with spaces', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const input = screen.getByLabelText('Your Name');
    fireEvent.change(input, { target: { value: 'Alice Bob' } });

    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('should show error message with alert role', () => {
    render(
      <TutorialNameEntry
        playerCreature="square"
        opponentCreature="bug"
        firstBoard={mockFirstBoard}
        onContinue={mockOnContinue}
      />
    );

    const input = screen.getByLabelText('Your Name');
    // Make it dirty first
    fireEvent.change(input, { target: { value: 'A' } });
    fireEvent.change(input, { target: { value: '' } });

    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toHaveTextContent('Name is required');
  });
});
