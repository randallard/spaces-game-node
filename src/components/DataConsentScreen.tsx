/**
 * DataConsentScreen — shown once before the tutorial for new users.
 * Explains what the server is used for and lets the player choose
 * their data sharing level.
 */

import { useState, type ReactElement } from 'react';
import type { DataSharingLevel } from '@/types';
import styles from './DataConsentScreen.module.css';

const RESEARCH_URL = '/research';

export interface DataConsentScreenProps {
  /** Called when the player confirms their choice */
  onContinue: (choice: DataSharingLevel) => void;
}

const OPTIONS: Array<{
  value: DataSharingLevel;
  label: string;
  description: string;
}> = [
  {
    value: 'full',
    label: 'Full anonymous data',
    description:
      'Share board and game data, linked by an anonymous player ID so we can study how players learn over time. Still zero PII — no name, no email, no IP address, no cookies.',
  },
  {
    value: 'minimal',
    label: 'Minimal data — support AI research only',
    description:
      'Share anonymous board and outcome data with no player ID. Each game is independent — nothing can be correlated across sessions.',
  },
  {
    value: 'none',
    label: 'No data — offline only',
    description:
      'Nothing is sent to our servers for research. Multiplayer still works by sharing game links manually, exactly as it does today.',
  },
];

export function DataConsentScreen({ onContinue }: DataConsentScreenProps): ReactElement {
  const [selected, setSelected] = useState<DataSharingLevel>('full');
  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <h1 className={styles.title}>Before you play</h1>

        <p className={styles.intro}>
          This game runs on a server that does two things: it powers{' '}
          <strong>multiplayer games with friends</strong> and collects{' '}
          <strong>anonymous game data</strong> used to research how artificial intelligence learns
          to play strategy games.
        </p>

        <p className={styles.intro}>
          We never collect personal information — no name, no email, no IP address, and no
          cookies are placed on your device. Choose how much you'd like to share:
        </p>

        <div className={styles.options}>
          {OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`${styles.option} ${selected === opt.value ? styles.optionSelected : ''}`}
            >
              <input
                type="radio"
                name="data-sharing"
                value={opt.value}
                checked={selected === opt.value}
                onChange={() => setSelected(opt.value)}
                className={styles.radio}
              />
              <div className={styles.optionContent}>
                <span className={styles.optionLabel}>{opt.label}</span>
                <span className={styles.optionDescription}>{opt.description}</span>
              </div>
            </label>
          ))}
        </div>

        <div className={styles.footer}>
          <a
            href={RESEARCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.privacyLink}
          >
            About the AI research
          </a>
          <button
            className={styles.continueButton}
            onClick={() => onContinue(selected)}
            type="button"
          >
            Continue
          </button>
        </div>

        <p className={styles.note}>
          You can review or change this at any time in your profile settings.
        </p>
      </div>
    </div>
  );
}
