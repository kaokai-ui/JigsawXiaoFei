import { describe, expect, it } from 'vitest';
import { chooseGridSpec, createTargetCells } from './grid';

describe('chooseGridSpec', () => {
  describe('composite piece counts', () => {
    it('pieceCount=10, aspect=1 prefers 2 by 5 for a square image', () => {
      const spec = chooseGridSpec(10, 1);
      expect(spec.activeCells).toBe(10);
      expect(spec.rows).toBe(2);
      expect(spec.cols).toBe(5);
    });

    it('pieceCount=15, aspect=1 returns a 3 by 5 or 5 by 3 grid', () => {
      const spec = chooseGridSpec(15, 1);
      expect(spec.activeCells).toBe(15);
      expect(spec.rows * spec.cols).toBe(15);
      expect([3, 5]).toContain(spec.rows);
      expect([3, 5]).toContain(spec.cols);
    });

    it('pieceCount=20, aspect=1 returns a 4 by 5 or 5 by 4 grid', () => {
      const spec = chooseGridSpec(20, 1);
      expect(spec.activeCells).toBe(20);
      expect(spec.rows * spec.cols).toBe(20);
      expect([4, 5]).toContain(spec.rows);
      expect([4, 5]).toContain(spec.cols);
    });
  });

  describe('aspect ratio influence', () => {
    it('wide image aspect prefers a wider grid', () => {
      const spec = chooseGridSpec(10, 2.0);
      expect(spec.cols / spec.rows).toBeGreaterThan(1);
    });

    it('tall image aspect prefers a taller grid', () => {
      const spec = chooseGridSpec(10, 0.5);
      expect(spec.rows / spec.cols).toBeGreaterThan(1);
    });

    it('wide image aspect 2.0 with 15 pieces stays wider than tall', () => {
      const spec = chooseGridSpec(15, 2.0);
      expect(spec.cols / spec.rows).toBeGreaterThan(1);
    });

    it('tall image aspect 0.5 with 20 pieces stays taller than wide', () => {
      const spec = chooseGridSpec(20, 0.5);
      expect(spec.rows / spec.cols).toBeGreaterThan(1);
    });
  });

  describe('prime number piece counts', () => {
    it('prime 17 keeps activeCells at 17 while expanding the grid', () => {
      const spec = chooseGridSpec(17, 1);
      expect(spec.activeCells).toBe(17);
      expect(spec.rows * spec.cols).toBeGreaterThanOrEqual(17);
    });

    it('prime 7 keeps activeCells at 7', () => {
      const spec = chooseGridSpec(7, 1);
      expect(spec.activeCells).toBe(7);
      expect(spec.rows * spec.cols).toBeGreaterThanOrEqual(7);
    });

    it('prime 7 with wide aspect uses one of the limited exact options', () => {
      const spec = chooseGridSpec(7, 2.0);
      expect(spec.activeCells).toBe(7);
      expect(spec.rows * spec.cols).toBe(7);
      expect([1, 7]).toContain(spec.rows);
      expect([1, 7]).toContain(spec.cols);
    });
  });
});

describe('createTargetCells', () => {
  it('returns the correct count for an exact grid', () => {
    const grid = { rows: 2, cols: 5, activeCells: 10 };
    const cells = createTargetCells(grid);
    expect(cells).toHaveLength(10);
  });

  it('uses indices from 0 to activeCells - 1', () => {
    const grid = { rows: 2, cols: 5, activeCells: 10 };
    const cells = createTargetCells(grid);
    expect(cells.map((cell) => cell.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('does not include cells at or beyond activeCells', () => {
    const grid = { rows: 2, cols: 4, activeCells: 7 };
    const cells = createTargetCells(grid);
    expect(cells).toHaveLength(7);
    expect(cells.map((cell) => cell.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('assigns the correct row and col to each active cell', () => {
    const grid = { rows: 2, cols: 4, activeCells: 7 };
    const cells = createTargetCells(grid);
    expect(cells[6]).toEqual({ row: 1, col: 2, index: 6 });
  });

  it('returns cells in row-major order', () => {
    const grid = { rows: 3, cols: 5, activeCells: 15 };
    const cells = createTargetCells(grid);

    for (let index = 1; index < cells.length; index += 1) {
      if (cells[index].row === cells[index - 1].row) {
        expect(cells[index].col).toBe(cells[index - 1].col + 1);
      } else {
        expect(cells[index].row).toBe(cells[index - 1].row + 1);
        expect(cells[index].col).toBe(0);
      }
    }
  });
});
