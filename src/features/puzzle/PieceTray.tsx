import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useUiStore } from '../../stores/uiStore';
import type { Piece, PieceId, GridSpec } from '../../domain/puzzle/types';
import { getPieceDimensions } from '../../domain/puzzle/geometry';
import { PuzzlePiece } from './PuzzlePiece';
import zhTW from '../../i18n/zh-TW';
import styles from './PieceTray.module.css';

interface PieceTrayProps {
  grid: GridSpec;
  imageAspectRatio: number;
  onPointerDown: (e: React.PointerEvent, pieceId: PieceId) => void;
  onPieceClick: (pieceId: PieceId) => void;
}

export function calculateTrayPieceWidth(
  trayWidth: number,
  trayHeight: number,
  pieceAspectRatio: number,
  totalPieceCount: number,
) {
  if (!trayWidth || !trayHeight || totalPieceCount === 0) return null;

  const gap = 12;
  for (let columns = 1; columns <= totalPieceCount; columns += 1) {
    const pieceWidth = (trayWidth - gap * (columns - 1)) / columns;
    if (pieceWidth <= 0) continue;

    const pieceHeight = pieceWidth / pieceAspectRatio;
    const rows = Math.ceil(totalPieceCount / columns);
    const requiredHeight = rows * pieceHeight + gap * (rows - 1);

    if (requiredHeight <= trayHeight) {
      return pieceWidth;
    }
  }

  return Math.max(48, (trayWidth - gap * (totalPieceCount - 1)) / totalPieceCount);
}

export function PieceTray({ grid, imageAspectRatio, onPointerDown, onPieceClick }: PieceTrayProps) {
  const pieces = useGameStore((s) => s.session?.pieces);
  const pieceBitmapAssets = useGameStore((s) => s.pieceBitmapAssets);
  const selectedPieceId = useUiStore((s) => s.selectedPieceId);
  const trayRef = useRef<HTMLDivElement>(null);
  const [traySize, setTraySize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const trayEl = trayRef.current;
    if (!trayEl) return;

    const updateSize = () => {
      setTraySize({
        width: trayEl.clientWidth,
        height: trayEl.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(trayEl);
    return () => observer.disconnect();
  }, []);

  const trayPieces = pieces
    ? Object.values(pieces)
        .filter((p): p is Piece => p.status === 'tray')
        .sort((a, b) => (a.trayOrder ?? 0) - (b.trayOrder ?? 0))
    : [];
  const totalPieceCount = pieces ? Object.keys(pieces).length : 0;

  const trayPieceWidth = useMemo(() => {
    const { width: trayWidth, height: trayHeight } = traySize;
    if (!trayWidth || !trayHeight || totalPieceCount === 0) return null;

    const { viewportWidth, viewportHeight } = getPieceDimensions(imageAspectRatio, grid);
    const pieceAspectRatio = viewportWidth / viewportHeight;
    return calculateTrayPieceWidth(trayWidth, trayHeight, pieceAspectRatio, totalPieceCount);
  }, [grid, imageAspectRatio, totalPieceCount, traySize]);

  if (!pieces) return null;

  return (
    <div ref={trayRef} className={styles.tray} role="region" aria-label={zhTW.a11y.trayLabel}>
      <span className={styles.trayLabel}>{zhTW.a11y.trayLabel}</span>
      <div className={styles.pieceGrid}>
        {trayPieces.map((piece) => (
          <div
            key={piece.id}
            className={styles.trayPiece}
            style={trayPieceWidth ? { width: `${trayPieceWidth}px` } : undefined}
          >
            <PuzzlePiece
              piece={piece}
              grid={grid}
              imageAspectRatio={imageAspectRatio}
              pieceAssetSrc={pieceBitmapAssets?.[piece.id]?.src ?? null}
              isTrayPiece={true}
              isSelected={selectedPieceId === piece.id}
              onPointerDown={onPointerDown}
              onClick={onPieceClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
