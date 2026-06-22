import { describe, it, expect } from 'vitest';
import { createSession, isSessionComplete } from './session';
import type { StartGameInput, PieceId } from './types';

function makeInput(overrides: Partial<StartGameInput> = {}): StartGameInput {
  return {
    imageId: 'test-image',
    imageAspectRatio: 1,
    difficulty: 'normal',
    pieceCount: 10,
    seed: 42,
    ...overrides,
  };
}

describe('createSession', () => {
  it('creates correct number of pieces', () => {
    const session = createSession(makeInput({ pieceCount: 10 }));
    expect(Object.keys(session.pieces)).toHaveLength(10);
  });

  it('each piece has unique source.index', () => {
    const session = createSession(makeInput({ pieceCount: 15 }));
    const indices = Object.values(session.pieces).map(p => p.source.index);
    expect(new Set(indices).size).toBe(indices.length);
  });

  it('all pieces start in tray status', () => {
    const session = createSession(makeInput());
    const allTray = Object.values(session.pieces).every(p => p.status === 'tray');
    expect(allTray).toBe(true);
  });

  it('no pieces start as dragging', () => {
    const session = createSession(makeInput());
    const anyDragging = Object.values(session.pieces).some(p => p.status === 'dragging');
    expect(anyDragging).toBe(false);
  });

  it('tray orders are 0 to N-1', () => {
    const session = createSession(makeInput({ pieceCount: 10 }));
    const trayOrders = Object.values(session.pieces)
      .map(p => p.trayOrder as number)
      .sort((a, b) => a - b);
    expect(trayOrders).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('sets phase to playing', () => {
    const session = createSession(makeInput());
    expect(session.phase).toBe('playing');
  });

  it('uses provided seed', () => {
    const session = createSession(makeInput({ seed: 99 }));
    expect(session.seed).toBe(99);
  });

  it('sets moves and hintsUsed to 0', () => {
    const session = createSession(makeInput());
    expect(session.moves).toBe(0);
    expect(session.hintsUsed).toBe(0);
  });
});

describe('isSessionComplete', () => {
  it('returns false initially', () => {
    const session = createSession(makeInput());
    expect(isSessionComplete(session)).toBe(false);
  });

  it('returns true when all pieces are locked', () => {
    const session = createSession(makeInput({ pieceCount: 4 }));
    const lockedPieces = Object.fromEntries(
      Object.entries(session.pieces).map(([id, piece]) => [
        id,
        { ...piece, status: 'locked' as const, trayOrder: null, placedCellIndex: piece.source.index },
      ]),
    );
    const completedSession = { ...session, pieces: lockedPieces };
    expect(isSessionComplete(completedSession)).toBe(true);
  });

  it('returns false when some pieces are still in tray', () => {
    const session = createSession(makeInput({ pieceCount: 4 }));
    const pieceIds = Object.keys(session.pieces) as PieceId[];
    const firstId = pieceIds[0];
    const partialLock = {
      ...session.pieces,
      [firstId]: {
        ...session.pieces[firstId],
        status: 'locked' as const,
        trayOrder: null,
        placedCellIndex: session.pieces[firstId].source.index,
      },
    };
    const partialSession = { ...session, pieces: partialLock };
    expect(isSessionComplete(partialSession)).toBe(false);
  });
});
