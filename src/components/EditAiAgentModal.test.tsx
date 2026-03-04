/**
 * Tests for EditAiAgentModal component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditAiAgentModal } from './EditAiAgentModal';
import type { Opponent } from '@/types/opponent';
import type { ModelInfo } from '@/utils/ai-agent-inference';

// Mock the inference API
vi.mock('@/utils/ai-agent-inference', () => ({
  fetchAvailableModels: vi.fn(),
}));

// Mock uuid for predictable IDs
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}));

import { fetchAvailableModels } from '@/utils/ai-agent-inference';

const mockModels: ModelInfo[] = [
  { index: 0, model_id: 'abc12345', board_size: 3, stage: 'stage3', label: 'model_alpha', use_fog: false },
  { index: 1, model_id: 'def67890', board_size: 3, stage: 'stage4', label: 'model_beta', use_fog: true },
  { index: 2, model_id: 'ghi11111', board_size: 5, stage: 'stage2', label: 'model_gamma', use_fog: false },
];

const baseOpponent: Opponent = {
  id: 'ai-agent-test-123',
  name: 'Test Agent',
  type: 'ai-agent',
  wins: 5,
  losses: 3,
  skillLevel: 'beginner',
};

describe('EditAiAgentModal', () => {
  const mockOnSave = vi.fn();
  const mockOnDuplicate = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchAvailableModels).mockResolvedValue(mockModels);
  });

  it('should render with opponent info', () => {
    render(
      <EditAiAgentModal
        opponent={baseOpponent}
        onSave={mockOnSave}
        onDuplicate={mockOnDuplicate}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Edit AI Agent')).toBeInTheDocument();
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('Record: 5-3')).toBeInTheDocument();
  });

  it('should show all preset board sizes', () => {
    render(
      <EditAiAgentModal
        opponent={baseOpponent}
        onSave={mockOnSave}
        onDuplicate={mockOnDuplicate}
        onCancel={mockOnCancel}
      />
    );

    for (const size of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      expect(screen.getByText(`${size}×${size}`)).toBeInTheDocument();
    }
  });

  it('should show current model assignments', () => {
    const opponentWithAssignments: Opponent = {
      ...baseOpponent,
      modelAssignments: {
        '3': { modelId: 'abc12345', label: 'model_alpha' },
      },
    };

    render(
      <EditAiAgentModal
        opponent={opponentWithAssignments}
        onSave={mockOnSave}
        onDuplicate={mockOnDuplicate}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('model_alpha')).toBeInTheDocument();
    // Other sizes should show "Not set"
    const notSetElements = screen.getAllByText('Not set');
    expect(notSetElements.length).toBe(8); // 9 sizes - 1 assigned
  });

  it('should open model selector when Change button is clicked', async () => {
    render(
      <EditAiAgentModal
        opponent={baseOpponent}
        onSave={mockOnSave}
        onDuplicate={mockOnDuplicate}
        onCancel={mockOnCancel}
      />
    );

    const changeButtons = screen.getAllByText('Change');
    // Click Change for 3×3 (index 1, since 2×2 is index 0)
    fireEvent.click(changeButtons[1]!);

    await waitFor(() => {
      expect(screen.getByText('Select model for 3×3')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('model_alpha')).toBeInTheDocument();
      expect(screen.getByText('model_beta')).toBeInTheDocument();
    });
  });

  it('should show scripted agents for size 2', async () => {
    render(
      <EditAiAgentModal
        opponent={baseOpponent}
        onSave={mockOnSave}
        onDuplicate={mockOnDuplicate}
        onCancel={mockOnCancel}
      />
    );

    const changeButtons = screen.getAllByText('Change');
    // Click Change for 2×2 (index 0)
    fireEvent.click(changeButtons[0]!);

    await waitFor(() => {
      expect(screen.getByText('Scripted Level 1')).toBeInTheDocument();
      expect(screen.getByText('Scripted Level 2')).toBeInTheDocument();
      expect(screen.getByText('Scripted Level 3')).toBeInTheDocument();
      expect(screen.getByText('Scripted Level 4')).toBeInTheDocument();
      expect(screen.getByText('Scripted Level 5')).toBeInTheDocument();
    });
  });

  it('should select a model and update assignment', async () => {
    render(
      <EditAiAgentModal
        opponent={baseOpponent}
        onSave={mockOnSave}
        onDuplicate={mockOnDuplicate}
        onCancel={mockOnCancel}
      />
    );

    const changeButtons = screen.getAllByText('Change');
    fireEvent.click(changeButtons[1]!); // 3×3

    await waitFor(() => {
      expect(screen.getByText('model_alpha')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('model_alpha'));

    // Should now show model_alpha as the assignment for 3×3
    // The selector should close
    expect(screen.queryByText('Select model for 3×3')).not.toBeInTheDocument();
    expect(screen.getByText('model_alpha')).toBeInTheDocument();
  });

  it('should clear an assignment', () => {
    const opponentWithAssignments: Opponent = {
      ...baseOpponent,
      modelAssignments: {
        '3': { modelId: 'abc12345', label: 'model_alpha' },
      },
    };

    render(
      <EditAiAgentModal
        opponent={opponentWithAssignments}
        onSave={mockOnSave}
        onDuplicate={mockOnDuplicate}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('model_alpha')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Clear'));

    // All should now be "Not set"
    const notSetElements = screen.getAllByText('Not set');
    expect(notSetElements.length).toBe(9);
  });

  it('should call onSave with updated opponent', async () => {
    const opponentWithAssignments: Opponent = {
      ...baseOpponent,
      modelAssignments: {
        '3': { modelId: 'abc12345', label: 'model_alpha' },
      },
    };

    render(
      <EditAiAgentModal
        opponent={opponentWithAssignments}
        onSave={mockOnSave}
        onDuplicate={mockOnDuplicate}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Save'));

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    const savedOpponent = mockOnSave.mock.calls[0]![0];
    expect(savedOpponent.id).toBe(baseOpponent.id);
    expect(savedOpponent.modelAssignments).toEqual({
      '3': { modelId: 'abc12345', label: 'model_alpha' },
    });
  });

  it('should call onDuplicate when Create Copy is clicked with a name', () => {
    render(
      <EditAiAgentModal
        opponent={baseOpponent}
        onSave={mockOnSave}
        onDuplicate={mockOnDuplicate}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByLabelText('Duplicate name');
    fireEvent.change(input, { target: { value: 'My Copy' } });
    fireEvent.click(screen.getByText('Create Copy'));

    expect(mockOnDuplicate).toHaveBeenCalledTimes(1);
    const duplicated = mockOnDuplicate.mock.calls[0]![0];
    expect(duplicated.name).toBe('My Copy');
    expect(duplicated.wins).toBe(0);
    expect(duplicated.losses).toBe(0);
  });

  it('should disable Create Copy button when name is empty', () => {
    render(
      <EditAiAgentModal
        opponent={baseOpponent}
        onSave={mockOnSave}
        onDuplicate={mockOnDuplicate}
        onCancel={mockOnCancel}
      />
    );

    const button = screen.getByText('Create Copy');
    expect(button).toBeDisabled();
  });

  it('should call onCancel when Cancel is clicked', () => {
    render(
      <EditAiAgentModal
        opponent={baseOpponent}
        onSave={mockOnSave}
        onDuplicate={mockOnDuplicate}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when overlay is clicked', () => {
    render(
      <EditAiAgentModal
        opponent={baseOpponent}
        onSave={mockOnSave}
        onDuplicate={mockOnDuplicate}
        onCancel={mockOnCancel}
      />
    );

    // Click the overlay (modal background)
    const overlay = screen.getByText('Edit AI Agent').closest(`.${CSS.escape('modalOverlay')}`) ?? document.querySelector('[class*="modalOverlay"]');
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    }
  });

  it('should save with no modelAssignments when all are cleared', () => {
    const opponentWithAssignments: Opponent = {
      ...baseOpponent,
      modelAssignments: {
        '3': { modelId: 'abc12345', label: 'model_alpha' },
      },
    };

    render(
      <EditAiAgentModal
        opponent={opponentWithAssignments}
        onSave={mockOnSave}
        onDuplicate={mockOnDuplicate}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Clear'));
    fireEvent.click(screen.getByText('Save'));

    const savedOpponent = mockOnSave.mock.calls[0]![0];
    expect(savedOpponent.modelAssignments).toBeUndefined();
  });
});
