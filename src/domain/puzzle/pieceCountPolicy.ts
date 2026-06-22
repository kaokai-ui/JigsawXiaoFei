import { chooseGridSpec } from './grid';

interface ImageMetaLike {
  aspectRatio: number;
  width: number;
  height: number;
}

const SQUARE_IMAGE_ASPECT_MIN = 0.9;
const SQUARE_IMAGE_ASPECT_MAX = 1.1;
const SQUARE_GRID_STRETCH_LIMIT = 1.35;
const MIN_SOURCE_CELL_SIZE = 96;

function getGridStretchScore(rows: number, cols: number, aspectRatio: number): number {
  const gridAspectRatio = cols / rows;
  return gridAspectRatio >= aspectRatio
    ? gridAspectRatio / aspectRatio
    : aspectRatio / gridAspectRatio;
}

export function isSquareLikeImage(image: Pick<ImageMetaLike, 'aspectRatio'>): boolean {
  return image.aspectRatio >= SQUARE_IMAGE_ASPECT_MIN && image.aspectRatio <= SQUARE_IMAGE_ASPECT_MAX;
}

export function getAllowedPieceCountsForImage(image: ImageMetaLike): number[] {
  if (!isSquareLikeImage(image)) {
    return [];
  }

  const allowed: number[] = [];

  for (let pieceCount = 4; pieceCount <= 100; pieceCount += 1) {
    const grid = chooseGridSpec(pieceCount, image.aspectRatio);
    if (grid.rows * grid.cols !== pieceCount) {
      continue;
    }

    const stretchScore = getGridStretchScore(grid.rows, grid.cols, image.aspectRatio);
    if (stretchScore > SQUARE_GRID_STRETCH_LIMIT) {
      continue;
    }

    const sourceCellWidth = image.width / grid.cols;
    const sourceCellHeight = image.height / grid.rows;
    if (Math.min(sourceCellWidth, sourceCellHeight) < MIN_SOURCE_CELL_SIZE) {
      continue;
    }

    allowed.push(pieceCount);
  }

  return allowed;
}

export function resolvePieceCountForImage(image: ImageMetaLike, requestedPieceCount: number): number {
  if (!isSquareLikeImage(image)) {
    return requestedPieceCount;
  }

  const allowedCounts = getAllowedPieceCountsForImage(image);
  if (allowedCounts.length === 0) {
    return requestedPieceCount;
  }

  let bestPieceCount = allowedCounts[0];
  let bestDistance = Math.abs(bestPieceCount - requestedPieceCount);

  for (const candidate of allowedCounts.slice(1)) {
    const distance = Math.abs(candidate - requestedPieceCount);
    if (distance < bestDistance || (distance === bestDistance && candidate < bestPieceCount)) {
      bestDistance = distance;
      bestPieceCount = candidate;
    }
  }

  return bestPieceCount;
}
