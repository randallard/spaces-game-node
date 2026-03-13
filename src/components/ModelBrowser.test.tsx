/**
 * Tests for ModelBrowser component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModelBrowser } from './ModelBrowser';
import type { ModelInfo } from '@/utils/ai-agent-inference';

const mockModels: ModelInfo[] = [
  { index: 0, model_id: 'aaa11111', board_size: 3, category: 'difficulty', label: 'model_alpha', use_fog: true },
  { index: 1, model_id: 'bbb22222', board_size: 3, category: 'level_advancement', label: 'model_beta', use_fog: true },
  { index: 2, model_id: 'ccc33333', board_size: 5, category: 'best', label: 'model_gamma', use_fog: true },
];

// Mock the fetch function
vi.mock('@/utils/ai-agent-inference', () => ({
  fetchAvailableModels: vi.fn(),
}));

// Import the mocked module
import { fetchAvailableModels } from '@/utils/ai-agent-inference';

describe('ModelBrowser', () => {
  let mockOnModelSelected: ReturnType<typeof vi.fn>;
  let mockOnBack: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnModelSelected = vi.fn();
    mockOnBack = vi.fn();
    vi.mocked(fetchAvailableModels).mockResolvedValue(mockModels);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show loading state initially', () => {
    vi.mocked(fetchAvailableModels).mockReturnValue(new Promise(() => {})); // never resolves
    render(<ModelBrowser onModelSelected={mockOnModelSelected} onBack={mockOnBack} />);

    expect(screen.getByText('Loading models...')).toBeInTheDocument();
  });

  it('should display models after loading', async () => {
    render(<ModelBrowser onModelSelected={mockOnModelSelected} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('model_alpha')).toBeInTheDocument();
    });
    expect(screen.getByText('model_beta')).toBeInTheDocument();
    expect(screen.getByText('model_gamma')).toBeInTheDocument();
  });

  it('should show error when no models available', async () => {
    vi.mocked(fetchAvailableModels).mockResolvedValue([]);
    render(<ModelBrowser onModelSelected={mockOnModelSelected} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(/No models available/)).toBeInTheDocument();
    });
  });

  it('should show retry button on error', async () => {
    vi.mocked(fetchAvailableModels).mockResolvedValue([]);
    render(<ModelBrowser onModelSelected={mockOnModelSelected} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('should retry loading when retry button is clicked', async () => {
    vi.mocked(fetchAvailableModels).mockResolvedValueOnce([]);
    render(<ModelBrowser onModelSelected={mockOnModelSelected} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    vi.mocked(fetchAvailableModels).mockResolvedValueOnce(mockModels);
    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(screen.getByText('model_alpha')).toBeInTheDocument();
    });
  });

  it('should call onModelSelected when a model is clicked', async () => {
    render(<ModelBrowser onModelSelected={mockOnModelSelected} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('model_alpha')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Select model model_alpha'));

    expect(mockOnModelSelected).toHaveBeenCalledWith('aaa11111', 'model_alpha', 3);
  });

  it('should call onBack when Back button is clicked', async () => {
    render(<ModelBrowser onModelSelected={mockOnModelSelected} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('model_alpha')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Back'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should filter by board size', async () => {
    render(<ModelBrowser onModelSelected={mockOnModelSelected} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('model_alpha')).toBeInTheDocument();
    });

    const sizeSelect = screen.getByLabelText('Filter by board size');
    fireEvent.change(sizeSelect, { target: { value: '5' } });

    expect(screen.queryByText('model_alpha')).not.toBeInTheDocument();
    expect(screen.queryByText('model_beta')).not.toBeInTheDocument();
    expect(screen.getByText('model_gamma')).toBeInTheDocument();
  });

  it('should filter by category', async () => {
    render(<ModelBrowser onModelSelected={mockOnModelSelected} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('model_alpha')).toBeInTheDocument();
    });

    const categorySelect = screen.getByLabelText('Filter by category');
    fireEvent.change(categorySelect, { target: { value: 'level_advancement' } });

    expect(screen.queryByText('model_alpha')).not.toBeInTheDocument();
    expect(screen.getByText('model_beta')).toBeInTheDocument();
    expect(screen.queryByText('model_gamma')).not.toBeInTheDocument();
  });

  it('should show empty message when filters match nothing', async () => {
    render(<ModelBrowser onModelSelected={mockOnModelSelected} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('model_alpha')).toBeInTheDocument();
    });

    const sizeSelect = screen.getByLabelText('Filter by board size');
    fireEvent.change(sizeSelect, { target: { value: '5' } });

    const categorySelect = screen.getByLabelText('Filter by category');
    fireEvent.change(categorySelect, { target: { value: 'difficulty' } });

    expect(screen.getByText('No models match the selected filters.')).toBeInTheDocument();
  });

  it('should display board size badges', async () => {
    render(<ModelBrowser onModelSelected={mockOnModelSelected} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('model_alpha')).toBeInTheDocument();
    });

    // 3×3 appears in filter dropdown + 2 model badges = at least 3
    const badges3x3 = screen.getAllByText('3×3');
    expect(badges3x3.length).toBeGreaterThanOrEqual(2);
    // 5×5 appears in filter dropdown + 1 model badge = at least 2
    const badges5x5 = screen.getAllByText('5×5');
    expect(badges5x5.length).toBeGreaterThanOrEqual(1);
  });

  it('should display category badges', async () => {
    render(<ModelBrowser onModelSelected={mockOnModelSelected} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('model_alpha')).toBeInTheDocument();
    });

    expect(screen.getByText('difficulty')).toBeInTheDocument();
    expect(screen.getByText('level advancement')).toBeInTheDocument();
    expect(screen.getByText('best')).toBeInTheDocument();
  });

  it('should show volatility notice', async () => {
    render(<ModelBrowser onModelSelected={mockOnModelSelected} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('model_alpha')).toBeInTheDocument();
    });

    expect(screen.getByText(/Models are volatile/)).toBeInTheDocument();
  });

  it('should display category filter with all options', async () => {
    render(<ModelBrowser onModelSelected={mockOnModelSelected} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('model_alpha')).toBeInTheDocument();
    });

    const categorySelect = screen.getByLabelText('Filter by category');
    expect(categorySelect).toBeInTheDocument();
  });

  it('should sort models alphabetically by label', async () => {
    render(<ModelBrowser onModelSelected={mockOnModelSelected} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('model_alpha')).toBeInTheDocument();
    });

    const labels = screen.getAllByLabelText(/^Select model/).map(el => el.getAttribute('aria-label'));
    expect(labels).toEqual([
      'Select model model_alpha',
      'Select model model_beta',
      'Select model model_gamma',
    ]);
  });

  it('should have Back button in loading state', () => {
    vi.mocked(fetchAvailableModels).mockReturnValue(new Promise(() => {}));
    render(<ModelBrowser onModelSelected={mockOnModelSelected} onBack={mockOnBack} />);

    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('should have Back button in error state', async () => {
    vi.mocked(fetchAvailableModels).mockResolvedValue([]);
    render(<ModelBrowser onModelSelected={mockOnModelSelected} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    expect(screen.getByText('Back')).toBeInTheDocument();
  });
});
