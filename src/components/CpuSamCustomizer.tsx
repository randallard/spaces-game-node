/**
 * CpuSamCustomizer modal - allows player to customize CPU Sam's name and creature
 * @module components/CpuSamCustomizer
 */

import { useState, type ReactElement } from 'react';
import type { CreatureId } from '@/types';
import { getAllCreatures } from '@/types/creature';
import styles from './CpuSamCustomizer.module.css';

export interface CpuSamCustomizerProps {
  /** Current CPU Sam name */
  currentName: string;
  /** Current CPU Sam creature */
  currentCreature: CreatureId;
  /** Callback when save is clicked */
  onSave: (name: string, creature: CreatureId) => void;
  /** Callback when cancel is clicked */
  onCancel: () => void;
}

/**
 * Modal for customizing CPU Sam's name and creature
 */
export function CpuSamCustomizer({
  currentName,
  currentCreature,
  onSave,
  onCancel,
}: CpuSamCustomizerProps): ReactElement {
  const [name, setName] = useState(currentName);
  const [creature, setCreature] = useState<CreatureId>(currentCreature);
  const creatures = getAllCreatures();

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), creature);
    }
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Customize CPU Sam</h2>

        <div className={styles.fieldGroup}>
          <label htmlFor="cpu-sam-name" className={styles.label}>
            Name
          </label>
          <input
            id="cpu-sam-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            placeholder="Enter name"
            maxLength={20}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="cpu-sam-creature" className={styles.label}>
            Creature
          </label>
          <select
            id="cpu-sam-creature"
            value={creature}
            onChange={(e) => setCreature(e.target.value)}
            className={styles.select}
          >
            {creatures.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.actions}>
          <button onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </button>
          <button onClick={handleSave} className={styles.saveButton} disabled={!name.trim()}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
