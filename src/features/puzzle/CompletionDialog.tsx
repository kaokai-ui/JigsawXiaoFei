import { Dialog } from '../../components/Dialog';
import { useGameStore } from '../../stores/gameStore';
import { useNavigate } from 'react-router-dom';
import { calculateScore } from '../../domain/scoring/calculateScore';
import { useRecordsStore } from '../../stores/recordsStore';
import zhTW from '../../i18n/zh-TW';
import styles from './CompletionDialog.module.css';

interface CompletionDialogProps {
  open: boolean;
}

export function CompletionDialog({ open }: CompletionDialogProps) {
  const navigate = useNavigate();
  const session = useGameStore((s) => s.session);
  const resetWithSameOptions = useGameStore((s) => s.resetWithSameOptions);
  const abandon = useGameStore((s) => s.abandon);
  const records = useRecordsStore((s) => s.records);

  if (!session || session.phase !== 'completed') return null;

  const score = calculateScore({
    pieceCount: session.pieceCount,
    elapsedMs: session.elapsedMs,
    moves: session.moves,
    hintsUsed: session.hintsUsed,
  });

  const recordKey = `${session.imageId}:${session.difficulty}:${session.pieceCount}`;
  const bestRecord = records[recordKey];
  const isNewRecord = bestRecord != null && score >= bestRecord.score;

  const handlePlayAgain = () => {
    resetWithSameOptions();
  };

  const handleChangeImage = () => {
    abandon();
    navigate('/images');
  };

  const handleGoHome = () => {
    abandon();
    navigate('/');
  };

  return (
    <Dialog open={open} onClose={handleGoHome} title={zhTW.completion.title}>
      <div className={styles.stats}>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>{zhTW.completion.score}</span>
          <span className={styles.statValue}>
            {score}
            {isNewRecord && (
              <span className={styles.newRecord}>{zhTW.completion.newRecord}</span>
            )}
          </span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>{zhTW.completion.time}</span>
          <span className={styles.statValue}>{formatElapsed(session.elapsedMs)}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>{zhTW.completion.moves}</span>
          <span className={styles.statValue}>{session.moves}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>{zhTW.completion.hintsUsed}</span>
          <span className={styles.statValue}>{session.hintsUsed}</span>
        </div>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.primary}`}
          onClick={handlePlayAgain}
        >
          {zhTW.completion.playAgain}
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.secondary}`}
          onClick={handleChangeImage}
        >
          {zhTW.completion.changeImage}
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.secondary}`}
          onClick={handleGoHome}
        >
          {zhTW.completion.goHome}
        </button>
      </div>
    </Dialog>
  );
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
