import { useMemo } from 'react';
import type { GridSpec, PieceShape } from '../../domain/puzzle/types';
import { getPiecePath } from '../../domain/puzzle/shapes';
import { getSvgBoardDimensions } from '../../domain/puzzle/geometry';

interface BoardPlateSvgProps {
  grid: GridSpec;
  shapes: Record<number, PieceShape>;
  imageAspectRatio: number;
  className?: string;
}

export function BoardPlateSvg({ grid, shapes, imageAspectRatio, className }: BoardPlateSvgProps) {
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
          key: `plate-${index}`,
          d: getPiecePath(shapes[index], cellWidth, cellHeight, col * cellWidth, row * cellHeight),
        });
      }
    }
    return result;
  }, [cellHeight, cellWidth, grid, shapes]);

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
          fill="rgba(255, 255, 255, 0.98)"
          stroke="rgba(116, 129, 153, 0.12)"
          strokeWidth={0.9}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
