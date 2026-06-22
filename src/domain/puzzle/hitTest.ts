import type { GridCell, GridSpec, Point } from './types';

export interface BoardRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getCellFromPoint(
  point: Point,
  boardRect: BoardRect,
  grid: GridSpec,
): GridCell | null {
  const relX = point.x - boardRect.x;
  const relY = point.y - boardRect.y;

  if (relX < 0 || relY < 0 || relX >= boardRect.width || relY >= boardRect.height) {
    return null;
  }

  const cellWidth = boardRect.width / grid.cols;
  const cellHeight = boardRect.height / grid.rows;

  const col = Math.floor(relX / cellWidth);
  const row = Math.floor(relY / cellHeight);

  const index = row * grid.cols + col;
  if (index >= grid.activeCells) {
    return null;
  }

  return { row, col, index };
}

export function getSnapCandidate(
  dragCenter: Point,
  boardRect: BoardRect,
  grid: GridSpec,
  threshold: number = 0.42,
): GridCell | null {
  const cell = getCellFromPoint(dragCenter, boardRect, grid);
  if (!cell) return null;

  const cellWidth = boardRect.width / grid.cols;
  const cellHeight = boardRect.height / grid.rows;
  const snapThreshold = Math.min(cellWidth, cellHeight) * threshold;

  const cellCenterX = boardRect.x + (cell.col + 0.5) * cellWidth;
  const cellCenterY = boardRect.y + (cell.row + 0.5) * cellHeight;

  const dx = dragCenter.x - cellCenterX;
  const dy = dragCenter.y - cellCenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > snapThreshold) return null;

  return cell;
}
