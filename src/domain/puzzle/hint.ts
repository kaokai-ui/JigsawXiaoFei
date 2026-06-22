import type { GameSession, Hint } from './types';

export function getHint(session: GameSession, rng: () => number): Hint | null {
  const unlockedPieces = Object.values(session.pieces).filter(p => p.status !== 'locked');

  if (unlockedPieces.length === 0) return null;

  const idx = Math.floor(rng() * unlockedPieces.length);
  const piece = unlockedPieces[idx];

  return {
    pieceId: piece.id,
    targetCell: piece.source,
  };
}
