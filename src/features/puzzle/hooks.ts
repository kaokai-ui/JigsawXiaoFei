import { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useDragStore } from '../../stores/dragStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';
import type { PieceId } from '../../domain/puzzle/types';

export function usePuzzleGame() {
  const session = useGameStore((s) => s.session);
  const selectedPieceId = useUiStore((s) => s.selectedPieceId);
  const hintCellIndex = useUiStore((s) => s.hintCellIndex);

  const isPlaying = session?.phase === 'playing';
  const isPaused = session?.phase === 'paused';
  const isCompleted = session?.phase === 'completed';
  const lockedCount = session
    ? Object.values(session.pieces).filter((p) => p.status === 'locked').length
    : 0;

  return {
    session,
    selectedPieceId,
    hintCellIndex,
    isPlaying,
    isPaused,
    isCompleted,
    lockedCount,
    totalPieces: session?.pieceCount ?? 0,
  };
}

export function usePointerDrag() {
  const beginDrag = useGameStore((s) => s.beginDrag);
  const updateDrag = useGameStore((s) => s.updateDrag);
  const endDrag = useGameStore((s) => s.endDrag);
  const cancelDrag = useGameStore((s) => s.cancelDrag);
  const pendingDragRef = useRef<{ pieceId: PieceId; pointerId: number; start: { x: number; y: number } } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, pieceId: PieceId) => {
      if (e.button !== 0) return;
      const dragHost = e.currentTarget.closest('[data-drag-host]') as HTMLElement | null;
      const captureTarget = dragHost ?? e.currentTarget;
      captureTarget.setPointerCapture(e.pointerId);
      pendingDragRef.current = {
        pieceId,
        pointerId: e.pointerId,
        start: { x: e.clientX, y: e.clientY },
      };
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const activeDrag = useDragStore.getState().activeDrag;
      if (!activeDrag) {
        const pending = pendingDragRef.current;
        if (!pending || e.pointerId !== pending.pointerId) return;
        const dx = e.clientX - pending.start.x;
        const dy = e.clientY - pending.start.y;
        if (Math.hypot(dx, dy) < 6) return;
        beginDrag(pending.pieceId, pending.pointerId, pending.start);
        pendingDragRef.current = null;
        updateDrag({ x: e.clientX, y: e.clientY });
        return;
      }
      if (e.pointerId !== activeDrag.pointerId) return;
      updateDrag({ x: e.clientX, y: e.clientY });
    },
    [beginDrag, updateDrag],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const activeDrag = useDragStore.getState().activeDrag;
      if (!activeDrag) {
        if (pendingDragRef.current?.pointerId === e.pointerId) {
          pendingDragRef.current = null;
        }
        return;
      }
      if (e.pointerId !== activeDrag.pointerId) return;
      endDrag({ x: e.clientX, y: e.clientY });
    },
    [endDrag],
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      const activeDrag = useDragStore.getState().activeDrag;
      if (!activeDrag) {
        if (pendingDragRef.current?.pointerId === e.pointerId) {
          pendingDragRef.current = null;
        }
        return;
      }
      if (e.pointerId !== activeDrag.pointerId) return;
      cancelDrag();
    },
    [cancelDrag],
  );

  const handleLostPointerCapture = useCallback(
    (e: React.PointerEvent) => {
      const activeDrag = useDragStore.getState().activeDrag;
      if (!activeDrag) {
        if (pendingDragRef.current?.pointerId === e.pointerId) {
          pendingDragRef.current = null;
        }
        return;
      }
      if (e.pointerId !== activeDrag.pointerId) return;
      cancelDrag();
    },
    [cancelDrag],
  );

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onLostPointerCapture: handleLostPointerCapture,
  };
}

export function useKeyboardPlacement() {
  const selectPiece = useGameStore((s) => s.selectPiece);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        selectPiece(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectPiece]);
}

export function useAutoPause() {
  const pause = useGameStore((s) => s.pause);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const session = useGameStore.getState().session;
        if (session?.phase === 'playing') {
          pause();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pause]);
}

export function useReducedMotion() {
  const override = useSettingsStore((s) => s.reducedMotionOverride);
  const [systemPrefersReduced, setSystemPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (override === 'reduce') return true;
  if (override === 'full') return false;
  return systemPrefersReduced;
}

export function useHintAutoClear() {
  const hintCellIndex = useUiStore((s) => s.hintCellIndex);
  const clearHint = useGameStore((s) => s.clearHint);

  useEffect(() => {
    if (hintCellIndex === null) return;

    const timeout = setTimeout(() => {
      clearHint();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [hintCellIndex, clearHint]);
}

export function useImagePreload(src: string) {
  const [result, setResult] = useState<{ src: string; state: 'loading' | 'loaded' | 'error' }>({
    src,
    state: 'loading',
  });

  const currentState = result.src === src ? result.state : 'loading';

  useEffect(() => {
    let cancelled = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      if (img.decode) {
        img.decode().then(
          () => { if (!cancelled) setResult({ src, state: 'loaded' }); },
          () => { if (!cancelled) setResult({ src, state: 'loaded' }); },
        );
      } else {
        if (!cancelled) setResult({ src, state: 'loaded' });
      }
    };
    img.onerror = () => {
      if (!cancelled) setResult({ src, state: 'error' });
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return currentState;
}
