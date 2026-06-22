import { describe, it, expect } from 'vitest';
import { calculateScore } from './calculateScore';

describe('calculateScore', () => {
  it('zero time, exact moves, no hints → max score (pieceCount * 100)', () => {
    const score = calculateScore({ pieceCount: 10, elapsedMs: 0, moves: 10, hintsUsed: 0 });
    expect(score).toBe(1000);
  });

  it('time penalty: floor(elapsedSeconds/5) * 2', () => {
    const score = calculateScore({ pieceCount: 10, elapsedMs: 10000, moves: 10, hintsUsed: 0 });
    const elapsedSeconds = Math.floor(10000 / 1000);
    const expectedTimePenalty = Math.floor(elapsedSeconds / 5) * 2;
    expect(score).toBe(1000 - expectedTimePenalty);
  });

  it('move penalty: max(0, moves - pieceCount) * 5', () => {
    const score = calculateScore({ pieceCount: 10, elapsedMs: 0, moves: 15, hintsUsed: 0 });
    const expectedMovePenalty = (15 - 10) * 5;
    expect(score).toBe(1000 - expectedMovePenalty);
  });

  it('hint penalty: hintsUsed * 50', () => {
    const score = calculateScore({ pieceCount: 10, elapsedMs: 0, moves: 10, hintsUsed: 3 });
    expect(score).toBe(1000 - 3 * 50);
  });

  it('score never goes below 0', () => {
    const score = calculateScore({ pieceCount: 4, elapsedMs: 0, moves: 100, hintsUsed: 20 });
    expect(score).toBe(0);
  });

  it('verifies full formula: base - timePenalty - movePenalty - hintPenalty', () => {
    const input = { pieceCount: 20, elapsedMs: 63000, moves: 30, hintsUsed: 2 };
    const base = 20 * 100;
    const elapsedSeconds = Math.floor(63000 / 1000);
    const timePenalty = Math.floor(elapsedSeconds / 5) * 2;
    const movePenalty = Math.max(0, 30 - 20) * 5;
    const hintPenalty = 2 * 50;
    const expected = Math.max(0, base - timePenalty - movePenalty - hintPenalty);
    expect(calculateScore(input)).toBe(expected);
  });

  it('no move penalty when moves equals pieceCount', () => {
    const score = calculateScore({ pieceCount: 10, elapsedMs: 0, moves: 10, hintsUsed: 0 });
    expect(score).toBe(1000);
  });

  it('no move penalty when moves less than pieceCount', () => {
    const score = calculateScore({ pieceCount: 10, elapsedMs: 0, moves: 5, hintsUsed: 0 });
    expect(score).toBe(1000);
  });

  it('time penalty at 5-second boundary', () => {
    const score = calculateScore({ pieceCount: 10, elapsedMs: 5000, moves: 10, hintsUsed: 0 });
    expect(score).toBe(1000 - 2);
  });

  it('time penalty at 4999ms (just under 5s)', () => {
    const score = calculateScore({ pieceCount: 10, elapsedMs: 4999, moves: 10, hintsUsed: 0 });
    expect(score).toBe(1000 - 0);
  });
});
