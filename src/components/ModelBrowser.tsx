/**
 * ModelBrowser component for browsing available AI models
 * @module components/ModelBrowser
 */

import { useState, useEffect, useCallback, type ReactElement } from 'react';
import { fetchAvailableModels, type ModelInfo } from '@/utils/ai-agent-inference';
import { FogOfWarInfoModal } from './FogOfWarInfoModal';
import styles from './ModelBrowser.module.css';

export interface ModelBrowserProps {
  /** Callback when a model is selected */
  onModelSelected: (modelId: string, label: string, boardSize: number) => void;
  /** Callback to go back */
  onBack: () => void;
}

type FogFilter = 'all' | 'standard' | 'fog';

/**
 * Browse and select from available AI models on the inference server.
 *
 * @component
 */
export function ModelBrowser({ onModelSelected, onBack }: ModelBrowserProps): ReactElement {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sizeFilter, setSizeFilter] = useState<number | 'all'>('all');
  const [fogFilter, setFogFilter] = useState<FogFilter>('all');
  const [showFogInfo, setShowFogInfo] = useState(false);

  const loadModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchAvailableModels();
    if (result.length === 0) {
      setError('No models available. Is the inference server running?');
    }
    setModels(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Compute unique board sizes from models
  const boardSizes = [...new Set(models.map((m) => m.board_size))].sort((a, b) => a - b);

  // Apply filters
  const filtered = models
    .filter((m) => sizeFilter === 'all' || m.board_size === sizeFilter)
    .filter((m) => {
      if (fogFilter === 'standard') return !m.use_fog;
      if (fogFilter === 'fog') return m.use_fog;
      return true;
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading models...</div>
        <div className={styles.buttonGroup}>
          <button type="button" onClick={onBack} className={styles.backButton}>
            Back
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={loadModels} className={styles.retryButton}>
            Retry
          </button>
        </div>
        <div className={styles.buttonGroup}>
          <button type="button" onClick={onBack} className={styles.backButton}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Board size:</span>
          <select
            className={styles.filterSelect}
            value={sizeFilter}
            onChange={(e) =>
              setSizeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            aria-label="Filter by board size"
          >
            <option value="all">All sizes</option>
            {boardSizes.map((s) => (
              <option key={s} value={s}>
                {s}×{s}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Type:</span>
          <select
            className={styles.filterSelect}
            value={fogFilter}
            onChange={(e) => setFogFilter(e.target.value as FogFilter)}
            aria-label="Filter by model type"
          >
            <option value="all">All</option>
            <option value="standard">Standard</option>
            <option value="fog">Fog of War</option>
          </select>
        </div>
      </div>

      {/* Model list */}
      {filtered.length === 0 ? (
        <div className={styles.emptyMessage}>No models match the selected filters.</div>
      ) : (
        <div className={styles.modelList}>
          {filtered.map((m) => (
            <button
              key={m.model_id}
              className={styles.modelRow}
              onClick={() => onModelSelected(m.model_id, m.label, m.board_size)}
              aria-label={`Select model ${m.label}`}
            >
              <span className={styles.modelLabel}>{m.label}</span>
              <span className={styles.sizeBadge}>{m.board_size}×{m.board_size}</span>
              {m.use_fog ? (
                <span className={styles.fogBadge}>fog</span>
              ) : (
                <span className={styles.standardBadge}>standard</span>
              )}
              <button
                type="button"
                className={styles.infoIcon}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFogInfo(true);
                }}
                aria-label="What is fog of war?"
                title="What is fog of war?"
              >
                ?
              </button>
            </button>
          ))}
        </div>
      )}

      <div className={styles.notice}>
        Models are volatile and may change between server deployments.
      </div>

      <div className={styles.buttonGroup}>
        <button type="button" onClick={onBack} className={styles.backButton}>
          Back
        </button>
      </div>

      <FogOfWarInfoModal isOpen={showFogInfo} onClose={() => setShowFogInfo(false)} />
    </div>
  );
}
