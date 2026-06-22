import { useMemo } from 'react';
import type { GridSpec, PieceShape } from '../../domain/puzzle/types';
import { getPiecePath } from '../../domain/puzzle/shapes';
import { getSvgBoardDimensions } from '../../domain/puzzle/geometry';

interface BoardOverlayLinesProps {
  grid: GridSpec;
  shapes: Record<number, PieceShape>;
  imageAspectRatio: number;
  className?: string;
}

export function BoardOverlayLines({ grid, shapes, imageAspectRatio, className }: BoardOverlayLinesProps) {
  const { width, height, cellWidth, cellHeight } = useMemo(
    () => getSvgBoardDimensions(imageAspectRatio, grid),
    [imageAspectRatio, grid],
  );
  const pieces = useMemo(() => {
    const result: { key: string; d: string }[] = [];
    for (let row = 0; row < grid.rows; row += 1) {
      for (let col = 0; col < grid.cols; col += 1) {
        const index = row * grid.cols + col;
        if (index >= grid.activeCells || !shapes[index]) continue;
        result.push({
          key: `piece-${index}`,
          d: getPiecePath(shapes[index], cellWidth, cellHeight, col * cellWidth, row * cellHeight),
        });
      }
    }
    return result;
  }, [grid, shapes, cellWidth, cellHeight]);

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {pieces.map((piece) => (
        <path
          key={piece.key}
          d={piece.d}
          fill="none"
          stroke="rgba(19, 25, 38, 0.58)"
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
