import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CpuSamCustomizer } from './CpuSamCustomizer';

describe('CpuSamCustomizer', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnSave.mockClear();
    mockOnCancel.mockClear();
  });

  it('should render with current name and creature', () => {
    render(
      <CpuSamCustomizer
        currentName="CPU Sam"
        currentCreature="square"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Customize CPU Sam')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CPU Sam')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Square')).toBeInTheDocument();
  });

  it('should update name when input changes', () => {
    render(
      <CpuSamCustomizer
        currentName="CPU Sam"
        currentCreature="square"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Bob' } });

    expect(nameInput).toHaveValue('Bob');
  });

  it('should update creature when select changes', () => {
    render(
      <CpuSamCustomizer
        currentName="CPU Sam"
        currentCreature="square"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const creatureSelect = screen.getByLabelText('Creature');
    fireEvent.change(creatureSelect, { target: { value: 'circle' } });

    expect(creatureSelect).toHaveValue('circle');
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <CpuSamCustomizer
        currentName="CPU Sam"
        currentCreature="square"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onSave with trimmed name and creature when save is clicked', () => {
    render(
      <CpuSamCustomizer
        currentName="CPU Sam"
        currentCreature="square"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: '  Bob  ' } });

    const creatureSelect = screen.getByLabelText('Creature');
    fireEvent.change(creatureSelect, { target: { value: 'triangle' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith('Bob', 'triangle');
  });

  it('should disable save button when name is empty', () => {
    render(
      <CpuSamCustomizer
        currentName="CPU Sam"
        currentCreature="square"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: '' } });

    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeDisabled();
  });

  it('should disable save button when name is only whitespace', () => {
    render(
      <CpuSamCustomizer
        currentName="CPU Sam"
        currentCreature="square"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: '   ' } });

    const saveButton = screen.getByText('Save');
    expect(saveButton).toBeDisabled();
  });

  it('should not call onSave when name is empty', () => {
    render(
      <CpuSamCustomizer
        currentName="CPU Sam"
        currentCreature="square"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: '' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should render modal title', () => {
    render(
      <CpuSamCustomizer
        currentName="CPU Sam"
        currentCreature="square"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Customize CPU Sam')).toBeInTheDocument();
  });

  it('should not close when modal content is clicked', () => {
    render(
      <CpuSamCustomizer
        currentName="CPU Sam"
        currentCreature="square"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const modalContent = screen.getByText('Customize CPU Sam');
    fireEvent.click(modalContent);

    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('should display all available creatures in select', () => {
    render(
      <CpuSamCustomizer
        currentName="CPU Sam"
        currentCreature="square"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Should have options for all creatures (Square, Circle, Triangle, Bug)
    expect(screen.getByText('Square')).toBeInTheDocument();
    expect(screen.getByText('Circle')).toBeInTheDocument();
    expect(screen.getByText('Triangle')).toBeInTheDocument();
    expect(screen.getByText('Bug')).toBeInTheDocument();
  });

  it('should enforce maxLength on name input', () => {
    render(
      <CpuSamCustomizer
        currentName="CPU Sam"
        currentCreature="square"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    expect(nameInput.maxLength).toBe(20);
  });
});
