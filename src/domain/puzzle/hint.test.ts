import { describe, it, expect } from 'vitest';
import { getHint } from './hint';
import { createSession } from './session';
import { createSeededRng } from './random';
import type { GameSession } from './types';

function makeSession(pieceCount = 10): GameSession {
  return createSession({
    imageId: 'test',
    imageAspectRatio: 1,
    difficulty: 'normal',
    pieceCount,
    seed: 42,
  });
}

describe('getHint', () => {
  it('returns a hint when pieces are unlocked', () => {
    const session = makeSession();
    const rng = createSeededRng(1);
    const hint = getHint(session, rng);
    expect(hint).not.toBeNull();
    expect(hint!.pieceId).toBeDefined();
    expect(hint!.targetCell).toBeDefined();
  });

  it('returns null when all pieces are locked', () => {
    const session = makeSession(4);
    const lockedPieces = Object.fromEntries(
      Object.entries(session.pieces).map(([id, piece]) => [
        id,
        { ...piece, status: 'locked' as const, trayOrder: null, placedCellIndex: piece.source.index },
      ]),
    );
    const completedSession = { ...session, pieces: lockedPieces };
    const rng = createSeededRng(1);
    const hint = getHint(completedSession, rng);
    expect(hint).toBeNull();
  });

  it('hint points to correct target cell (piece.source)', () => {
    const session = makeSession();
    const rng = createSeededRng(1);
    const hint = getHint(session, rng);
    expect(hint).not.toBeNull();
    const hintedPiece = session.pieces[hint!.pieceId];
    expect(hintedPiece).toBeDefined();
    expect(hint!.targetCell).toEqual(hintedPiece.source);
  });

  it('hint always refers to an unlocked piece', () => {
    const session = makeSession(10);
    const rng = createSeededRng(7);
    for (let i = 0; i < 20; i++) {
      const hint = getHint(session, rng);
      expect(hint).not.toBeNull();
      const piece = session.pieces[hint!.pieceId];
      expect(piece.status).not.toBe('locked');
    }
  });
});
