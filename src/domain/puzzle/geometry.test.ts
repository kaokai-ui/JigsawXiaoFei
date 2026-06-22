import { describe, it, expect } from 'vitest';
import {
  getBoardAspectRatio,
  getPieceAspectRatio,
  getSvgImagePlacement,
  getPieceDimensions,
  getSvgBoardDimensions,
} from './geometry';
import type { GridCell, GridSpec } from './types';

describe('getBoardAspectRatio', () => {
  it('returns image aspect ratio directly', () => {
    expect(getBoardAspectRatio(0.6667)).toBe(0.6667);
    expect(getBoardAspectRatio(1)).toBe(1);
    expect(getBoardAspectRatio(1.7768)).toBe(1.7768);
  });
});

describe('getPieceAspectRatio', () => {
  it('portrait image (0.6667) in 5x2 grid', () => {
    const grid: GridSpec = { rows: 2, cols: 5, activeCells: 10 };
    expect(getPieceAspectRatio(0.6667, grid)).toBeCloseTo(0.6667 * 2 / 5, 4);
  });

  it('square image (1.0) in 3x3 grid', () => {
    const grid: GridSpec = { rows: 3, cols: 3, activeCells: 9 };
    expect(getPieceAspectRatio(1, grid)).toBeCloseTo(1, 4);
  });

  it('landscape image (1.7768) in 2x4 grid', () => {
    const grid: GridSpec = { rows: 2, cols: 4, activeCells: 8 };
    expect(getPieceAspectRatio(1.7768, grid)).toBeCloseTo(1.7768 * 2 / 4, 4);
  });
});

describe('getSvgImagePlacement', () => {
  it('computes top-left source in 3x2 grid', () => {
    const grid: GridSpec = { rows: 2, cols: 3, activeCells: 6 };
    const source: GridCell = { row: 0, col: 0, index: 0 };
    const result = getSvgImagePlacement(source, grid, 50, 50);
    expect(result).toEqual({ imgX: 0, imgY: 0, imgW: 150, imgH: 100 });
  });

  it('computes bottom-right source offset', () => {
    const grid: GridSpec = { rows: 2, cols: 3, activeCells: 6 };
    const source: GridCell = { row: 1, col: 2, index: 5 };
    const result = getSvgImagePlacement(source, grid, 50, 50);
    expect(result).toEqual({ imgX: -100, imgY: -50, imgW: 150, imgH: 100 });
  });
});

describe('piece SVG geometry', () => {
  it('adds a consistent bleed around a base cell', () => {
    const grid: GridSpec = { rows: 2, cols: 3, activeCells: 6 };
    const result = getPieceDimensions(1.5, grid, 100);
    expect(result.baseHeight).toBeCloseTo(100);
    expect(result.viewportWidth).toBeGreaterThan(result.baseWidth);
    expect(result.viewportHeight).toBeGreaterThan(result.baseHeight);
  });

  it('derives a board viewBox that preserves source image aspect ratio', () => {
    const grid: GridSpec = { rows: 1, cols: 1, activeCells: 1 };
    const result = getSvgBoardDimensions(1.5, grid, 100);
    expect(result.width / result.height).toBeCloseTo(1.5);
  });
});
