/**
 * OpponentAvatar component tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OpponentAvatar } from './OpponentAvatar';

describe('OpponentAvatar', () => {
  describe('Discord avatar display', () => {
    it('should display Discord avatar when discordId and discordAvatar are provided', () => {
      const { container } = render(
        <OpponentAvatar
          opponentName="Alice"
          discordId="123456789"
          discordAvatar="a1b2c3d4e5"
          size={48}
        />
      );

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img?.src).toContain('cdn.discordapp.com/avatars/123456789/a1b2c3d4e5');
    });

    it('should display Discord default avatar when only discordId is provided', () => {
      const { container } = render(
        <OpponentAvatar
          opponentName="Bob"
          discordId="987654321"
          size={48}
        />
      );

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img?.src).toContain('cdn.discordapp.com/embed/avatars/');
    });

    it('should use correct size parameter', () => {
      const { container } = render(
        <OpponentAvatar
          opponentName="Charlie"
          discordId="123456789"
          discordAvatar="abc123"
          size={64}
        />
      );

      const img = container.querySelector('img');
      expect(img?.src).toContain('size=64');
    });

    it('should detect animated avatars and use gif format', () => {
      const { container } = render(
        <OpponentAvatar
          opponentName="Dana"
          discordId="123456789"
          discordAvatar="a_animated123"
        />
      );

      const img = container.querySelector('img');
      expect(img?.src).toContain('.gif');
    });

    it('should use png format for non-animated avatars', () => {
      const { container } = render(
        <OpponentAvatar
          opponentName="Eve"
          discordId="123456789"
          discordAvatar="static123"
        />
      );

      const img = container.querySelector('img');
      expect(img?.src).toContain('.png');
    });
  });

  describe('Fallback display', () => {
    it('should display initials when no Discord info is provided', () => {
      render(
        <OpponentAvatar
          opponentName="Alice Bob"
          size={48}
        />
      );

      expect(screen.getByText('AB')).toBeInTheDocument();
    });

    it('should display first two characters for single-word names', () => {
      render(
        <OpponentAvatar
          opponentName="Alice"
          size={48}
        />
      );

      expect(screen.getByText('AL')).toBeInTheDocument();
    });

    it('should uppercase initials', () => {
      render(
        <OpponentAvatar
          opponentName="alice bob"
          size={48}
        />
      );

      expect(screen.getByText('AB')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <OpponentAvatar
          opponentName="Alice"
          className="custom-class"
        />
      );

      const avatar = container.firstChild;
      expect(avatar).toHaveClass('custom-class');
    });

    it('should use default size of 40 when not specified', () => {
      const { container } = render(
        <OpponentAvatar
          opponentName="Alice"
        />
      );

      const avatar = container.firstChild as HTMLElement;
      expect(avatar?.style.width).toBe('40px');
      expect(avatar?.style.height).toBe('40px');
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for Discord avatars', () => {
      render(
        <OpponentAvatar
          opponentName="Alice"
          discordId="123456789"
          discordAvatar="abc123"
        />
      );

      const img = screen.getByAltText("Alice's avatar");
      expect(img).toBeInTheDocument();
    });

    it('should have title attribute for initials fallback', () => {
      const { container } = render(
        <OpponentAvatar
          opponentName="Alice Bob"
        />
      );

      const avatar = container.firstChild as HTMLElement;
      expect(avatar?.title).toBe('Alice Bob');
    });
  });
});
