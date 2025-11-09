import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeModal } from './WelcomeModal';

describe('WelcomeModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('should render with player name', () => {
    render(<WelcomeModal playerName="Alice" onClose={mockOnClose} />);

    expect(screen.getByText(/Nice to meet you, Alice!/)).toBeInTheDocument();
  });

  it('should display CPU Tougher introduction', () => {
    render(<WelcomeModal playerName="Bob" onClose={mockOnClose} />);

    expect(screen.getByText(/CPU Tougher/)).toBeInTheDocument();
    expect(screen.getByText(/See you on the boards.../)).toBeInTheDocument();
  });

  it('should display emoji icon', () => {
    render(<WelcomeModal playerName="Charlie" onClose={mockOnClose} />);

    expect(screen.getByText('🦾')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<WelcomeModal playerName="Alice" onClose={mockOnClose} />);

    const closeButton = screen.getByText("Let's Go!");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should render close button', () => {
    render(<WelcomeModal playerName="Alice" onClose={mockOnClose} />);

    expect(screen.getByText("Let's Go!")).toBeInTheDocument();
  });

  it('should not close when modal content is clicked', () => {
    render(<WelcomeModal playerName="Alice" onClose={mockOnClose} />);

    const modalContent = screen.getByText(/Nice to meet you/);
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should handle special characters in player name', () => {
    render(<WelcomeModal playerName="O'Brien" onClose={mockOnClose} />);

    expect(screen.getByText(/Nice to meet you, O'Brien!/)).toBeInTheDocument();
  });

  it('should handle long player names', () => {
    const longName = 'VeryLongPlayerNameThatIsQuiteLong';
    render(<WelcomeModal playerName={longName} onClose={mockOnClose} />);

    expect(screen.getByText(new RegExp(`Nice to meet you, ${longName}!`))).toBeInTheDocument();
  });
});
