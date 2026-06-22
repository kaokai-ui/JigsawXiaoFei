export type {
  Difficulty,
  GamePhase,
  PieceStatus,
  PieceId,
  GridSpec,
  GridCell,
  Piece,
  PieceShape,
  PieceEdge,
  EdgeKind,
  BoardLayout,
  GameSession,
  GameSettings,
  GameResult,
  BestRecord,
  PlacementOutcome,
  Hint,
  Point,
  StartGameInput,
  ValidationResult,
} from './types';

export { validatePieceCount, DEFAULT_PIECE_COUNTS, DEFAULT_SETTINGS } from './settings';
export { chooseGridSpec, createTargetCells } from './grid';
export { createSeededRng, shuffleInPlaceCopy, generateSeed } from './random';
export { createSession, isSessionComplete } from './session';
export { getCellFromPoint, getSnapCandidate } from './hitTest';
export type { BoardRect } from './hitTest';
export { attemptPlacePiece } from './reducer';
export { getHint } from './hint';
export { getAllowedPieceCountsForImage, isSquareLikeImage, resolvePieceCountForImage } from './pieceCountPolicy';
export { createPieceShapes, assertComplementaryEdges, getPiecePath } from './shapes';
export {
  getBoardAspectRatio,
  getPieceAspectRatio,
  getSvgImagePlacement,
  getPieceDimensions,
  getSvgBoardDimensions,
} from './geometry';
