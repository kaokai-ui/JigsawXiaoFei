import { Dialog } from '../../components/Dialog';
import { useGameStore } from '../../stores/gameStore';
import { useNavigate } from 'react-router-dom';
import zhTW from '../../i18n/zh-TW';
import styles from './PauseDialog.module.css';

interface PauseDialogProps {
  open: boolean;
  onClose: () => void;
}

export function PauseDialog({ open, onClose }: PauseDialogProps) {
  const navigate = useNavigate();
  const resume = useGameStore((s) => s.resume);
  const resetWithSameOptions = useGameStore((s) => s.resetWithSameOptions);
  const abandon = useGameStore((s) => s.abandon);

  const handleResume = () => {
    resume();
    onClose();
  };

  const handleRestart = () => {
    resetWithSameOptions();
    onClose();
  };

  const handleQuit = () => {
    abandon();
    onClose();
    navigate('/');
  };

  return (
    <Dialog open={open} onClose={handleResume} title={zhTW.pause.title}>
      <div className={styles.dialogActions}>
        <button type="button" className={`${styles.dialogButton} ${styles.primary}`} onClick={handleResume}>
          {zhTW.pause.resume}
        </button>
        <button type="button" className={`${styles.dialogButton} ${styles.secondary}`} onClick={handleRestart}>
          {zhTW.pause.restart}
        </button>
        <button type="button" className={`${styles.dialogButton} ${styles.danger}`} onClick={handleQuit}>
          {zhTW.pause.quit}
        </button>
      </div>
    </Dialog>
  );
}
