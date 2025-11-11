/**
 * Tests for GeneratingModal component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GeneratingModal } from './GeneratingModal';

describe('GeneratingModal', () => {
  it('should render with opponent name and board size', () => {
    render(<GeneratingModal opponentName="CPU Sam" boardSize={3} />);

    expect(screen.getByText('Generating 3×3 Boards')).toBeInTheDocument();
    expect(screen.getByText(/Creating boards and deck for CPU Sam/)).toBeInTheDocument();
  });

  it('should display spinner emoji', () => {
    render(<GeneratingModal opponentName="CPU Tougher" boardSize={2} />);

    expect(screen.getByText('⚔️')).toBeInTheDocument();
  });

  it('should render different board sizes correctly', () => {
    const { rerender } = render(<GeneratingModal opponentName="CPU Sam" boardSize={2} />);
    expect(screen.getByText('Generating 2×2 Boards')).toBeInTheDocument();

    rerender(<GeneratingModal opponentName="CPU Sam" boardSize={4} />);
    expect(screen.getByText('Generating 4×4 Boards')).toBeInTheDocument();
  });
});
