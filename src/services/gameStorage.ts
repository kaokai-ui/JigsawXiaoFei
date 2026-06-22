import type { Difficulty, EdgeKind, GameSession, Piece, PieceId, GamePhase, PieceStatus, PieceEdge } from '../domain/puzzle/types';
import { createLegacyEdge } from '../domain/puzzle/shapes';

export interface SerializedEdgeShape {
  kind: EdgeKind;
  offsetRatio: number;
  spanRatio: number;
  depthRatio: number;
  shoulderRatio: number;
  skewRatio: number;
}

export interface SerializedPiece {
  id: PieceId;
  sourceRow: number;
  sourceCol: number;
  sourceIndex: number;
  status: PieceStatus;
  trayOrder: number | null;
  placedCellIndex: number | null;
  shapeTop: EdgeKind | SerializedEdgeShape;
  shapeRight: EdgeKind | SerializedEdgeShape;
  shapeBottom: EdgeKind | SerializedEdgeShape;
  shapeLeft: EdgeKind | SerializedEdgeShape;
}

export interface SerializedSession {
  id: string;
  imageId: string;
  difficulty: string;
  pieceCount: number;
  gridRows: number;
  gridCols: number;
  gridActiveCells: number;
  pieces: SerializedPiece[];
  phase: GamePhase;
  startedAtEpochMs: number | null;
  elapsedMs: number;
  moves: number;
  hintsUsed: number;
  seed: number;
  version: number;
}

export function serializeSession(session: GameSession): SerializedSession {
  return {
    id: session.id,
    imageId: session.imageId,
    difficulty: session.difficulty,
    pieceCount: session.pieceCount,
    gridRows: session.grid.rows,
    gridCols: session.grid.cols,
    gridActiveCells: session.grid.activeCells,
    pieces: Object.values(session.pieces).map(p => ({
      id: p.id,
      sourceRow: p.source.row,
      sourceCol: p.source.col,
      sourceIndex: p.source.index,
      status: p.status,
      trayOrder: p.trayOrder,
      placedCellIndex: p.placedCellIndex,
      shapeTop: serializeEdge(p.shape.top),
      shapeRight: serializeEdge(p.shape.right),
      shapeBottom: serializeEdge(p.shape.bottom),
      shapeLeft: serializeEdge(p.shape.left),
    })),
    phase: session.phase,
    startedAtEpochMs: session.startedAtEpochMs,
    elapsedMs: session.elapsedMs,
    moves: session.moves,
    hintsUsed: session.hintsUsed,
    seed: session.seed,
    version: session.version,
  };
}

export type HydrateResult =
  | { ok: true; session: GameSession }
  | { ok: false; error: string };

