import type { GridSpec, GridCell } from './types';

function getFactorPairs(n: number): [number, number][] {
  const pairs: [number, number][] = [];
  for (let r = 1; r <= Math.sqrt(n); r++) {
    if (n % r === 0) {
      pairs.push([r, n / r]);
    }
  }
  return pairs;
}

function getAspectDistance(candidateAspectRatio: number, imageAspectRatio: number): number {
  return candidateAspectRatio >= imageAspectRatio
    ? candidateAspectRatio / imageAspectRatio
    : imageAspectRatio / candidateAspectRatio;
}

export function chooseGridSpec(pieceCount: number, aspectRatio: number): GridSpec {
  const candidateGrids = getFactorPairs(pieceCount);
  const epsilon = 1e-9;

  if (candidateGrids.length > 0) {
    let best = candidateGrids[0];
    let bestDiff = Infinity;
    for (const [rows, cols] of candidateGrids) {
      for (const [r, c] of [[rows, cols], [cols, rows]] as [number, number][]) {
        const diff = getAspectDistance(c / r, aspectRatio);
        if (diff < bestDiff - epsilon || (Math.abs(diff - bestDiff) <= epsilon && r < best[0])) {
          bestDiff = diff;
          best = [r, c];
        }
      }
    }
    return { rows: best[0], cols: best[1], activeCells: pieceCount };
  }

  const totalCells = pieceCount + 1;
  const extendedPairs = getFactorPairs(totalCells);
  let bestExtended = extendedPairs[0];
  let bestDiffExt = Infinity;
  for (const [rows, cols] of extendedPairs) {
    for (const [r, c] of [[rows, cols], [cols, rows]] as [number, number][]) {
      const diff = getAspectDistance(c / r, aspectRatio);
      if (diff < bestDiffExt - epsilon || (Math.abs(diff - bestDiffExt) <= epsilon && r < bestExtended[0])) {
        bestDiffExt = diff;
        bestExtended = [r, c];
      }
    }
  }
  return { rows: bestExtended[0], cols: bestExtended[1], activeCells: pieceCount };
}

export function createTargetCells(grid: GridSpec): GridCell[] {
  const cells: GridCell[] = [];
  let index = 0;
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      if (index < grid.activeCells) {
        cells.push({ row, col, index });
      }
      index++;
    }
  }
  return cells;
}
