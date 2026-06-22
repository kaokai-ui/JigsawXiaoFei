export type Difficulty = 'easy' | 'normal' | 'hard';
export type GamePhase = 'idle' | 'loading' | 'playing' | 'paused' | 'completed' | 'error';
export type PieceStatus = 'tray' | 'dragging' | 'locked';
export type PieceId = `piece-${number}`;
export type EdgeKind = -1 | 0 | 1;

export interface PieceEdge {
  kind: EdgeKind;
  offsetRatio: number;
  spanRatio: number;
  depthRatio: number;
  shoulderRatio: number;
  skewRatio: number;
}

export interface PieceShape {
  top: PieceEdge;
  right: PieceEdge;
  bottom: PieceEdge;
  left: PieceEdge;
}

export interface GridSpec {
  rows: number;
  cols: number;
  activeCells: number;
}

export interface GridCell {
  row: number;
  col: number;
  index: number;
}

export interface Piece {
  id: PieceId;
  source: GridCell;
  status: PieceStatus;
  trayOrder: number | null;
  placedCellIndex: number | null;
  shape: PieceShape;
}

export interface BoardLayout {
  grid: GridSpec;
  targetCells: readonly GridCell[];
}

export interface GameSession {
  id: string;
  imageId: string;
  difficulty: Difficulty;
  pieceCount: number;
  grid: GridSpec;
  pieces: Record<PieceId, Piece>;
  phase: GamePhase;
  startedAtEpochMs: number | null;
  elapsedMs: number;
  moves: number;
  hintsUsed: number;
  seed: number;
  version: 1;
}

export interface GameSettings {
  pieceCountByDifficulty: Record<Difficulty, number>;
  showReferenceOverlay: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  reducedMotionOverride: 'system' | 'reduce' | 'full';
}

export interface GameResult {
  sessionId: string;
  imageId: string;
  difficulty: Difficulty;
  completedAtEpochMs: number;
  elapsedMs: number;
  moves: number;
  hintsUsed: number;
  score: number;
}

export interface BestRecord {
  score: number;
  elapsedMs: number;
  moves: number;
  hintsUsed: number;
  completedAtEpochMs: number;
}

export type PlacementOutcome =
  | { kind: 'locked'; session: GameSession; cell: GridCell }
  | { kind: 'incorrect'; session: GameSession; reason: 'outside' | 'wrong-cell' }
  | { kind: 'ignored'; session: GameSession; reason: 'not-draggable' };

export interface Hint {
  pieceId: PieceId;
  targetCell: GridCell;
}

export interface Point {
  x: number;
  y: number;
}

export interface PieceBitmapAsset {
  src: string;
  width: number;
  height: number;
}

export type PieceBitmapAssetMap = Partial<Record<PieceId, PieceBitmapAsset>>;

export interface StartGameInput {
  imageId: string;
  imageAspectRatio: number;
  difficulty: Difficulty;
  pieceCount: number;
  seed?: number;
}

export type ValidationResult = { ok: true; value: number } | { ok: false; error: string };
