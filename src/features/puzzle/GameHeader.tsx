import { useGameStore } from '../../stores/gameStore';
import { useUiStore } from '../../stores/uiStore';
import { TimerDisplay } from '../../components/TimerDisplay';
import zhTW from '../../i18n/zh-TW';
import styles from './GameHeader.module.css';

export function GameHeader() {
  const session = useGameStore((s) => s.session);
  const lastStartedPerfNow = useGameStore((s) => s.lastStartedPerfNow);
  const pause = useGameStore((s) => s.pause);
  const requestHint = useGameStore((s) => s.requestHint);
  const showReferencePreview = useUiStore((s) => s.showReferencePreview);
  const setShowReferencePreview = useUiStore((s) => s.setShowReferencePreview);
  const isPlaying = session?.phase === 'playing';

  if (!session) return null;

  const lockedCount = Object.values(session.pieces).filter((p) => p.status === 'locked').length;
  const totalPieces = session.pieceCount;

  const handleBack = () => {
    pause();
  };

  const handlePause = () => {
    pause();
  };

  const handleHint = () => {
    if (isPlaying) {
      requestHint();
    }
  };

  const handleReferenceToggle = () => {
    setShowReferencePreview(!showReferencePreview);
  };

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.headerBack}
        onClick={handleBack}
        aria-label={zhTW.game.back}
      >
        ←
      </button>
      <span className={styles.headerTitle}>{session.imageId}</span>
      <div className={styles.headerStats}>
        <span className={styles.headerStat}>⏱ <TimerDisplay isRunning={isPlaying} elapsedMs={session.elapsedMs} lastStartedPerfNow={lastStartedPerfNow} /></span>
        <span className={styles.headerStat}>
          {lockedCount}/{totalPieces}
        </span>
        <span className={styles.headerStat}>
          {zhTW.game.moves}：{session.moves}
        </span>
      </div>
      <button
        type="button"
        className={`${styles.referenceButton} ${showReferencePreview ? styles.referenceButtonActive : ''}`}
        onClick={handleReferenceToggle}
        aria-pressed={showReferencePreview}
        aria-label={showReferencePreview ? '隱藏原圖' : '顯示原圖'}
      >
        原圖
      </button>
      <button
        type="button"
        className={styles.hintButton}
        onClick={handleHint}
        disabled={!isPlaying}
        aria-label={`${zhTW.game.hint} (${zhTW.game.hintsUsed}：${session.hintsUsed})`}
      >
        💡 {zhTW.game.hint}
      </button>
      <button
        type="button"
        className={styles.pauseButton}
        onClick={handlePause}
        aria-label={zhTW.game.pause}
      >
        ⏸
      </button>
    </header>
  );
}
