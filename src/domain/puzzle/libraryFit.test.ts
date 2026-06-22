import { describe, expect, it } from 'vitest';
import { imageManifest } from '../../generated/imageManifest';
import {
  getBoardCellPlacement,
  getSourcePieceDimensions,
  getSvgBoardDimensions,
} from './geometry';
import {
  getAllowedPieceCountsForImage,
  isSquareLikeImage,
  resolvePieceCountForImage,
} from './pieceCountPolicy';
import { createSession } from './session';
import { assertComplementaryEdges } from './shapes';
import { DEFAULT_PIECE_COUNTS } from './settings';
import type { Difficulty, PieceShape } from './types';

const fixedSeed = 20260622;
const difficulties = Object.entries(DEFAULT_PIECE_COUNTS) as [Difficulty, number][];

describe('library board fit', () => {
  for (const image of imageManifest) {
    for (const [difficulty, requestedPieceCount] of difficulties) {
      const resolvedPieceCount = resolvePieceCountForImage(image, requestedPieceCount);
      const caseLabel = `${image.id} ${difficulty} (${requestedPieceCount} -> ${resolvedPieceCount})`;

      it(`keeps board, bitmap, and source geometry aligned for ${caseLabel}`, () => {
        const session = createSession({
          imageId: image.id,
          imageAspectRatio: image.aspectRatio,
          difficulty,
          pieceCount: resolvedPieceCount,
          seed: fixedSeed,
        });

        const dimensions = getSourcePieceDimensions(image.width, image.height, session.grid);
        const boardPlacement = getBoardCellPlacement(dimensions);
        const boardDimensions = getSvgBoardDimensions(
          image.aspectRatio,
          session.grid,
          dimensions.baseWidth,
        );
        const shapesBySourceIndex: Record<number, PieceShape> = {};

        for (const piece of Object.values(session.pieces)) {
          shapesBySourceIndex[piece.source.index] = piece.shape;
        }

        expect(session.grid.activeCells).toBe(resolvedPieceCount);
        expect(session.grid.rows * session.grid.cols).toBe(resolvedPieceCount);
        expect(boardDimensions.width).toBeCloseTo(image.width, 6);
        expect(boardDimensions.height).toBeCloseTo(image.height, 6);
        expect(assertComplementaryEdges(shapesBySourceIndex, session.grid)).toBe(true);

        if (isSquareLikeImage(image)) {
          expect(getAllowedPieceCountsForImage(image)).toContain(resolvedPieceCount);
        }

        for (const piece of Object.values(session.pieces)) {
          const cellLeft = piece.source.col * dimensions.baseWidth;
          const cellTop = piece.source.row * dimensions.baseHeight;

          const bitmapLeft =
            cellLeft + (boardPlacement.leftPercent / 100) * dimensions.baseWidth;
          const bitmapTop =
            cellTop + (boardPlacement.topPercent / 100) * dimensions.baseHeight;
          const bitmapRight = bitmapLeft + dimensions.viewportWidth;
          const bitmapBottom = bitmapTop + dimensions.viewportHeight;

          const sourceImageLeft =
            dimensions.tabBleed - piece.source.col * dimensions.baseWidth;
          const sourceImageTop =
            dimensions.tabBleed - piece.source.row * dimensions.baseHeight;

          expect(bitmapLeft + sourceImageLeft).toBeCloseTo(0, 6);
          expect(bitmapTop + sourceImageTop).toBeCloseTo(0, 6);
          expect(bitmapRight - bitmapLeft).toBeCloseTo(dimensions.viewportWidth, 6);
          expect(bitmapBottom - bitmapTop).toBeCloseTo(dimensions.viewportHeight, 6);

          expect(bitmapLeft + dimensions.tabBleed).toBeCloseTo(cellLeft, 6);
          expect(bitmapTop + dimensions.tabBleed).toBeCloseTo(cellTop, 6);
          expect(cellLeft + dimensions.baseWidth).toBeLessThanOrEqual(image.width + 1e-6);
          expect(cellTop + dimensions.baseHeight).toBeLessThanOrEqual(image.height + 1e-6);
        }
      });
    }
  }
});
