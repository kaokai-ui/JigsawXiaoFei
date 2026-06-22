import type { Piece, PieceId, GridSpec } from '../../domain/puzzle/types';
import { getPieceDimensions } from '../../domain/puzzle/geometry';
import { PieceBitmapImage } from './PieceBitmapImage';
import styles from './PuzzlePiece.module.css';

interface PuzzlePieceProps {
  piece: Piece;
  grid: GridSpec;
  imageAspectRatio: number;
  pieceAssetSrc: string | null;
  isTrayPiece: boolean;
  isSelected: boolean;
  onPointerDown: (e: React.PointerEvent, pieceId: PieceId) => void;
  onClick: (pieceId: PieceId) => void;
}

export function PuzzlePiece({
  piece,
  grid,
  imageAspectRatio,
  pieceAssetSrc,
  isTrayPiece,
  isSelected,
  onPointerDown,
  onClick,
}: PuzzlePieceProps) {
  const { viewportWidth, viewportHeight } = getPieceDimensions(imageAspectRatio, grid);

  let className = styles.piece;
  if (isTrayPiece && piece.status === 'dragging') {
    className += ` ${styles.draggingPiece}`;
  }
  if (isSelected) {
    className += ` ${styles.selectedPiece}`;
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isTrayPiece && piece.status === 'tray') {
      e.preventDefault();
      onPointerDown(e, piece.id);
    }
  };

  const handleClick = () => {
    if (isTrayPiece && piece.status === 'tray') {
      onClick(piece.id);
    }
  };

  return (
    <div
      className={className}
      style={{ aspectRatio: `${viewportWidth} / ${viewportHeight}` }}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
      aria-grabbed={piece.status === 'dragging' || isSelected}
      aria-label={`拼圖塊 ${piece.source.index + 1}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {pieceAssetSrc && (
        <PieceBitmapImage
          assetSrc={pieceAssetSrc}
          imageAspectRatio={imageAspectRatio}
          grid={grid}
          className={styles.pieceSvg}
        />
      )}
    </div>
  );
}
