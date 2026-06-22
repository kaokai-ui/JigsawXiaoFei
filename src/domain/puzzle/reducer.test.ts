import { describe, it, expect } from 'vitest';
import { attemptPlacePiece } from './reducer';
import { createSession } from './session';
import type { GameSession, PieceId } from './types';

function makePlayingSession(pieceCount = 4): GameSession {
  return createSession({
    imageId: 'test',
    imageAspectRatio: 1,
    difficulty: 'normal',
    pieceCount,
    seed: 42,
  });
}

function setDragging(session: GameSession, pieceId: PieceId): GameSession {
  return {
    ...session,
    pieces: {
      ...session.pieces,
      [pieceId]: { ...session.pieces[pieceId], status: 'dragging' },
    },
  };
}

describe('attemptPlacePiece', () => {
  it('correct cell → locked', () => {
    let session = makePlayingSession(4);
    const pieceIds = Object.keys(session.pieces) as PieceId[];
    const piece = session.pieces[pieceIds[0]];
    session = setDragging(session, pieceIds[0]);

    const outcome = attemptPlacePiece(session, pieceIds[0], piece.source);
    expect(outcome.kind).toBe('locked');
    if (outcome.kind === 'locked') {
      expect(outcome.session.pieces[pieceIds[0]].status).toBe('locked');
      expect(outcome.session.pieces[pieceIds[0]].placedCellIndex).toBe(piece.source.index);
    }
  });

  it('wrong cell → incorrect, piece back to tray', () => {
    let session = makePlayingSession(4);
    const pieceIds = Object.keys(session.pieces) as PieceId[];
    const piece = session.pieces[pieceIds[0]];
    session = setDragging(session, pieceIds[0]);

    const wrongCell = { ...piece.source, index: (piece.source.index + 1) % 4 };
    const outcome = attemptPlacePiece(session, pieceIds[0], wrongCell);
    expect(outcome.kind).toBe('incorrect');
    if (outcome.kind === 'incorrect') {
      expect(outcome.reason).toBe('wrong-cell');
      expect(outcome.session.pieces[pieceIds[0]].status).toBe('tray');
    }
  });

  it('locked piece → ignored', () => {
    let session = makePlayingSession(4);
    const pieceIds = Object.keys(session.pieces) as PieceId[];
    const piece = session.pieces[pieceIds[0]];
    session = {
      ...session,
      pieces: {
        ...session.pieces,
        [pieceIds[0]]: {
          ...piece,
          status: 'locked',
          placedCellIndex: piece.source.index,
          trayOrder: null,
        },
      },
    };

    const outcome = attemptPlacePiece(session, pieceIds[0], piece.source);
    expect(outcome.kind).toBe('ignored');
  });

  it('non-dragging piece (tray) → ignored', () => {
    const session = makePlayingSession(4);
    const pieceIds = Object.keys(session.pieces) as PieceId[];
    const piece = session.pieces[pieceIds[0]];

    const outcome = attemptPlacePiece(session, pieceIds[0], piece.source);
    expect(outcome.kind).toBe('ignored');
  });

  it('placing on already occupied cell → incorrect', () => {
    let session = makePlayingSession(4);
    const pieceIds = Object.keys(session.pieces) as PieceId[];
    const piece0 = session.pieces[pieceIds[0]];

    session = setDragging(session, pieceIds[0]);
    const lockOutcome = attemptPlacePiece(session, pieceIds[0], piece0.source);
    if (lockOutcome.kind !== 'locked') throw new Error('expected locked');
    session = lockOutcome.session;

    session = setDragging(session, pieceIds[1]);
    const outcome = attemptPlacePiece(session, pieceIds[1], piece0.source);
    expect(outcome.kind).toBe('incorrect');
    if (outcome.kind === 'incorrect') {
      expect(outcome.reason).toBe('wrong-cell');
    }
  });

  it('null cell (outside board) → incorrect with reason outside', () => {
    let session = makePlayingSession(4);
    const pieceIds = Object.keys(session.pieces) as PieceId[];
    session = setDragging(session, pieceIds[0]);

    const outcome = attemptPlacePiece(session, pieceIds[0], null);
    expect(outcome.kind).toBe('incorrect');
    if (outcome.kind === 'incorrect') {
      expect(outcome.reason).toBe('outside');
    }
  });

  it('moves increment on each attempt', () => {
    let session = makePlayingSession(4);
    const pieceIds = Object.keys(session.pieces) as PieceId[];
    const piece0 = session.pieces[pieceIds[0]];

    session = setDragging(session, pieceIds[0]);
    const outcome = attemptPlacePiece(session, pieceIds[0], piece0.source);
    expect(outcome.session.moves).toBe(1);
  });

  it('last piece locked → phase becomes completed', () => {
    let session = makePlayingSession(4);
    const pieceIds = Object.keys(session.pieces) as PieceId[];

    for (let i = 0; i < pieceIds.length; i++) {
      session = setDragging(session, pieceIds[i]);
      const piece = session.pieces[pieceIds[i]];
      const outcome = attemptPlacePiece(session, pieceIds[i], piece.source);
      if (outcome.kind === 'locked' || outcome.kind === 'incorrect') {
        session = outcome.session;
      }
      if (outcome.kind === 'incorrect') {
        i--;
      }
    }

    expect(session.phase).toBe('completed');
  });
});
