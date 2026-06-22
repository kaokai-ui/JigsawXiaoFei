import { describe, it, expect } from 'vitest';
import { serializeSession, hydrateSession } from '../../services/gameStorage';
import type { GameSession, Piece, PieceShape, EdgeKind, PieceEdge } from '../../domain/puzzle/types';

const VALID_IMAGE_IDS = ['img-001', 'img-002'];

function edge(kind: EdgeKind, overrides: Partial<PieceEdge> = {}): PieceEdge {
  return {
    kind,
    offsetRatio: 0.5,
    spanRatio: 0.32,
    depthRatio: 0.24,
    shoulderRatio: 0.26,
    skewRatio: 0,
    ...overrides,
  };
}

const defaultShape: PieceShape = { top: edge(0), right: edge(1), bottom: edge(-1), left: edge(0) };

function makeSession(overrides: Partial<GameSession> = {}): GameSession {
  const piece0: Piece = {
    id: 'piece-0',
    source: { row: 0, col: 0, index: 0 },
    status: 'tray',
    trayOrder: 0,
    placedCellIndex: null,
    shape: defaultShape,
  };
  const pieces: Record<string, Piece> = { 'piece-0': piece0 };
  for (let i = 1; i < 10; i++) {
    const id = `piece-${i}` as `piece-${number}`;
    pieces[id] = {
      id,
      source: { row: Math.floor(i / 4), col: i % 4, index: i },
      status: 'tray',
      trayOrder: i,
      placedCellIndex: null,
      shape: defaultShape,
    };
  }
  return {
    id: 'session-1',
    imageId: 'img-001',
    difficulty: 'easy',
    pieceCount: 10,
    grid: { rows: 3, cols: 4, activeCells: 10 },
    pieces: pieces as GameSession['pieces'],
    phase: 'paused',
    startedAtEpochMs: 1000,
    elapsedMs: 5000,
    moves: 3,
    hintsUsed: 0,
    seed: 42,
    version: 1,
    ...overrides,
  };
}

