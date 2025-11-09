import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelpModal } from './HelpModal';

describe('HelpModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(<HelpModal isOpen={false} onClose={mockOnClose} />);

    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(<HelpModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Why Are Some Opponent Moves Hidden?')).toBeInTheDocument();
  });

  it('should display main explanation', () => {
    render(<HelpModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/You can only see the moves your opponent/)).toBeInTheDocument();
    expect(screen.getByText(/actually made/)).toBeInTheDocument();
  });

  it('should display round end conditions', () => {
    render(<HelpModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Rounds End When:')).toBeInTheDocument();
    expect(screen.getByText('A player reaches the goal')).toBeInTheDocument();
    expect(screen.getByText('A player hits a trap')).toBeInTheDocument();
    expect(screen.getByText('Players collide')).toBeInTheDocument();
    expect(screen.getByText('Both players complete their sequences')).toBeInTheDocument();
  });

  it('should display example scenario', () => {
    render(<HelpModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Example:')).toBeInTheDocument();
    expect(screen.getByText(/If your opponent planned 5 moves/)).toBeInTheDocument();
    expect(screen.getByText(/Their remaining 3 moves stay hidden!/)).toBeInTheDocument();
  });

  it('should display strategic note', () => {
    render(<HelpModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Strategic Note:')).toBeInTheDocument();
    expect(screen.getByText(/This prevents you from gaining information/)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<HelpModal isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Got It button is clicked', () => {
    render(<HelpModal isOpen={true} onClose={mockOnClose} />);

    const gotItButton = screen.getByText('Got It!');
    fireEvent.click(gotItButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should render with correct title', () => {
    render(<HelpModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Why Are Some Opponent Moves Hidden?')).toBeInTheDocument();
  });

  it('should not close when modal content is clicked', () => {
    render(<HelpModal isOpen={true} onClose={mockOnClose} />);

    const modalContent = screen.getByText('Why Are Some Opponent Moves Hidden?');
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should transition from closed to open', () => {
    const { rerender } = render(<HelpModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByText('Why Are Some Opponent Moves Hidden?')).not.toBeInTheDocument();

    rerender(<HelpModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Why Are Some Opponent Moves Hidden?')).toBeInTheDocument();
  });

  it('should transition from open to closed', () => {
    const { rerender } = render(<HelpModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Why Are Some Opponent Moves Hidden?')).toBeInTheDocument();

    rerender(<HelpModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByText('Why Are Some Opponent Moves Hidden?')).not.toBeInTheDocument();
  });
});
