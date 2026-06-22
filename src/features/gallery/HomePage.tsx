import { Link, useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';
import { useRecordsStore } from '../../stores/recordsStore';
import { loadActiveSession, clearActiveSession } from '../../services/storage';
import { useMemo } from 'react';
import zhTW from '../../i18n/zh-TW';
import styles from './HomePage.module.css';

export function HomePage() {
  const navigate = useNavigate();
  const records = useRecordsStore((s) => s.records);
  const session = useGameStore((s) => s.session);

  const hasActiveSession = useMemo(() => {
    if (session && (session.phase === 'playing' || session.phase === 'paused')) {
      return true;
    }
    return loadActiveSession() != null;
  }, [session]);

  const handleContinue = () => {
    const s = useGameStore.getState().session;
    if (s) {
      navigate(`/play/${s.id}`);
    } else {
      const saved = loadActiveSession();
      if (saved) {
        const result = useGameStore.getState().restoreGame(saved);
        if (result.ok) {
          navigate(`/play/${result.session.id}`);
        } else {
          clearActiveSession();
        }
      }
    }
  };

  const recordEntries = Object.entries(records);

  return (
    <div className={styles.home}>
      <h1 className={styles.title}>{zhTW.home.title}</h1>

      <nav className={styles.nav}>
        {hasActiveSession && (
          <button
            type="button"
            className={`${styles.link} ${styles.linkSecondary}`}
            onClick={handleContinue}
          >
            {zhTW.home.continueGame}
          </button>
        )}
        <Link to="/images" className={`${styles.link} ${styles.linkPrimary}`}>
          {zhTW.home.newGame}
        </Link>
        <Link to="/settings" className={`${styles.link} ${styles.linkText}`}>
          {zhTW.home.settings}
        </Link>
      </nav>

      <section className={styles.recordsSection}>
        <h2 className={styles.recordsTitle}>{zhTW.home.bestRecords}</h2>
        {recordEntries.length === 0 ? (
          <p className={styles.noRecords}>{zhTW.home.noBestRecords}</p>
        ) : (
          <ul className={styles.recordsList}>
            {recordEntries.map(([key, record]) => {
              const [imageId, difficulty] = key.split(':');
              return (
                <li key={key} className={styles.recordItem}>
                  <span className={styles.recordKey}>
                    {imageId} · {zhTW.difficulty[difficulty as keyof typeof zhTW.difficulty]}
                  </span>
                  <span className={styles.recordValue}>
                    <span>{zhTW.records.score}：{record.score}</span>
                    <span>{zhTW.records.time}：{(record.elapsedMs / 1000).toFixed(1)}s</span>
                    <span>{zhTW.records.moves}：{record.moves}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
