import { useEffect, useRef } from 'react';

interface TimerDisplayProps {
  isRunning: boolean;
  elapsedMs: number;
  lastStartedPerfNow: number | null;
}

export function TimerDisplay({ isRunning, elapsedMs, lastStartedPerfNow }: TimerDisplayProps) {
  const rafRef = useRef<number>(0);
  const spanRef = useRef<HTMLTimeElement>(null);
  const latestPropsRef = useRef({ elapsedMs, lastStartedPerfNow, isRunning });

  useEffect(() => {
    latestPropsRef.current = { elapsedMs, lastStartedPerfNow, isRunning };
  });

  useEffect(() => {
    const tick = () => {
      const el = spanRef.current;
      if (el) {
        const { elapsedMs: eMs, lastStartedPerfNow: lpn, isRunning: running } = latestPropsRef.current;
        const current = running && lpn !== null
          ? eMs + (performance.now() - lpn)
          : eMs;
        const totalSeconds = Math.floor(current / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        el.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        el.setAttribute('aria-label', `${minutes}分${seconds}秒`);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <time ref={spanRef} role="timer" aria-label="0分0秒">
      00:00
    </time>
  );
}
