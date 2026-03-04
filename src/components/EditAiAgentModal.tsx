/**
 * EditAiAgentModal component
 * Modal for viewing and customizing per-board-size model assignments for AI agent opponents
 */

import React, { useState, useEffect, useCallback } from 'react';
import styles from './EditAiAgentModal.module.css';
import type { Opponent, ModelAssignment } from '@/types/opponent';
import { fetchAvailableModels } from '@/utils/ai-agent-inference';
import type { ModelInfo } from '@/utils/ai-agent-inference';
import { duplicateOpponent } from '@/utils/opponent-helpers';

export interface EditAiAgentModalProps {
  opponent: Opponent;
  onSave: (updatedOpponent: Opponent) => void;
  onDuplicate: (newOpponent: Opponent) => void;
  onCancel: () => void;
}

/** All preset board sizes */
const PRESET_SIZES = [
  { size: 2, label: '2×2' },
  { size: 3, label: '3×3' },
  { size: 4, label: '4×4' },
  { size: 5, label: '5×5' },
  { size: 6, label: '6×6' },
  { size: 7, label: '7×7' },
  { size: 8, label: '8×8' },
  { size: 9, label: '9×9' },
  { size: 10, label: '10×10' },
];

/** Scripted agents available for size 2 boards */
const SCRIPTED_AGENTS: Array<{ id: string; label: string }> = [
  { id: 'scripted_1', label: 'Scripted Level 1' },
  { id: 'scripted_2', label: 'Scripted Level 2' },
  { id: 'scripted_3', label: 'Scripted Level 3' },
  { id: 'scripted_4', label: 'Scripted Level 4' },
  { id: 'scripted_5', label: 'Scripted Level 5' },
];

export function EditAiAgentModal({
  opponent,
  onSave,
  onDuplicate,
  onCancel,
}: EditAiAgentModalProps): React.ReactElement {
  const [assignments, setAssignments] = useState<Record<string, ModelAssignment>>(
    () => ({ ...(opponent.modelAssignments ?? {}) })
  );
  const [duplicateName, setDuplicateName] = useState('');
  const [selectingSize, setSelectingSize] = useState<number | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const loadModels = useCallback(async () => {
    if (modelsLoaded) return;
    setLoadingModels(true);
    try {
      const result = await fetchAvailableModels();
      setModels(result);
      setModelsLoaded(true);
    } finally {
      setLoadingModels(false);
    }
  }, [modelsLoaded]);

  useEffect(() => {
    if (selectingSize !== null && !modelsLoaded) {
      loadModels();
    }
  }, [selectingSize, modelsLoaded, loadModels]);

  const handleSelectModel = (size: number, modelId: string, label: string) => {
    setAssignments((prev) => ({
      ...prev,
      [String(size)]: { modelId, label },
    }));
    setSelectingSize(null);
  };

  const handleClearAssignment = (size: number) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[String(size)];
      return next;
    });
  };

  const handleSave = () => {
    const updated: Opponent = {
      ...opponent,
      modelAssignments: Object.keys(assignments).length > 0 ? assignments : undefined,
    };
    onSave(updated);
  };

  const handleDuplicate = () => {
    if (!duplicateName.trim()) return;
    const copy = duplicateOpponent(opponent, duplicateName.trim());
    copy.modelAssignments = Object.keys(assignments).length > 0 ? { ...assignments } : undefined;
    onDuplicate(copy);
  };

  // Filter models for the currently-selecting board size
  const modelsForSize = selectingSize
    ? models.filter((m) => m.board_size === selectingSize)
    : [];
  const scriptedForSize = selectingSize === 2 ? SCRIPTED_AGENTS : [];

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Edit AI Agent</h2>

        <div className={styles.opponentInfo}>
          <span className={styles.opponentName}>{opponent.name}</span>
          <span className={styles.opponentStats}>
            Record: {opponent.wins}-{opponent.losses}
          </span>
        </div>

        {/* Duplicate Section */}
        <div className={styles.duplicateSection}>
          <input
            className={styles.duplicateInput}
            type="text"
            placeholder="New name for copy..."
            value={duplicateName}
            onChange={(e) => setDuplicateName(e.target.value)}
            aria-label="Duplicate name"
          />
          <button
            className={styles.duplicateButton}
            onClick={handleDuplicate}
            disabled={!duplicateName.trim()}
          >
            Create Copy
          </button>
        </div>

        {/* Model Selector Sub-view */}
        {selectingSize !== null && (
          <div className={styles.modelSelector}>
            <h3 className={styles.modelSelectorTitle}>
              Select model for {selectingSize}×{selectingSize}
            </h3>

            {loadingModels && (
              <div className={styles.loadingModels}>Loading models...</div>
            )}

            {!loadingModels && modelsForSize.length === 0 && scriptedForSize.length === 0 && (
              <div className={styles.noModels}>No models available for this board size.</div>
            )}

            <div className={styles.modelList}>
              {scriptedForSize.map((agent) => (
                <button
                  key={agent.id}
                  className={styles.modelItem}
                  onClick={() => handleSelectModel(selectingSize, agent.id, agent.label)}
                >
                  <span className={styles.modelLabel}>{agent.label}</span>
                  <span className={styles.modelBadge}>scripted</span>
                </button>
              ))}
              {modelsForSize.map((model) => (
                <button
                  key={model.model_id}
                  className={styles.modelItem}
                  onClick={() => handleSelectModel(selectingSize, model.model_id, model.label)}
                >
                  <span className={styles.modelLabel}>{model.label}</span>
                  <span className={styles.modelBadge}>{model.stage}</span>
                  {model.use_fog && <span className={styles.modelFogBadge}>fog</span>}
                </button>
              ))}
            </div>

            <button
              className={styles.modelSelectorBack}
              onClick={() => setSelectingSize(null)}
            >
              Back
            </button>
          </div>
        )}

        {/* Assignments List */}
        <div className={styles.assignmentsSection}>
          <h3 className={styles.assignmentsTitle}>Model Assignments</h3>
          <div className={styles.assignmentsList}>
            {PRESET_SIZES.map(({ size, label }) => {
              const assignment = assignments[String(size)];
              return (
                <div key={size} className={styles.assignmentRow}>
                  <span className={styles.assignmentSize}>{label}</span>
                  <span
                    className={`${styles.assignmentModel} ${assignment ? styles.assignmentModelSet : ''}`}
                  >
                    {assignment ? assignment.label : 'Not set'}
                  </span>
                  <div className={styles.assignmentActions}>
                    <button
                      className={styles.changeButton}
                      onClick={() => setSelectingSize(size)}
                    >
                      Change
                    </button>
                    {assignment && (
                      <button
                        className={styles.clearButton}
                        onClick={() => handleClearAssignment(size)}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className={styles.footerButtons}>
          <button className={styles.saveButton} onClick={handleSave}>
            Save
          </button>
          <button className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
