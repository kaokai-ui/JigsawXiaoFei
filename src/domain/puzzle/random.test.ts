import { describe, it, expect } from 'vitest';
import { createSeededRng, shuffleInPlaceCopy } from './random';

describe('createSeededRng', () => {
  it('same seed produces same sequence', () => {
    const rng1 = createSeededRng(42);
    const rng2 = createSeededRng(42);
    const seq1 = Array.from({ length: 20 }, () => rng1());
    const seq2 = Array.from({ length: 20 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it('different seeds produce different sequences', () => {
    const rng1 = createSeededRng(42);
    const rng2 = createSeededRng(99);
    const seq1 = Array.from({ length: 20 }, () => rng1());
    const seq2 = Array.from({ length: 20 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });

  it('produces values between 0 (inclusive) and 1 (exclusive)', () => {
    const rng = createSeededRng(12345);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe('shuffleInPlaceCopy', () => {
  it('same seed produces same order', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result1 = shuffleInPlaceCopy(items, createSeededRng(42));
    const result2 = shuffleInPlaceCopy(items, createSeededRng(42));
    expect(result1).toEqual(result2);
  });

  it('output is a permutation of input', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = shuffleInPlaceCopy(items, createSeededRng(42));
    expect([...result].sort((a, b) => a - b)).toEqual([...items].sort((a, b) => a - b));
  });

  it('original array is not mutated', () => {
    const items = [1, 2, 3, 4, 5];
    const original = [...items];
    shuffleInPlaceCopy(items, createSeededRng(42));
    expect(items).toEqual(original);
  });

  it('single element array stays same', () => {
    const result = shuffleInPlaceCopy([42], createSeededRng(1));
    expect(result).toEqual([42]);
  });

  it('empty array returns empty', () => {
    const result = shuffleInPlaceCopy([], createSeededRng(1));
    expect(result).toEqual([]);
  });
});