describe('gameStorage', () => {
  describe('serializeSession', () => {
    it('produces correct JSON', () => {
      const session = makeSession();
      const serialized = serializeSession(session);
      const json = JSON.parse(JSON.stringify(serialized));
      expect(json.id).toBe('session-1');
      expect(json.imageId).toBe('img-001');
      expect(json.difficulty).toBe('easy');
      expect(json.pieceCount).toBe(10);
      expect(json.gridRows).toBe(3);
      expect(json.gridCols).toBe(4);
      expect(json.gridActiveCells).toBe(10);
      expect(json.pieces).toHaveLength(10);
      expect(json.phase).toBe('paused');
      expect(json.elapsedMs).toBe(5000);
      expect(json.moves).toBe(3);
      expect(json.hintsUsed).toBe(0);
      expect(json.seed).toBe(42);
      expect(json.version).toBe(1);
    });
  });

  describe('hydrateSession', () => {
    it('with valid data succeeds', () => {
      const session = makeSession();
      const serialized = serializeSession(session);
      const result = hydrateSession(serialized, VALID_IMAGE_IDS);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.session.id).toBe('session-1');
        expect(result.session.imageId).toBe('img-001');
        expect(result.session.difficulty).toBe('easy');
        expect(result.session.pieceCount).toBe(10);
        expect(result.session.grid).toEqual({ rows: 3, cols: 4, activeCells: 10 });
        expect(result.session.phase).toBe('paused');
      }
    });

    it('accepts legacy numeric edge shapes from older saves', () => {
      const piece = {
        id: 'piece-0',
        sourceRow: 0,
        sourceCol: 0,
        sourceIndex: 0,
        status: 'tray',
        trayOrder: 0,
        placedCellIndex: null,
        shapeTop: 0,
        shapeRight: 1,
        shapeBottom: -1,
        shapeLeft: 0,
      };
      const data = {
        version: 1,
        id: 'legacy-session',
        imageId: 'img-001',
        difficulty: 'easy',
        pieceCount: 1,
        gridRows: 1,
        gridCols: 1,
        gridActiveCells: 1,
        pieces: [piece],
        phase: 'paused',
        startedAtEpochMs: null,
        elapsedMs: 0,
        moves: 0,
        hintsUsed: 0,
        seed: 42,
      };

      const result = hydrateSession(data, VALID_IMAGE_IDS);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.session.pieces['piece-0'].shape.right.kind).toBe(1);
        expect(result.session.pieces['piece-0'].shape.bottom.kind).toBe(-1);
      }
    });

    it('with invalid version fails', () => {
      const data = { version: 2, imageId: 'img-001', pieceCount: 10, gridRows: 3, gridCols: 4, pieces: [] };
      const result = hydrateSession(data, VALID_IMAGE_IDS);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Unsupported session version');
      }
    });

    it('with missing image ID fails', () => {
      const data = { version: 1, imageId: 'img-nonexistent', pieceCount: 10, gridRows: 3, gridCols: 4, pieces: [] };
      const result = hydrateSession(data, VALID_IMAGE_IDS);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Image no longer available');
      }
    });

    it('with missing fields fails', () => {
      const data = { version: 1, imageId: 'img-001' };
      const result = hydrateSession(data, VALID_IMAGE_IDS);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Missing grid info');
      }
    });

    it('with missing gridActiveCells fails', () => {
      const data = { version: 1, imageId: 'img-001', pieceCount: 10, gridRows: 3, gridCols: 4, pieces: [] };
      const result = hydrateSession(data, VALID_IMAGE_IDS);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Missing grid active cells info');
      }
    });

    it('with invalid grid dimensions fails', () => {
      const data = { version: 1, imageId: 'img-001', pieceCount: 10, gridRows: 0, gridCols: 4, gridActiveCells: 10, pieces: [] };
      const result = hydrateSession(data, VALID_IMAGE_IDS);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Invalid grid dimensions');
      }
    });

    it('with duplicate piece id fails', () => {
      const piece = { id: 'piece-0', sourceRow: 0, sourceCol: 0, sourceIndex: 0, status: 'tray', trayOrder: 0, placedCellIndex: null, shapeTop: 0, shapeRight: 0, shapeBottom: 0, shapeLeft: 0 };
      const data = { version: 1, imageId: 'img-001', pieceCount: 2, gridRows: 1, gridCols: 2, gridActiveCells: 2, pieces: [piece, piece], seed: 42, id: 's1', difficulty: 'easy', phase: 'paused', startedAtEpochMs: null, elapsedMs: 0, moves: 0, hintsUsed: 0 };
      const result = hydrateSession(data, VALID_IMAGE_IDS);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Duplicate piece id');
      }
    });

    it('with out-of-range source index fails', () => {
      const piece = { id: 'piece-0', sourceRow: 0, sourceCol: 0, sourceIndex: 99, status: 'tray', trayOrder: 0, placedCellIndex: null, shapeTop: 0, shapeRight: 0, shapeBottom: 0, shapeLeft: 0 };
      const data = { version: 1, imageId: 'img-001', pieceCount: 1, gridRows: 1, gridCols: 1, gridActiveCells: 1, pieces: [piece], seed: 42, id: 's1', difficulty: 'easy', phase: 'paused', startedAtEpochMs: null, elapsedMs: 0, moves: 0, hintsUsed: 0 };
      const result = hydrateSession(data, VALID_IMAGE_IDS);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Source index out of range');
      }
    });

    it('with invalid piece status fails', () => {
      const piece = { id: 'piece-0', sourceRow: 0, sourceCol: 0, sourceIndex: 0, status: 'invalid', trayOrder: 0, placedCellIndex: null, shapeTop: 0, shapeRight: 0, shapeBottom: 0, shapeLeft: 0 };
      const data = { version: 1, imageId: 'img-001', pieceCount: 1, gridRows: 1, gridCols: 1, gridActiveCells: 1, pieces: [piece], seed: 42, id: 's1', difficulty: 'easy', phase: 'paused', startedAtEpochMs: null, elapsedMs: 0, moves: 0, hintsUsed: 0 };
      const result = hydrateSession(data, VALID_IMAGE_IDS);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Invalid status');
      }
    });

    it('with piece count mismatch fails', () => {
      const piece = { id: 'piece-0', sourceRow: 0, sourceCol: 0, sourceIndex: 0, status: 'tray', trayOrder: 0, placedCellIndex: null, shapeTop: 0, shapeRight: 0, shapeBottom: 0, shapeLeft: 0 };
      const data = { version: 1, imageId: 'img-001', pieceCount: 5, gridRows: 1, gridCols: 1, gridActiveCells: 1, pieces: [piece], seed: 42, id: 's1', difficulty: 'easy', phase: 'paused', startedAtEpochMs: null, elapsedMs: 0, moves: 0, hintsUsed: 0 };
      const result = hydrateSession(data, VALID_IMAGE_IDS);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Invalid piece count');
      }
    });

    it('with negative elapsedMs fails', () => {
      const piece = { id: 'piece-0', sourceRow: 0, sourceCol: 0, sourceIndex: 0, status: 'tray', trayOrder: 0, placedCellIndex: null, shapeTop: 0, shapeRight: 0, shapeBottom: 0, shapeLeft: 0 };
      const data = { version: 1, imageId: 'img-001', pieceCount: 1, gridRows: 1, gridCols: 1, gridActiveCells: 1, pieces: [piece], seed: 42, id: 's1', difficulty: 'easy', phase: 'paused', startedAtEpochMs: null, elapsedMs: -1, moves: 0, hintsUsed: 0 };
      const result = hydrateSession(data, VALID_IMAGE_IDS);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Invalid elapsed time');
      }
    });
  });

  describe('round-trip', () => {
    it('serialize then hydrate recovers equivalent session', () => {
      const session = makeSession({
        pieces: {
          'piece-0': { id: 'piece-0', source: { row: 0, col: 0, index: 0 }, status: 'locked', trayOrder: null, placedCellIndex: 0, shape: defaultShape },
          'piece-1': { id: 'piece-1', source: { row: 0, col: 1, index: 1 }, status: 'tray', trayOrder: 0, placedCellIndex: null, shape: defaultShape },
        },
        pieceCount: 2,
        grid: { rows: 1, cols: 2, activeCells: 2 },
        moves: 5,
        hintsUsed: 2,
        elapsedMs: 30000,
      });
      const serialized = serializeSession(session);
      const json = JSON.stringify(serialized);
      const parsed = JSON.parse(json);
      const result = hydrateSession(parsed, VALID_IMAGE_IDS);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.session.id).toBe(session.id);
        expect(result.session.imageId).toBe(session.imageId);
        expect(result.session.moves).toBe(5);
        expect(result.session.hintsUsed).toBe(2);
        expect(result.session.elapsedMs).toBe(30000);
        expect(result.session.pieces['piece-0'].status).toBe('locked');
        expect(result.session.pieces['piece-1'].status).toBe('tray');
      }
    });
  });
});
