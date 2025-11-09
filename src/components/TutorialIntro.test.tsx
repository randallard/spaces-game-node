import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TutorialIntro } from './TutorialIntro';

describe('TutorialIntro', () => {
  const mockOnNext = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    mockOnNext.mockClear();
    mockOnSkip.mockClear();
  });

  it('should render with default CPU Sam name', () => {
    render(<TutorialIntro onNext={mockOnNext} onSkip={mockOnSkip} />);

    const cpuSamElements = screen.getAllByText('CPU Sam', { exact: false });
    expect(cpuSamElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/thinks their bot can get to the goal/)).toBeInTheDocument();
  });

  it('should display creature selection dropdown', () => {
    render(<TutorialIntro onNext={mockOnNext} onSkip={mockOnSkip} />);

    expect(screen.getByLabelText('Your Creature')).toBeInTheDocument();
    expect(screen.getByText('Choose Your Bot')).toBeInTheDocument();
  });

  it('should display all creature options', () => {
    render(<TutorialIntro onNext={mockOnNext} onSkip={mockOnSkip} />);

    const select = screen.getByLabelText('Your Creature');
    expect(select).toBeInTheDocument();

    // Check for all creatures (Square, Circle, Triangle, Bug)
    expect(screen.getByText('Square')).toBeInTheDocument();
    expect(screen.getByText('Circle')).toBeInTheDocument();
    expect(screen.getByText('Triangle')).toBeInTheDocument();
    expect(screen.getByText('Bug')).toBeInTheDocument();
  });

  it('should allow changing player creature', () => {
    render(<TutorialIntro onNext={mockOnNext} onSkip={mockOnSkip} />);

    const select = screen.getByLabelText('Your Creature') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'circle' } });

    expect(select.value).toBe('circle');
  });

  it('should display hero image', () => {
    render(<TutorialIntro onNext={mockOnNext} onSkip={mockOnSkip} />);

    const image = screen.getByAltText('Bug creature moving forward');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/creatures/bug/forward.svg');
  });

  it('should call onNext with player creature and CPU Sam data when Next is clicked', () => {
    render(<TutorialIntro onNext={mockOnNext} onSkip={mockOnSkip} />);

    const select = screen.getByLabelText('Your Creature') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'square' } });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(mockOnNext).toHaveBeenCalledTimes(1);
    expect(mockOnNext).toHaveBeenCalledWith('square', { name: 'CPU Sam', creature: 'bug' });
  });

  it('should call onSkip when Skip Tutorial button is clicked', () => {
    render(<TutorialIntro onNext={mockOnNext} onSkip={mockOnSkip} />);

    const skipButton = screen.getByText('Skip Tutorial');
    fireEvent.click(skipButton);

    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it('should open CPU Sam customizer when customize link is clicked', () => {
    render(<TutorialIntro onNext={mockOnNext} onSkip={mockOnSkip} />);

    const customizeButton = screen.getByRole('button', { name: /Customize CPU Sam/i });
    fireEvent.click(customizeButton);

    // Should show customizer modal - check for unique element
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('should update CPU Sam name after customization', () => {
    render(<TutorialIntro onNext={mockOnNext} onSkip={mockOnSkip} />);

    // Open customizer
    fireEvent.click(screen.getByRole('button', { name: /Customize CPU Sam/i }));

    // Change name
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Bob' } });

    // Save
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Check updated name appears (multiple elements will have it)
    const bobElements = screen.getAllByText('Bob', { exact: false });
    expect(bobElements.length).toBeGreaterThan(0);
  });

  it('should update CPU Sam creature after customization', () => {
    render(<TutorialIntro onNext={mockOnNext} onSkip={mockOnSkip} />);

    // Open customizer
    fireEvent.click(screen.getByRole('button', { name: /Customize CPU Sam/i }));

    // Change creature
    const creatureSelect = screen.getByLabelText('Creature');
    fireEvent.change(creatureSelect, { target: { value: 'triangle' } });

    // Save
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Click Next to verify the data is passed
    fireEvent.click(screen.getByText('Next'));

    expect(mockOnNext).toHaveBeenCalledWith(
      expect.any(String),
      { name: 'CPU Sam', creature: 'triangle' }
    );
  });

  it('should close customizer when cancel is clicked', () => {
    render(<TutorialIntro onNext={mockOnNext} onSkip={mockOnSkip} />);

    // Open customizer
    fireEvent.click(screen.getByRole('button', { name: /Customize CPU Sam/i }));
    expect(screen.getByLabelText('Name')).toBeInTheDocument();

    // Cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Modal should be closed - Name input should not exist
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
  });

  it('should display challenge text with CPU Sam name', () => {
    render(<TutorialIntro onNext={mockOnNext} onSkip={mockOnSkip} />);

    expect(screen.getByText(/Let me show you how to take them on!/)).toBeInTheDocument();
  });

  it('should pass customized CPU Sam data on next', () => {
    render(<TutorialIntro onNext={mockOnNext} onSkip={mockOnSkip} />);

    // Customize CPU Sam
    fireEvent.click(screen.getByRole('button', { name: /Customize CPU Sam/i }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Robo' } });
    fireEvent.change(screen.getByLabelText('Creature'), { target: { value: 'circle' } });
    fireEvent.click(screen.getByText('Save'));

    // Select player creature
    fireEvent.change(screen.getByLabelText('Your Creature'), { target: { value: 'square' } });

    // Click Next
    fireEvent.click(screen.getByText('Next'));

    expect(mockOnNext).toHaveBeenCalledWith('square', { name: 'Robo', creature: 'circle' });
  });
});
