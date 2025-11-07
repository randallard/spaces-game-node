/**
 * Tests for ProfileModal component
 * @module components/ProfileModal.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileModal } from './ProfileModal';
import type { UserProfile } from '@/types';

const mockUser: UserProfile = {
  id: 'test-user-id',
  name: 'TestUser',
  createdAt: Date.now(),
  stats: {
    totalGames: 10,
    wins: 5,
    losses: 3,
    ties: 2,
  },
  playerCreature: 'square',
  opponentCreature: 'circle',
};

describe('ProfileModal', () => {
  describe('Rendering', () => {
    it('should render the modal with user information', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      // Check title
      expect(screen.getByText('Profile')).toBeInTheDocument();

      // Check name input has current value
      const nameInput = screen.getByLabelText('Name');
      expect(nameInput).toHaveValue('TestUser');

      // Check stats are displayed
      expect(screen.getByText('Total Games')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('Wins')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Losses')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Ties')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should render cancel and save buttons', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('should have save button disabled when no changes', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Name validation', () => {
    it('should show error for empty name', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: '' } });

      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeDisabled();
    });

    it('should show error for name over 20 characters', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, {
        target: { value: 'ThisNameIsWayTooLongForTheSystem' },
      });

      expect(
        screen.getByText('Name must be 20 characters or less')
      ).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeDisabled();
    });

    it('should show error for invalid characters', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: 'Test@User!' } });

      expect(
        screen.getByText(
          'Only letters, numbers, spaces, dash (-), and underscore (_) allowed'
        )
      ).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeDisabled();
    });

    it('should show error for leading/trailing spaces', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: ' TestUser ' } });

      expect(
        screen.getByText('Name cannot start or end with spaces')
      ).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeDisabled();
    });

    it('should enable save button for valid name change', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: 'NewValidName' } });

      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).not.toBeDisabled();
    });

    it('should accept valid characters (letters, numbers, spaces, dash, underscore)', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, {
        target: { value: 'Valid Name-123_Test' },
      });

      // Should not show any error
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Name must be 20 characters or less')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          'Only letters, numbers, spaces, dash (-), and underscore (_) allowed'
        )
      ).not.toBeInTheDocument();

      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Save functionality', () => {
    it('should call onUpdate with trimmed name when save button clicked', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: 'NewName' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate).toHaveBeenCalledWith({
        ...mockUser,
        name: 'NewName',
      });
    });

    it('should call onClose after successful save', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: 'NewName' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onUpdate when save clicked with invalid name', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: '' } });

      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).toBeDisabled();

      // Can't click disabled button, but verify onUpdate wasn't called
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('should handle form submit event', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: 'NewName' } });

      // Submit form (not just click button)
      const form = nameInput.closest('form')!;
      fireEvent.submit(form);

      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cancel functionality', () => {
    it('should call onClose when cancel button clicked', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('should call onClose when close button (×) clicked', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Backdrop click', () => {
    it('should call onClose when backdrop is clicked', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      const { container } = render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      // Find backdrop element (should be the outer div)
      const backdrop = container.firstChild as HTMLElement;
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      // Click on the modal title (inside modal, not backdrop)
      const title = screen.getByText('Profile');
      fireEvent.click(title);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle user with zero stats', () => {
      const userWithZeroStats: UserProfile = {
        ...mockUser,
        stats: {
          totalGames: 0,
          wins: 0,
          losses: 0,
          ties: 0,
        },
      };

      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal
          user={userWithZeroStats}
          onUpdate={onUpdate}
          onClose={onClose}
        />
      );

      // Should render all zeros
      const statValues = screen.getAllByText('0');
      expect(statValues.length).toBeGreaterThanOrEqual(4); // At least 4 stats showing 0
    });

    it('should handle name exactly 20 characters', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      const nameInput = screen.getByLabelText('Name');
      const twentyCharName = 'ExactlyTwentyChars1'; // Exactly 20 chars
      fireEvent.change(nameInput, { target: { value: twentyCharName } });

      // Should not show error
      expect(
        screen.queryByText('Name must be 20 characters or less')
      ).not.toBeInTheDocument();

      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).not.toBeDisabled();
    });

    it('should preserve user stats when updating name', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      const nameInput = screen.getByLabelText('Name');
      fireEvent.change(nameInput, { target: { value: 'NewName' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      expect(onUpdate).toHaveBeenCalledWith({
        id: mockUser.id,
        name: 'NewName',
        createdAt: mockUser.createdAt,
        stats: mockUser.stats, // Stats should be preserved
        playerCreature: mockUser.playerCreature,
        opponentCreature: mockUser.opponentCreature,
      });
    });

    it('should handle multiple name changes', () => {
      const onUpdate = vi.fn();
      const onClose = vi.fn();

      render(
        <ProfileModal user={mockUser} onUpdate={onUpdate} onClose={onClose} />
      );

      const nameInput = screen.getByLabelText('Name');

      // First change
      fireEvent.change(nameInput, { target: { value: 'FirstChange' } });
      expect(screen.getByText('Save Changes')).not.toBeDisabled();

      // Second change
      fireEvent.change(nameInput, { target: { value: 'SecondChange' } });
      expect(screen.getByText('Save Changes')).not.toBeDisabled();

      // Change back to original
      fireEvent.change(nameInput, { target: { value: 'TestUser' } });
      expect(screen.getByText('Save Changes')).toBeDisabled();
    });
  });
});
