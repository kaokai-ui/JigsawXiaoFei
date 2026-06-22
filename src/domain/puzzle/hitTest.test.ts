import { describe, it, expect } from 'vitest';
import { getCellFromPoint, getSnapCandidate } from './hitTest';
import type { BoardRect } from './hitTest';
import type { GridSpec } from './types';

const boardRect: BoardRect = { x: 0, y: 0, width: 200, height: 150 };
const grid: GridSpec = { rows: 3, cols: 4, activeCells: 12 };
const primeGrid: GridSpec = { rows: 2, cols: 4, activeCells: 7 };

describe('getCellFromPoint', () => {
  it('point in center of grid returns correct cell', () => {
    const cell = getCellFromPoint({ x: 100, y: 75 }, boardRect, grid);
    expect(cell).not.toBeNull();
    expect(cell!.col).toBe(2);
    expect(cell!.row).toBe(1);
    expect(cell!.index).toBe(6);
  });

  it('point at top-left corner returns cell (0,0)', () => {
    const cell = getCellFromPoint({ x: 0, y: 0 }, boardRect, grid);
    expect(cell).toEqual({ row: 0, col: 0, index: 0 });
  });

  it('point at bottom-right edge returns last cell', () => {
    const cell = getCellFromPoint({ x: 199.99, y: 149.99 }, boardRect, grid);
    expect(cell).not.toBeNull();
    expect(cell!.row).toBe(2);
    expect(cell!.col).toBe(3);
    expect(cell!.index).toBe(11);
  });

  it('point outside board (negative x) returns null', () => {
    expect(getCellFromPoint({ x: -1, y: 75 }, boardRect, grid)).toBeNull();
  });

  it('point outside board (negative y) returns null', () => {
    expect(getCellFromPoint({ x: 100, y: -1 }, boardRect, grid)).toBeNull();
  });

  it('point outside board (beyond width) returns null', () => {
    expect(getCellFromPoint({ x: 200, y: 75 }, boardRect, grid)).toBeNull();
  });

  it('point outside board (beyond height) returns null', () => {
    expect(getCellFromPoint({ x: 100, y: 150 }, boardRect, grid)).toBeNull();
  });

  it('point in inactive cell returns null', () => {
    const cell = getCellFromPoint({ x: 175, y: 125 }, boardRect, primeGrid);
    expect(cell).toBeNull();
  });

  it('works with non-zero boardRect origin', () => {
    const offsetRect: BoardRect = { x: 50, y: 50, width: 200, height: 150 };
    const cell = getCellFromPoint({ x: 150, y: 125 }, offsetRect, grid);
    expect(cell).not.toBeNull();
    expect(cell!.col).toBe(2);
    expect(cell!.row).toBe(1);
  });
});

describe('getSnapCandidate', () => {
  const snapGrid: GridSpec = { rows: 2, cols: 2, activeCells: 4 };
  const snapRect: BoardRect = { x: 0, y: 0, width: 200, height: 200 };

  it('within snap threshold returns cell', () => {
    const cellCenter = { x: 50, y: 50 };
    const result = getSnapCandidate(cellCenter, snapRect, snapGrid);
    expect(result).not.toBeNull();
    expect(result!.row).toBe(0);
    expect(result!.col).toBe(0);
  });

  it('outside snap threshold returns null', () => {
    const nearEdge = { x: 1, y: 1 };
    const result = getSnapCandidate(nearEdge, snapRect, snapGrid, 0.1);
    expect(result).toBeNull();
  });

  it('point outside board returns null', () => {
    const result = getSnapCandidate({ x: -10, y: 50 }, snapRect, snapGrid);
    expect(result).toBeNull();
  });

  it('point at exact cell center returns cell', () => {
    const result = getSnapCandidate({ x: 150, y: 150 }, snapRect, snapGrid);
    expect(result).not.toBeNull();
    expect(result!.row).toBe(1);
    expect(result!.col).toBe(1);
  });
});
