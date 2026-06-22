import { useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';
import { useUiStore } from '../../stores/uiStore';
import { loadActiveSession, clearActiveSession } from '../../services/storage';
import { imageManifest } from '../../generated/imageManifest';
import type { PieceBitmapAssetMap, PieceId } from '../../domain/puzzle/types';
import { GameHeader } from './GameHeader';
import { PuzzleBoard } from './PuzzleBoard';
import { PieceTray } from './PieceTray';
import { PauseDialog } from './PauseDialog';
import { CompletionDialog } from './CompletionDialog';
import { AccessibilityLiveRegion } from './AccessibilityLiveRegion';
import {
  usePuzzleGame,
  usePointerDrag,
  useKeyboardPlacement,
  useAutoPause,
  useImagePreload,
  useHintAutoClear,
} from './hooks';
import { usePieceBitmapAssets } from './pieceBitmapAssets';
import zhTW from '../../i18n/zh-TW';
import styles from './GamePage.module.css';

export function GamePage() {
  const navigate = useNavigate();
  const { session, isPaused, isCompleted } = usePuzzleGame();
  const restoreGame = useGameStore((s) => s.restoreGame);
  const selectPiece = useGameStore((s) => s.selectPiece);
  const pieceBitmapStatus = useGameStore((s) => s.pieceBitmapStatus);
  const setPieceBitmapState = useGameStore((s) => s.setPieceBitmapState);
  const {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
  } = usePointerDrag();

  useKeyboardPlacement();
  useAutoPause();
  useHintAutoClear();

  useEffect(() => {
    if (session) return;

    const storeSession = useGameStore.getState().session;
    if (storeSession) return;

    const saved = loadActiveSession();
    if (saved) {
      const result = restoreGame(saved);
      if (result.ok) return;
      clearActiveSession();
    }

    navigate('/');
  }, [session, restoreGame, navigate]);

  const imageMeta = useMemo(() => {
    if (!session) return null;
    const img = imageManifest.find((m) => m.id === session.imageId);
    return img
      ? { src: img.src, width: img.width, height: img.height, aspectRatio: img.aspectRatio }
      : null;
  }, [session]);

  const imageSrc = imageMeta?.src ?? '';

  const imageLoadState = useImagePreload(imageSrc);
  const handlePieceBitmapState = useCallback(
    ({ status, assets }: { status: 'idle' | 'loading' | 'ready' | 'error'; assets: PieceBitmapAssetMap | null }) => {
      setPieceBitmapState(status, assets);
    },
    [setPieceBitmapState],
  );
  usePieceBitmapAssets(
    imageLoadState === 'loaded' ? session : null,
    imageLoadState === 'loaded' ? imageMeta : null,
    handlePieceBitmapState,
  );

  const handlePieceClick = useCallback(
    (pieceId: PieceId) => {
      const currentSelected = useUiStore.getState().selectedPieceId;
      if (currentSelected === pieceId) {
        selectPiece(null);
      } else {
        selectPiece(pieceId);
      }
    },
    [selectPiece],
  );

  if (!session) {
    return (
      <div className={styles.gamePage}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
        </div>
      </div>
    );
  }

  if (imageLoadState === 'loading') {
    return (
      <div className={styles.gamePage}>
        <GameHeader />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <p>{zhTW.gallery.loading}</p>
        </div>
        <AccessibilityLiveRegion />
      </div>
    );
  }

  if (imageLoadState === 'error') {
    return (
      <div className={styles.gamePage}>
        <GameHeader />
        <div className={styles.loadingContainer}>
          <p className={styles.loadingError}>{zhTW.gallery.loadError}</p>
          <button type="button" onClick={() => navigate('/')}>
            {zhTW.game.back}
          </button>
        </div>
      </div>
    );
  }

  if (pieceBitmapStatus === 'error') {
    return (
      <div className={styles.gamePage}>
        <GameHeader />
        <div className={styles.loadingContainer}>
          <p className={styles.loadingError}>{zhTW.gallery.loadError}</p>
          <button type="button" onClick={() => navigate('/')}>
            {zhTW.game.back}
          </button>
        </div>
      </div>
    );
  }

  if (pieceBitmapStatus !== 'ready') {
    return (
      <div className={styles.gamePage}>
        <GameHeader />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <p>{zhTW.gallery.loading}</p>
        </div>
        <AccessibilityLiveRegion />
      </div>
    );
  }

  return (
    <div
      className={styles.gamePage}
      data-drag-host
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onLostPointerCapture}
    >
      <GameHeader />
      <div className={styles.workspace}>
        <PuzzleBoard />
        <PieceTray
          grid={session.grid}
          imageAspectRatio={imageMeta?.aspectRatio ?? 1}
          onPointerDown={onPointerDown}
          onPieceClick={handlePieceClick}
        />
      </div>
      <AccessibilityLiveRegion />
      {isPaused && <PauseDialog open={isPaused} onClose={() => {}} />}
      {isCompleted && <CompletionDialog open={isCompleted} />}
    </div>
  );
}
