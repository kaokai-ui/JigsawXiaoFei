import { describe, it, expect } from 'vitest';
import { createPieceShapes, assertComplementaryEdges, getPiecePath } from './shapes';
import type { GridSpec, PieceShape, EdgeKind, PieceEdge } from './types';

function edge(kind: EdgeKind, overrides: Partial<PieceEdge> = {}): PieceEdge {
  return {
    kind,
    offsetRatio: 0.5,
    spanRatio: 0.32,
    depthRatio: 0.24,
    shoulderRatio: 0.26,
    skewRatio: 0,
    ...overrides,
  };
}

describe('createPieceShapes', () => {
  it('produces shapes for a 2x2 grid', () => {
    const grid: GridSpec = { rows: 2, cols: 2, activeCells: 4 };
    const shapes = createPieceShapes(grid, 42);
    expect(Object.keys(shapes)).toHaveLength(4);
  });

  it('outer edges are flat (0)', () => {
    const grid: GridSpec = { rows: 2, cols: 2, activeCells: 4 };
    const shapes = createPieceShapes(grid, 42);
    expect(shapes[0].top.kind).toBe(0);
    expect(shapes[0].left.kind).toBe(0);
    expect(shapes[1].top.kind).toBe(0);
    expect(shapes[1].right.kind).toBe(0);
    expect(shapes[2].bottom.kind).toBe(0);
    expect(shapes[2].left.kind).toBe(0);
    expect(shapes[3].bottom.kind).toBe(0);
    expect(shapes[3].right.kind).toBe(0);
  });

  it('adjacent inner edges are complementary', () => {
    const grid: GridSpec = { rows: 3, cols: 3, activeCells: 9 };
    const shapes = createPieceShapes(grid, 99);
    expect(shapes[0].right.kind).toBe(-shapes[1].left.kind);
    expect(shapes[0].bottom.kind).toBe(-shapes[3].top.kind);
    expect(shapes[4].right.kind).toBe(-shapes[5].left.kind);
    expect(shapes[4].bottom.kind).toBe(-shapes[7].top.kind);
    expect(shapes[0].right.offsetRatio).toBe(shapes[1].left.offsetRatio);
    expect(shapes[0].bottom.spanRatio).toBe(shapes[3].top.spanRatio);
  });

  it('same seed produces same shapes', () => {
    const grid: GridSpec = { rows: 2, cols: 3, activeCells: 6 };
    const a = createPieceShapes(grid, 123);
    const b = createPieceShapes(grid, 123);
    expect(a).toEqual(b);
  });

  it('different seed produces different shapes', () => {
    const grid: GridSpec = { rows: 2, cols: 3, activeCells: 6 };
    const a = createPieceShapes(grid, 1);
    const b = createPieceShapes(grid, 2);
    let anyDiff = false;
    for (const key of Object.keys(a)) {
      if (JSON.stringify(a[Number(key)]) !== JSON.stringify(b[Number(key)])) {
        anyDiff = true;
        break;
      }
    }
    expect(anyDiff).toBe(true);
  });

  it('prime piece count (17) — inactive cells treated as boundary', () => {
    const grid: GridSpec = { rows: 2, cols: 4, activeCells: 7 };
    const shapes = createPieceShapes(grid, 42);

    expect(shapes[3].top.kind).toBe(0);
    expect(shapes[3].right.kind).toBe(0);
    expect(shapes[6].right.kind).toBe(0);

    const cellBelowIndex3 = (1) * 4 + 3;
    if (cellBelowIndex3 >= grid.activeCells) {
      expect(shapes[3].bottom.kind).toBe(0);
    }
  });

  it('works for 10, 15, 20 pieces', () => {
    for (const count of [10, 15, 20]) {
      const grid: GridSpec = chooseTestGrid(count);
      const shapes = createPieceShapes(grid, 1);
      expect(Object.keys(shapes).length).toBe(grid.rows * grid.cols);
      expect(assertComplementaryEdges(shapes, grid)).toBe(true);
    }
  });
});

describe('assertComplementaryEdges', () => {
  it('returns true for valid shapes', () => {
    const grid: GridSpec = { rows: 2, cols: 2, activeCells: 4 };
    const shapes = createPieceShapes(grid, 42);
    expect(assertComplementaryEdges(shapes, grid)).toBe(true);
  });

  it('returns false for manually broken shapes', () => {
    const grid: GridSpec = { rows: 2, cols: 2, activeCells: 4 };
    const shapes = createPieceShapes(grid, 42);
    shapes[0].right = edge(1);
    shapes[1].left = edge(1);
    expect(assertComplementaryEdges(shapes, grid)).toBe(false);
  });

  it('returns false for flat edge where tab should be', () => {
    const grid: GridSpec = { rows: 2, cols: 2, activeCells: 4 };
    const shapes = createPieceShapes(grid, 42);
    shapes[0].bottom = edge(0);
    shapes[2].top = edge(0);
    expect(assertComplementaryEdges(shapes, grid)).toBe(false);
  });
});

describe('getPiecePath', () => {
  it('produces a non-empty path string for flat edges', () => {
    const shape: PieceShape = { top: edge(0), right: edge(0), bottom: edge(0), left: edge(0) };
    const path = getPiecePath(shape, 100, 100);
    expect(path).toContain('M 0 0');
    expect(path).toContain('Z');
  });

  it('produces a path with cubic bezier for tab edges', () => {
    const shape: PieceShape = { top: edge(0), right: edge(1), bottom: edge(-1), left: edge(0) };
    const path = getPiecePath(shape, 100, 100);
    expect(path).toContain('C');
  });

  it('path is different for tab vs blank on same edge', () => {
    const tab: PieceShape = { top: edge(1), right: edge(0), bottom: edge(0), left: edge(0) };
    const blank: PieceShape = { top: edge(-1), right: edge(0), bottom: edge(0), left: edge(0) };
    const pathTab = getPiecePath(tab, 100, 100);
    const pathBlank = getPiecePath(blank, 100, 100);
    expect(pathTab).not.toBe(pathBlank);
  });

  it('uses the supplied non-square width and height on every edge', () => {
    const shape: PieceShape = { top: edge(1), right: edge(-1), bottom: edge(1), left: edge(-1) };
    const path = getPiecePath(shape, 100, 140.7);
    expect(path).toContain('L 100 140.7');
    expect(path).toContain('L 0 140.7');
    expect(path).not.toContain('NaN');
  });

  it('varies the tab location when edge profiles differ', () => {
    const centered: PieceShape = { top: edge(1, { offsetRatio: 0.5 }), right: edge(0), bottom: edge(0), left: edge(0) };
    const shifted: PieceShape = { top: edge(1, { offsetRatio: 0.62, skewRatio: 0.14 }), right: edge(0), bottom: edge(0), left: edge(0) };

    expect(getPiecePath(centered, 100, 100)).not.toBe(getPiecePath(shifted, 100, 100));
  });
});

function chooseTestGrid(pieceCount: number): GridSpec {
  for (let r = 1; r <= Math.sqrt(pieceCount); r++) {
    if (pieceCount % r === 0) {
      return { rows: r, cols: pieceCount / r, activeCells: pieceCount };
    }
  }
  const total = pieceCount + 1;
  for (let r = 1; r <= Math.sqrt(total); r++) {
    if (total % r === 0) {
      return { rows: r, cols: total / r, activeCells: pieceCount };
    }
  }
  return { rows: 1, cols: pieceCount, activeCells: pieceCount };
}