export function hydrateSession(data: unknown, validImageIds: readonly string[]): HydrateResult {
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Invalid session data' };
  }

  const s = data as Record<string, unknown>;

  if (s.version !== 1) {
    return { ok: false, error: 'Unsupported session version' };
  }

  if (typeof s.imageId !== 'string' || !validImageIds.includes(s.imageId as string)) {
    return { ok: false, error: 'Image no longer available' };
  }

  if (typeof s.pieceCount !== 'number' || typeof s.gridRows !== 'number' || typeof s.gridCols !== 'number') {
    return { ok: false, error: 'Missing grid info' };
  }

  if (typeof s.gridActiveCells !== 'number') {
    return { ok: false, error: 'Missing grid active cells info' };
  }

  if (!Array.isArray(s.pieces)) {
    return { ok: false, error: 'Missing pieces data' };
  }

  const gridRows = s.gridRows as number;
  const gridCols = s.gridCols as number;
  const gridActiveCells = s.gridActiveCells as number;
  const pieceCount = s.pieceCount as number;

  if (gridRows < 1 || gridCols < 1) {
    return { ok: false, error: 'Invalid grid dimensions' };
  }

  if (!Number.isInteger(gridRows) || !Number.isInteger(gridCols) || !Number.isInteger(gridActiveCells)
    || gridActiveCells !== pieceCount || gridActiveCells > gridRows * gridCols || pieceCount < 1 || pieceCount > 100) {
    return { ok: false, error: 'Invalid piece count' };
  }

  const pieces: Record<PieceId, Piece> = {};
  const seenIds = new Set<PieceId>();
  const seenSourceIndices = new Set<number>();
  for (const sp of s.pieces as SerializedPiece[]) {
    if (typeof sp.id !== 'string' || !/^piece-\d+$/.test(sp.id) || seenIds.has(sp.id)) {
      return { ok: false, error: `Duplicate piece id: ${sp.id}` };
    }
    const pieceId = sp.id as PieceId;
    seenIds.add(pieceId);

    if (typeof sp.sourceRow !== 'number' || typeof sp.sourceCol !== 'number' || typeof sp.sourceIndex !== 'number') {
      return { ok: false, error: `Invalid source for piece ${sp.id}` };
    }

    if (sp.sourceRow < 0 || sp.sourceRow >= gridRows || sp.sourceCol < 0 || sp.sourceCol >= gridCols) {
      return { ok: false, error: `Source out of grid bounds for piece ${sp.id}` };
    }

    if (sp.sourceIndex < 0 || sp.sourceIndex >= gridActiveCells) {
      return { ok: false, error: `Source index out of range for piece ${sp.id}` };
    }
    if (sp.sourceIndex !== sp.sourceRow * gridCols + sp.sourceCol || seenSourceIndices.has(sp.sourceIndex)) {
      return { ok: false, error: `Invalid or duplicate source index for piece ${sp.id}` };
    }
    seenSourceIndices.add(sp.sourceIndex);

    if (sp.status !== 'tray' && sp.status !== 'dragging' && sp.status !== 'locked') {
      return { ok: false, error: `Invalid status for piece ${sp.id}` };
    }

    if (sp.status === 'locked' && (typeof sp.placedCellIndex !== 'number' || sp.placedCellIndex < 0 || sp.placedCellIndex >= gridActiveCells)) {
      return { ok: false, error: `Invalid placedCellIndex for locked piece ${sp.id}` };
    }
    if (sp.status === 'locked' && sp.placedCellIndex !== sp.sourceIndex) {
      return { ok: false, error: `Locked piece is not in its source cell: ${sp.id}` };
    }
    if (sp.status !== 'locked' && sp.placedCellIndex !== null) {
      return { ok: false, error: `Unlocked piece has a placed cell: ${sp.id}` };
    }
    const topEdge = hydrateEdge(sp.shapeTop);
    const rightEdge = hydrateEdge(sp.shapeRight);
    const bottomEdge = hydrateEdge(sp.shapeBottom);
    const leftEdge = hydrateEdge(sp.shapeLeft);
    if (!topEdge || !rightEdge || !bottomEdge || !leftEdge) {
      return { ok: false, error: `Invalid shape for piece ${sp.id}` };
    }

    pieces[pieceId] = {
      id: pieceId,
      source: { row: sp.sourceRow, col: sp.sourceCol, index: sp.sourceIndex },
      status: sp.status,
      trayOrder: sp.trayOrder,
      placedCellIndex: sp.placedCellIndex,
      shape: {
        top: topEdge,
        right: rightEdge,
        bottom: bottomEdge,
        left: leftEdge,
      },
    };
  }

  if (Object.keys(pieces).length !== pieceCount) {
    return { ok: false, error: 'Piece count mismatch' };
  }

  const validPhases = ['idle', 'loading', 'playing', 'paused', 'completed', 'error'];
  if (typeof s.phase !== 'string' || !validPhases.includes(s.phase)) {
    return { ok: false, error: 'Invalid phase' };
  }

  if (typeof s.elapsedMs !== 'number' || s.elapsedMs < 0) {
    return { ok: false, error: 'Invalid elapsed time' };
  }

  if (!Number.isInteger(s.moves) || !Number.isInteger(s.hintsUsed) || (s.moves as number) < 0 || (s.hintsUsed as number) < 0) {
    return { ok: false, error: 'Invalid move/hint counts' };
  }

  if (typeof s.id !== 'string' || !isDifficulty(s.difficulty) || !Number.isFinite(s.seed)) {
    return { ok: false, error: 'Invalid session identity' };
  }

  const session: GameSession = {
    id: s.id as string,
    imageId: s.imageId as string,
    difficulty: s.difficulty,
    pieceCount,
    grid: {
      rows: gridRows,
      cols: gridCols,
      activeCells: gridActiveCells,
    },
    pieces,
    phase: s.phase as GamePhase,
    startedAtEpochMs: s.startedAtEpochMs as number | null,
    elapsedMs: s.elapsedMs as number,
    moves: s.moves as number,
    hintsUsed: s.hintsUsed as number,
    seed: s.seed as number,
    version: 1,
  };

  return { ok: true, session };
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'easy' || value === 'normal' || value === 'hard';
}

function isEdgeKind(value: unknown): value is EdgeKind {
  return value === -1 || value === 0 || value === 1;
}

function serializeEdge(edge: PieceEdge): SerializedEdgeShape {
  return {
    kind: edge.kind,
    offsetRatio: edge.offsetRatio,
    spanRatio: edge.spanRatio,
    depthRatio: edge.depthRatio,
    shoulderRatio: edge.shoulderRatio,
    skewRatio: edge.skewRatio,
  };
}

function hydrateEdge(value: unknown): PieceEdge | null {
  if (isEdgeKind(value)) {
    return createLegacyEdge(value);
  }
  if (!value || typeof value !== 'object') return null;

  const edge = value as Record<string, unknown>;
  if (!isEdgeKind(edge.kind)) return null;

  const offsetRatio = asFiniteNumber(edge.offsetRatio);
  const spanRatio = asFiniteNumber(edge.spanRatio);
  const depthRatio = asFiniteNumber(edge.depthRatio);
  const shoulderRatio = asFiniteNumber(edge.shoulderRatio);
  const skewRatio = asFiniteNumber(edge.skewRatio);

  if (
    offsetRatio === null
    || spanRatio === null
    || depthRatio === null
    || shoulderRatio === null
    || skewRatio === null
  ) {
    return null;
  }

  return {
    kind: edge.kind,
    offsetRatio,
    spanRatio,
    depthRatio,
    shoulderRatio,
    skewRatio,
  };
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
