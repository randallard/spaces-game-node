/**
 * Tests for BoardSizeSelector component
 * @module components/BoardSizeSelector.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardSizeSelector } from './BoardSizeSelector';

describe('BoardSizeSelector', () => {
  let mockOnSizeSelected: ReturnType<typeof vi.fn>;
  let mockOnBack: ReturnType<typeof vi.fn>;

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
      render(<BoardSizeSelector onSizeSelected={mockOnSizeSelected} />);

      const button2x2 = screen.getByLabelText('Select 2x2 board size');
      fireEvent.click(button2x2);

      expect(mockOnSizeSelected).toHaveBeenCalledWith(2);
      expect(mockOnSizeSelected).toHaveBeenCalledTimes(1);
    });

    it('should call onSizeSelected with 3 when 3x3 is clicked', () => {
      render(<BoardSizeSelector onSizeSelected={mockOnSizeSelected} />);

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
      render(<BoardSizeSelector onSizeSelected={mockOnSizeSelected} />);

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
      render(<BoardSizeSelector onSizeSelected={mockOnSizeSelected} />);

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
});
