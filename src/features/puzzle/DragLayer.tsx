import { createPortal } from 'react-dom';
import { useDragStore } from '../../stores/dragStore';
import { useGameStore } from '../../stores/gameStore';
import { useUiStore } from '../../stores/uiStore';
import type { PieceId } from '../../domain/puzzle/types';
import { getPieceDimensions } from '../../domain/puzzle/geometry';
import { imageManifest } from '../../generated/imageManifest';
import { PieceBitmapImage } from './PieceBitmapImage';
import styles from './DragLayer.module.css';

export function DragLayer() {
  const activeDrag = useDragStore((s) => s.activeDrag);
  const session = useGameStore((s) => s.session);
  const pieceBitmapAssets = useGameStore((s) => s.pieceBitmapAssets);
  const boardRect = useUiStore((s) => s.boardRect);

  if (!activeDrag || !session) return null;

  const piece = session.pieces[activeDrag.pieceId as PieceId];
  if (!piece || piece.status !== 'dragging') return null;
  const assetSrc = pieceBitmapAssets?.[piece.id]?.src;
  if (!assetSrc) return null;

  const img = imageManifest.find((m) => m.id === session.imageId);
  if (!img) return null;

  const grid = session.grid;
  const boardCellWidth = boardRect ? boardRect.width / grid.cols : 60;
  const { viewportWidth, viewportHeight } = getPieceDimensions(img.aspectRatio, grid, boardCellWidth);
  const x = activeDrag.point.x - viewportWidth / 2;
  const y = activeDrag.point.y - viewportHeight / 2;

  return createPortal(
    <div className={styles.dragLayer}>
      <div
        className={styles.dragPiece}
        style={{
          width: viewportWidth,
          height: viewportHeight,
          transform: `translate(${x}px, ${y}px)`,
        }}
      >
        <PieceBitmapImage
          assetSrc={assetSrc}
          imageAspectRatio={img.aspectRatio}
          grid={grid}
          className={styles.dragPieceSvg}
        />
      </div>
    </div>,
    document.body,
  );
}
