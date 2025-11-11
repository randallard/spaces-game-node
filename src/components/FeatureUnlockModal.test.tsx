import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeatureUnlockModal } from './FeatureUnlockModal';

describe('FeatureUnlockModal', () => {
  const mockOnContinue = vi.fn();

  beforeEach(() => {
    mockOnContinue.mockClear();
  });

  it('should render with unlocked board sizes', () => {
    render(
      <FeatureUnlockModal
        unlockedBoardSizes={[4, 5]}
        deckModeUnlocked={false}
        onContinue={mockOnContinue}
      />
    );

    expect(screen.getByText('New Features Unlocked!')).toBeInTheDocument();
    expect(screen.getByText('New Board Sizes')).toBeInTheDocument();
    expect(screen.getByText('4×4')).toBeInTheDocument();
    expect(screen.getByText('5×5')).toBeInTheDocument();
  });

  it('should render when deck mode is unlocked', () => {
    render(
      <FeatureUnlockModal
        unlockedBoardSizes={[]}
        deckModeUnlocked={true}
        onContinue={mockOnContinue}
      />
    );

    expect(screen.getByText('Deck Mode')).toBeInTheDocument();
    expect(screen.getByText(/Battle through 10 rounds/)).toBeInTheDocument();
  });

  it('should render both board sizes and deck mode', () => {
    render(
      <FeatureUnlockModal
        unlockedBoardSizes={[6, 7, 8, 9, 10]}
        deckModeUnlocked={true}
        onContinue={mockOnContinue}
      />
    );

    expect(screen.getByText('New Board Sizes')).toBeInTheDocument();
    expect(screen.getByText('6×6')).toBeInTheDocument();
    expect(screen.getByText('Deck Mode')).toBeInTheDocument();
  });

  it('should call onContinue when continue button is clicked', () => {
    render(
      <FeatureUnlockModal
        unlockedBoardSizes={[4]}
        deckModeUnlocked={false}
        onContinue={mockOnContinue}
      />
    );

    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    expect(mockOnContinue).toHaveBeenCalledTimes(1);
  });

  it('should handle empty unlocks gracefully', () => {
    render(
      <FeatureUnlockModal
        unlockedBoardSizes={[]}
        deckModeUnlocked={false}
        onContinue={mockOnContinue}
      />
    );

    expect(screen.getByText('New Features Unlocked!')).toBeInTheDocument();
    expect(screen.getByText(/Keep playing to unlock more features/)).toBeInTheDocument();
  });
});
