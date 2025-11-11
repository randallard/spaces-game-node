/**
 * TutorialIntro - First screen of the tutorial wizard
 * @module components/TutorialIntro
 */

import { useState, type ReactElement } from 'react';
import type { CreatureId } from '@/types';
import { getAllCreatures } from '@/types/creature';
import { CpuSamCustomizer } from './CpuSamCustomizer';
import styles from './TutorialIntro.module.css';

export interface TutorialIntroProps {
  /** Callback when player clicks Next */
  onNext: (playerCreature: CreatureId, cpuSamData: { name: string; creature: CreatureId }) => void;
  /** Callback when player clicks Skip */
  onSkip: () => void;
  /** Whether user arrived via a challenge URL */
  hasIncomingChallenge?: boolean;
}

/**
 * Tutorial introduction screen
 * Shows CPU Sam challenge, creature selection, and customization options
 */
export function TutorialIntro({ onNext, onSkip, hasIncomingChallenge = false }: TutorialIntroProps): ReactElement {
  const creatures = getAllCreatures();

  // Get random creature IDs for defaults
  const getRandomCreatureId = (): CreatureId => {
    const randomIndex = Math.floor(Math.random() * creatures.length);
    return creatures[randomIndex]!.id;
  };

  const [playerCreature, setPlayerCreature] = useState<CreatureId>(getRandomCreatureId());
  const [cpuSamName, setCpuSamName] = useState('CPU Sam');
  const [cpuSamCreature, setCpuSamCreature] = useState<CreatureId>('bug');
  const [showCustomizer, setShowCustomizer] = useState(false);

  const handleNext = () => {
    onNext(playerCreature, { name: cpuSamName, creature: cpuSamCreature });
  };

  const handleSaveCustomization = (name: string, creature: CreatureId) => {
    setCpuSamName(name);
    setCpuSamCreature(creature);
    setShowCustomizer(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Bug Forward Image */}
        <div className={styles.heroImage}>
          <img
            src="/creatures/bug/forward.svg"
            alt="Bug creature moving forward"
            className={styles.creatureImage}
          />
        </div>

        {/* Challenge Text */}
        <div className={styles.challengeText}>
          {hasIncomingChallenge ? (
            <>
              <p className={styles.mainText}>
                Looks like you've been challenged!
              </p>
              <p className={styles.mainText}>
                Let me show you an easy round against <strong>{cpuSamName}</strong> first!
              </p>
            </>
          ) : (
            <>
              <p className={styles.mainText}>
                <strong>{cpuSamName}</strong> thinks their bot can get to the goal before yours!
              </p>
              <p className={styles.mainText}>Let me show you how to take them on!</p>
            </>
          )}
        </div>

        {/* CPU Sam Customization Link */}
        <div className={styles.customizeSection}>
          <button onClick={() => setShowCustomizer(true)} className={styles.customizeLink}>
            Customize {cpuSamName}
          </button>
        </div>

        {/* Player Creature Selection */}
        <div className={styles.creatureSelection}>
          <h3 className={styles.sectionTitle}>Choose Your Bot</h3>
          <div className={styles.fieldGroup}>
            <label htmlFor="player-creature" className={styles.label}>
              Your Creature
            </label>
            <select
              id="player-creature"
              value={playerCreature}
              onChange={(e) => setPlayerCreature(e.target.value)}
              className={styles.select}
            >
              {creatures.map((creature) => (
                <option key={creature.id} value={creature.id}>
                  {creature.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Next Button */}
        <div className={styles.actions}>
          <button onClick={handleNext} className={styles.nextButton}>
            Next
          </button>
        </div>
      </div>

      {/* Skip Button (lower right) */}
      <button onClick={onSkip} className={styles.skipButton}>
        Skip Tutorial
      </button>

      {/* CPU Sam Customizer Modal */}
      {showCustomizer && (
        <CpuSamCustomizer
          currentName={cpuSamName}
          currentCreature={cpuSamCreature}
          onSave={handleSaveCustomization}
          onCancel={() => setShowCustomizer(false)}
        />
      )}
    </div>
  );
}
