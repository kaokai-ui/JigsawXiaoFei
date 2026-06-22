import type { GameSession, PieceId, PlacementOutcome, GridCell } from './types';
import { isSessionComplete } from './session';

export function attemptPlacePiece(
  session: GameSession,
  pieceId: PieceId,
  cell: GridCell | null,
): PlacementOutcome {
  const piece = session.pieces[pieceId];

  if (!piece || piece.status !== 'dragging') {
    return { kind: 'ignored', session, reason: 'not-draggable' };
  }

  if (!cell) {
    const newSession = returnPieceToTray(session, pieceId);
    newSession.moves += 1;
    return { kind: 'incorrect', session: newSession, reason: 'outside' };
  }

  const alreadyOccupied = Object.values(session.pieces).some(
    p => p.status === 'locked' && p.placedCellIndex === cell.index,
  );
  if (alreadyOccupied) {
    const newSession = returnPieceToTray(session, pieceId);
    newSession.moves += 1;
    return { kind: 'incorrect', session: newSession, reason: 'wrong-cell' };
  }

  if (piece.source.index === cell.index) {
    const newSession: GameSession = {
      ...session,
      pieces: {
        ...session.pieces,
        [pieceId]: {
          ...piece,
          status: 'locked',
          placedCellIndex: cell.index,
          trayOrder: null,
        },
      },
      moves: session.moves + 1,
    };

    if (isSessionComplete(newSession)) {
      newSession.phase = 'completed';
    }

    return { kind: 'locked', session: newSession, cell };
  }

  const newSession = returnPieceToTray(session, pieceId);
  newSession.moves += 1;
  return { kind: 'incorrect', session: newSession, reason: 'wrong-cell' };
}

function returnPieceToTray(session: GameSession, pieceId: PieceId): GameSession {
  const piece = session.pieces[pieceId];
  const maxTrayOrder = Math.max(
    0,
    ...Object.values(session.pieces)
      .filter(p => p.status === 'tray' && p.trayOrder !== null)
      .map(p => p.trayOrder as number),
  );

  return {
    ...session,
    pieces: {
      ...session.pieces,
      [pieceId]: {
        ...piece,
        status: 'tray',
        trayOrder: maxTrayOrder + 1,
        placedCellIndex: null,
      },
    },
  };
}
