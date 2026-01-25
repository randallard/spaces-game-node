/**
 * Tests for LoadingChallenge component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingChallenge } from './LoadingChallenge';

describe('LoadingChallenge', () => {
  describe('Rendering', () => {
    it('should render loading message', () => {
      render(<LoadingChallenge userName="Alice" />);

      expect(screen.getByText(/Retrieving information for the round/)).toBeInTheDocument();
    });

    it('should display user name in score section', () => {
      render(<LoadingChallenge userName="Alice" />);

      expect(screen.getByText(/Score: Alice/)).toBeInTheDocument();
    });

    it('should display user name in matchup section', () => {
      render(<LoadingChallenge userName="Bob" />);

      expect(screen.getByText(/vs Bob/)).toBeInTheDocument();
    });

    it('should show loading icon', () => {
      render(<LoadingChallenge userName="Alice" />);

      expect(screen.getByText('⏳')).toBeInTheDocument();
    });

    it('should show skeleton placeholders for round info', () => {
      render(<LoadingChallenge userName="Alice" />);

      expect(screen.getByText(/Round/)).toBeInTheDocument();
      expect(screen.getByText(/of/)).toBeInTheDocument();
    });

    it('should show board size label', () => {
      render(<LoadingChallenge userName="Alice" />);

      expect(screen.getByText(/Board Size:/)).toBeInTheDocument();
    });

    it('should render with different user names', () => {
      const { rerender } = render(<LoadingChallenge userName="Player1" />);
      expect(screen.getByText(/vs Player1/)).toBeInTheDocument();

      rerender(<LoadingChallenge userName="Player2" />);
      expect(screen.getByText(/vs Player2/)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should render spinner container', () => {
      const { container } = render(<LoadingChallenge userName="Alice" />);

      const spinner = container.querySelector('[class*="spinner"]');
      expect(spinner).toBeInTheDocument();
    });

    it('should have loading container', () => {
      const { container } = render(<LoadingChallenge userName="Alice" />);

      const loadingContainer = container.querySelector('[class*="container"]');
      expect(loadingContainer).toBeInTheDocument();
    });
  });
});
