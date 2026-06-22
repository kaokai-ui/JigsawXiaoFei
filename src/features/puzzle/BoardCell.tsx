import type { GridCell, GridSpec, PieceId, PieceShape } from '../../domain/puzzle/types';
import { PieceBitmapImage } from './PieceBitmapImage';
import styles from './BoardCell.module.css';

interface BoardCellProps {
  cell: GridCell;
  isActive: boolean;
  lockedPieceSource: GridCell | null;
  lockedPieceId: PieceId | null;
  lockedPieceShape: PieceShape | null;
  lockedPieceAssetSrc: string | null;
  ghostPieceSource: GridCell | null;
  ghostPieceShape: PieceShape | null;
  ghostPieceAssetSrc: string | null;
  isHintTarget: boolean;
  isTargetForSelected: boolean;
  grid: GridSpec;
  imageAspectRatio: number;
  onCellClick: (cellIndex: number) => void;
}

export function BoardCell({
  cell,
  isActive,
  lockedPieceSource,
  lockedPieceId,
  lockedPieceShape,
  lockedPieceAssetSrc,
  ghostPieceSource,
  ghostPieceShape,
  ghostPieceAssetSrc,
  isHintTarget,
  isTargetForSelected,
  grid,
  imageAspectRatio,
  onCellClick,
}: BoardCellProps) {
  if (!isActive) {
    return <div className={`${styles.cell} ${styles.inactive}`} />;
  }

  const isLocked = lockedPieceId !== null && lockedPieceSource !== null && lockedPieceShape !== null;
  const showGhost = !isLocked && ghostPieceSource !== null && ghostPieceShape !== null;

  let className = styles.cell;
  if (isLocked) {
    className += ` ${styles.locked}`;
  } else {
    className += ` ${styles.empty}`;
  }
  if (isHintTarget && !isLocked) {
    className += ` ${styles.hintHighlight}`;
  }
  if (isTargetForSelected && !isLocked) {
    className += ` ${styles.selectedHighlight}`;
  }

  const handleClick = () => {
    onCellClick(cell.index);
  };

  return (
    <div
      className={className}
      onClick={handleClick}
      data-cell-index={cell.index}
      data-locked-piece={lockedPieceId ?? undefined}
      role={isLocked ? 'img' : 'button'}
      aria-label={
        isLocked
          ? `已放置的拼圖塊 ${lockedPieceId}`
          : `空的格子 第${cell.row + 1}行 第${cell.col + 1}列`
      }
      tabIndex={isLocked ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {isLocked && lockedPieceSource && lockedPieceShape && lockedPieceAssetSrc && (
        <PieceBitmapImage
          assetSrc={lockedPieceAssetSrc}
          imageAspectRatio={imageAspectRatio}
          grid={grid}
          className={styles.lockedSvg}
          placement="board-cell"
        />
      )}
      {showGhost && ghostPieceSource && ghostPieceShape && ghostPieceAssetSrc && (
        <div className={styles.ghostPiece}>
          <PieceBitmapImage
            assetSrc={ghostPieceAssetSrc}
            imageAspectRatio={imageAspectRatio}
            grid={grid}
            className={styles.ghostSvg}
            placement="board-cell"
          />
        </div>
      )}
    </div>
  );
}
