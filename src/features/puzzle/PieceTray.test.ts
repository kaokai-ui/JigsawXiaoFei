import { describe, expect, it } from 'vitest';
import { calculateTrayPieceWidth } from './PieceTray';

describe('calculateTrayPieceWidth', () => {
  it('keeps tray piece width stable while the session piece count is unchanged', () => {
    const widthA = calculateTrayPieceWidth(320, 720, 1, 9);
    const widthB = calculateTrayPieceWidth(320, 720, 1, 9);

    expect(widthA).toBe(widthB);
    expect(widthA).toBeGreaterThan(0);
  });

  it('uses the session total instead of shrinking tray count to avoid remaining pieces growing', () => {
    const widthForNine = calculateTrayPieceWidth(320, 720, 1, 9);
    const widthForEight = calculateTrayPieceWidth(320, 720, 1, 8);

    expect(widthForNine).not.toBeNull();
    expect(widthForEight).not.toBeNull();
    const stableWidth = widthForNine as number;
    const enlargedWidth = widthForEight as number;
    expect(stableWidth).toBeLessThan(enlargedWidth);
  });
});
