import { useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useUiStore } from '../../stores/uiStore';
import zhTW from '../../i18n/zh-TW';

export function AccessibilityLiveRegion() {
  const phaseRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const prevPhase = useRef<string>('');

  const session = useGameStore((s) => s.session);
  const hintCellIndex = useUiStore((s) => s.hintCellIndex);

  useEffect(() => {
    if (!session) return;
    const previousPhase = prevPhase.current;
    if (session.phase === previousPhase) return;

    let message = '';
    if (session.phase === 'paused') {
      message = zhTW.a11y.gamePaused;
    } else if (session.phase === 'playing' && previousPhase === 'paused') {
      message = zhTW.a11y.gameResumed;
    } else if (session.phase === 'completed') {
      message = zhTW.a11y.gameCompleted;
    }

    prevPhase.current = session.phase;

    if (message && phaseRef.current) {
      phaseRef.current.textContent = message;
    }
  }, [session, session?.phase]);

  useEffect(() => {
    if (hintCellIndex === null) return;
    if (hintRef.current) {
      hintRef.current.textContent = zhTW.a11y.hintShown;
    }
  }, [hintCellIndex]);

  return (
    <>
      <div
        ref={phaseRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />
      <div
        ref={hintRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />
    </>
  );
}
