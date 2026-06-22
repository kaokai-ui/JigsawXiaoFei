import type { GridCell, GridSpec } from './types';

// Keep rasterized piece tabs comfortably inside the bitmap viewport so
// protrusions do not get clipped at the canvas edge on completed boards.
const TAB_BLEED_RATIO = 0.4;

export function getBoardAspectRatio(imageAspectRatio: number): number {
  return imageAspectRatio;
}

export function getPieceAspectRatio(imageAspectRatio: number, grid: GridSpec): number {
  return imageAspectRatio * grid.rows / grid.cols;
}

export interface PieceDimensions {
  baseWidth: number;
  baseHeight: number;
  tabBleed: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface BoardCellPlacement {
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export function getPieceDimensionsFromBaseSize(baseWidth: number, baseHeight: number): PieceDimensions {
  const tabBleed = Math.min(baseWidth, baseHeight) * TAB_BLEED_RATIO;
  return {
    baseWidth,
    baseHeight,
    tabBleed,
    viewportWidth: baseWidth + tabBleed * 2,
    viewportHeight: baseHeight + tabBleed * 2,
  };
}

/** Shared geometry for tray pieces, drag previews, placed pieces, bitmap rendering, and board slots. */
export function getPieceDimensions(
  imageAspectRatio: number,
  grid: GridSpec,
  baseWidth = 100,
): PieceDimensions {
  const baseHeight = baseWidth / getPieceAspectRatio(imageAspectRatio, grid);
  return getPieceDimensionsFromBaseSize(baseWidth, baseHeight);
}

export function getSourcePieceDimensions(
  imageWidth: number,
  imageHeight: number,
  grid: GridSpec,
): PieceDimensions {
  return getPieceDimensionsFromBaseSize(imageWidth / grid.cols, imageHeight / grid.rows);
}

export function getBoardCellPlacement(dimensions: PieceDimensions): BoardCellPlacement {
  const { baseWidth, baseHeight, tabBleed, viewportWidth, viewportHeight } = dimensions;
  return {
    leftPercent: (-tabBleed / baseWidth) * 100,
    topPercent: (-tabBleed / baseHeight) * 100,
    widthPercent: (viewportWidth / baseWidth) * 100,
    heightPercent: (viewportHeight / baseHeight) * 100,
  };
}

export function getSvgImagePlacement(
  source: GridCell,
  grid: GridSpec,
  unitW: number,
  unitH: number,
  offsetX = 0,
  offsetY = 0,
): { imgX: number; imgY: number; imgW: number; imgH: number } {
  return {
    imgX: offsetX - source.col * unitW,
    imgY: offsetY - source.row * unitH,
    imgW: grid.cols * unitW,
    imgH: grid.rows * unitH,
  };
}

export function getSvgBoardDimensions(
  imageAspectRatio: number,
  grid: GridSpec,
  cellWidth = 100,
): { width: number; height: number; cellWidth: number; cellHeight: number } {
  const { baseWidth, baseHeight } = getPieceDimensions(imageAspectRatio, grid, cellWidth);
  return {
    width: grid.cols * baseWidth,
    height: grid.rows * baseHeight,
    cellWidth: baseWidth,
    cellHeight: baseHeight,
  };
}
