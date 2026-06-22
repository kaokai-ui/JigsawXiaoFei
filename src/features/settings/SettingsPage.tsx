import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../../stores/settingsStore';
import type { Difficulty, GameSettings } from '../../domain/puzzle/types';
import { validatePieceCount, DEFAULT_PIECE_COUNTS } from '../../domain/puzzle/settings';
import { useState, useCallback } from 'react';
import zhTW from '../../i18n/zh-TW';
import styles from './SettingsPage.module.css';

const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];

const difficultyLabels: Record<Difficulty, string> = {
  easy: zhTW.settings.easy,
  normal: zhTW.settings.normal,
  hard: zhTW.settings.hard,
};

const motionLabels: Record<GameSettings['reducedMotionOverride'], string> = {
  system: zhTW.settings.motionSystem,
  reduce: zhTW.settings.motionReduce,
  full: zhTW.settings.motionFull,
};

export function SettingsPage() {
  const navigate = useNavigate();
  const pieceCountByDifficulty = useSettingsStore((s) => s.pieceCountByDifficulty);
  const showReferenceOverlay = useSettingsStore((s) => s.showReferenceOverlay);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const reducedMotionOverride = useSettingsStore((s) => s.reducedMotionOverride);

  const setPieceCount = useSettingsStore((s) => s.setPieceCount);
  const setShowReferenceOverlay = useSettingsStore((s) => s.setShowReferenceOverlay);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const setReducedMotionOverride = useSettingsStore((s) => s.setReducedMotionOverride);

  const [localCounts, setLocalCounts] = useState<Record<Difficulty, string>>({
    easy: String(pieceCountByDifficulty.easy),
    normal: String(pieceCountByDifficulty.normal),
    hard: String(pieceCountByDifficulty.hard),
  });

  const [errors, setErrors] = useState<Record<Difficulty, string | null>>({
    easy: null,
    normal: null,
    hard: null,
  });

  const handleCountChange = useCallback(
    (d: Difficulty, raw: string) => {
      setLocalCounts((prev) => ({ ...prev, [d]: raw }));
      const result = validatePieceCount(Number(raw));
      if (result.ok) {
        setPieceCount(d, result.value);
        setErrors((prev) => ({ ...prev, [d]: null }));
      } else {
        setErrors((prev) => ({ ...prev, [d]: result.error }));
      }
    },
    [setPieceCount],
  );

  const handleReset = useCallback(
    (d: Difficulty) => {
      const def = DEFAULT_PIECE_COUNTS[d];
      setLocalCounts((prev) => ({ ...prev, [d]: String(def) }));
      setPieceCount(d, def);
      setErrors((prev) => ({ ...prev, [d]: null }));
    },
    [setPieceCount],
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate('/')}
          aria-label={zhTW.settings.back}
        >
          ←
        </button>
        <h1 className={styles.title}>{zhTW.settings.title}</h1>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{zhTW.settings.pieceCount}</h2>
        {difficulties.map((d) => (
          <div key={d} className={styles.countRow}>
            <span className={styles.countLabel}>{difficultyLabels[d]}</span>
            <input
              type="number"
              min={4}
              max={100}
              value={localCounts[d]}
              onChange={(e) => handleCountChange(d, e.target.value)}
              className={`${styles.countInput} ${errors[d] ? styles.countInputError : ''}`}
            />
            <button type="button" className={styles.resetButton} onClick={() => handleReset(d)}>
              重設
            </button>
            {errors[d] && (
              <span className={styles.errorMessage}>{errors[d]}</span>
            )}
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{zhTW.settings.showReference}</h2>
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={showReferenceOverlay}
            onChange={(e) => setShowReferenceOverlay(e.target.checked)}
          />
          {zhTW.settings.showReference}
        </label>
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
          />
          {zhTW.settings.sound}
        </label>
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={hapticsEnabled}
            onChange={(e) => setHapticsEnabled(e.target.checked)}
          />
          {zhTW.settings.haptics}
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{zhTW.settings.motion}</h2>
        <div className={styles.motionGroup}>
          {(['system', 'reduce', 'full'] as const).map((v) => (
            <label key={v} className={styles.motionOption}>
              <input
                type="radio"
                name="motion"
                checked={reducedMotionOverride === v}
                onChange={() => setReducedMotionOverride(v)}
              />
              {motionLabels[v]}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
