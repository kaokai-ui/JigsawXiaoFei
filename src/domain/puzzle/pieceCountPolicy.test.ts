import { describe, expect, it } from 'vitest';
import {
  getAllowedPieceCountsForImage,
  isSquareLikeImage,
  resolvePieceCountForImage,
} from './pieceCountPolicy';

describe('pieceCountPolicy', () => {
  it('recognizes square-like images', () => {
    expect(isSquareLikeImage({ aspectRatio: 1 })).toBe(true);
    expect(isSquareLikeImage({ aspectRatio: 0.95 })).toBe(true);
    expect(isSquareLikeImage({ aspectRatio: 0.8 })).toBe(false);
  });

  it('filters out awkward square-image counts like 10 and 15', () => {
    const allowed = getAllowedPieceCountsForImage({
      aspectRatio: 1,
      width: 1254,
      height: 1254,
    });

    expect(allowed).not.toContain(10);
    expect(allowed).not.toContain(15);
    expect(allowed).toContain(9);
    expect(allowed).toContain(16);
    expect(allowed).toContain(20);
  });

  it('keeps non-square images unchanged', () => {
    expect(
      resolvePieceCountForImage(
        { aspectRatio: 1.7768, width: 1672, height: 941 },
        10,
      ),
    ).toBe(10);
  });

  it('resolves square-image counts to the nearest supported value', () => {
    const squareImage = { aspectRatio: 1, width: 1254, height: 1254 };

    expect(resolvePieceCountForImage(squareImage, 10)).toBe(9);
    expect(resolvePieceCountForImage(squareImage, 15)).toBe(16);
    expect(resolvePieceCountForImage(squareImage, 20)).toBe(20);
  });
});
