/**
 * Tests for FogOfWarInfoModal component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FogOfWarInfoModal } from './FogOfWarInfoModal';

describe('FogOfWarInfoModal', () => {
  it('should render nothing when closed', () => {
    const { container } = render(
      <FogOfWarInfoModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('should render modal content when open', () => {
    render(<FogOfWarInfoModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Standard vs Fog of War Models')).toBeInTheDocument();
    expect(screen.getByText('Standard Mode')).toBeInTheDocument();
    expect(screen.getByText('Fog of War Mode')).toBeInTheDocument();
    expect(screen.getByText('Got It!')).toBeInTheDocument();
  });

  it('should call onClose when Got It button is clicked', () => {
    const onClose = vi.fn();
    render(<FogOfWarInfoModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByText('Got It!'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<FogOfWarInfoModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <FogOfWarInfoModal isOpen={true} onClose={onClose} />
    );

    // Click the overlay (first child)
    const overlay = container.firstChild as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when modal body is clicked', () => {
    const onClose = vi.fn();
    render(<FogOfWarInfoModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByText('Standard Mode'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
