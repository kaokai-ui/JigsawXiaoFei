import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useDragStore } from '../../stores/dragStore';
import { useUiStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { PieceId, GridCell, PieceShape } from '../../domain/puzzle/types';
import { createTargetCells } from '../../domain/puzzle/grid';
import { getBoardAspectRatio } from '../../domain/puzzle/geometry';
import { BoardCell } from './BoardCell';
import { BoardPlateSvg } from './BoardPlateSvg';
import { BoardOverlayLines } from './BoardOverlayLines';
import { imageManifest } from '../../generated/imageManifest';
import zhTW from '../../i18n/zh-TW';
import styles from './PuzzleBoard.module.css';

export function PuzzleBoard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const session = useGameStore((s) => s.session);
  const pieceBitmapAssets = useGameStore((s) => s.pieceBitmapAssets);
  const activeDrag = useDragStore((s) => s.activeDrag);
  const setBoardRect = useUiStore((s) => s.setBoardRect);
  const selectedPieceId = useUiStore((s) => s.selectedPieceId);
  const hintCellIndex = useUiStore((s) => s.hintCellIndex);
  const showReferencePreview = useUiStore((s) => s.showReferencePreview);
  const showReferenceOverlay = useSettingsStore((s) => s.showReferenceOverlay);
  const tryPlaceSelected = useGameStore((s) => s.tryPlaceSelected);
  const [boardSize, setBoardSize] = useState<{ width: number; height: number } | null>(null);

  const lockedPieceMap = useMemo(() => {
    if (!session) return new Map<number, { pieceId: PieceId; source: GridCell; shape: PieceShape }>();
    const map = new Map<number, { pieceId: PieceId; source: GridCell; shape: PieceShape }>();
    for (const piece of Object.values(session.pieces)) {
      if (piece.status === 'locked' && piece.placedCellIndex !== null) {
        map.set(piece.placedCellIndex, { pieceId: piece.id, source: piece.source, shape: piece.shape });
      }
    }
    return map;
  }, [session]);

  const shapesIndex = useMemo(() => {
    if (!session) return {} as Record<number, PieceShape>;
    const result: Record<number, PieceShape> = {};
    for (const piece of Object.values(session.pieces)) {
      result[piece.source.index] = piece.shape;
    }
    return result;
  }, [session]);

  const guidedPiece = useMemo(() => {
    if (!session) return null;

    const focusPieceId = activeDrag?.pieceId ?? selectedPieceId;
    if (!focusPieceId) return null;

    const piece = session.pieces[focusPieceId];
    if (!piece || piece.status === 'locked') return null;
    return piece;
  }, [activeDrag?.pieceId, selectedPieceId, session]);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const updateBoardRect = (boardEl: HTMLElement) => {
      const clientRect = boardEl.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(boardEl);
      const borderLeft = Number.parseFloat(computedStyle.borderLeftWidth) || 0;
      const borderTop = Number.parseFloat(computedStyle.borderTopWidth) || 0;
      setBoardRect({
        x: clientRect.x + borderLeft,
        y: clientRect.y + borderTop,
        width: boardEl.clientWidth,
        height: boardEl.clientHeight,
      });
    };
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateBoardRect(entry.target as HTMLElement);
      }
    });

    updateBoardRect(el);
    observer.observe(el);
    return () => observer.disconnect();
  }, [setBoardRect]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const img = session ? imageManifest.find((m) => m.id === session.imageId) : null;
    const imageAspectRatio = img?.aspectRatio ?? 1;
    const boardAspectRatio = getBoardAspectRatio(imageAspectRatio);

    const updateSize = () => {
      const availWidth = wrapper.clientWidth;
      const availHeight = wrapper.clientHeight;

      const widthFromHeight = availHeight * boardAspectRatio;
      const heightFromWidth = availWidth / boardAspectRatio;

      if (heightFromWidth <= availHeight) {
        setBoardSize({ width: availWidth, height: heightFromWidth });
      } else {
        setBoardSize({ width: widthFromHeight, height: availHeight });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [session]);

  const handleCellClick = useCallback(
    (cellIndex: number) => {
      if (selectedPieceId) {
        tryPlaceSelected(cellIndex);
      }
    },
    [selectedPieceId, tryPlaceSelected],
  );

  if (!session) return null;

  const img = imageManifest.find((m) => m.id === session.imageId);
  const imageAspectRatio = img?.aspectRatio ?? 1;
  const boardGhostPiece = showReferenceOverlay ? guidedPiece : null;
  const grid = session.grid;
  const targetCells = createTargetCells(grid);

  return (
    <div className={styles.boardContainer}>
      {img && showReferencePreview && (
        <aside className={styles.referencePanel} aria-label={`${session.imageId} reference preview`}>
          <img
            src={img.src}
            alt=""
            className={styles.referenceImage}
            draggable={false}
            aria-hidden="true"
            onContextMenu={(e) => e.preventDefault()}
          />
        </aside>
      )}
      <div ref={wrapperRef} className={styles.boardWrapper}>
        <div
          ref={boardRef}
          className={styles.board}
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
            gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
            width: boardSize ? `${boardSize.width}px` : '100%',
            height: boardSize ? `${boardSize.height}px` : undefined,
            aspectRatio: boardSize ? undefined : `${imageAspectRatio}`,
          }}
          role="grid"
          aria-label={zhTW.a11y.boardLabel}
        >
          <BoardPlateSvg
            grid={grid}
            shapes={shapesIndex}
            imageAspectRatio={imageAspectRatio}
            className={styles.boardPlate}
          />
          {Array.from({ length: grid.rows * grid.cols }, (_, idx) => {
            const row = Math.floor(idx / grid.cols);
            const col = idx % grid.cols;
            const cell: GridCell = { row, col, index: idx };
            const isActive = idx < grid.activeCells;
            const locked = lockedPieceMap.get(idx);
            const targetCell = targetCells.find((tc) => tc.index === idx);

            return (
              <BoardCell
                key={idx}
                cell={targetCell ?? cell}
                isActive={isActive}
                lockedPieceSource={locked?.source ?? null}
                lockedPieceId={locked?.pieceId ?? null}
                lockedPieceShape={locked?.shape ?? null}
                lockedPieceAssetSrc={locked?.pieceId ? pieceBitmapAssets?.[locked.pieceId]?.src ?? null : null}
                ghostPieceSource={boardGhostPiece?.source.index === idx ? boardGhostPiece.source : null}
                ghostPieceShape={boardGhostPiece?.source.index === idx ? boardGhostPiece.shape : null}
                ghostPieceAssetSrc={boardGhostPiece?.source.index === idx ? pieceBitmapAssets?.[boardGhostPiece.id]?.src ?? null : null}
                isHintTarget={hintCellIndex === idx}
                isTargetForSelected={guidedPiece?.source.index === idx && isActive && !locked}
                grid={grid}
                imageAspectRatio={imageAspectRatio}
                onCellClick={handleCellClick}
              />
            );
          })}
          <BoardOverlayLines grid={grid} shapes={shapesIndex} imageAspectRatio={imageAspectRatio} className={styles.puzzleLines} />
        </div>
      </div>
    </div>
  );
}
