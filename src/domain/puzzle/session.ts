import type { GameSession, GamePhase, Piece, PieceId, StartGameInput } from './types';
import { chooseGridSpec, createTargetCells } from './grid';
import { createSeededRng, shuffleInPlaceCopy, generateSeed } from './random';
import { createPieceShapes } from './shapes';

export function createSession(input: StartGameInput): GameSession {
  const seed = input.seed ?? generateSeed();
  const rng = createSeededRng(seed);

  const grid = chooseGridSpec(input.pieceCount, input.imageAspectRatio);
  const targetCells = createTargetCells(grid);
  const pieceShapes = createPieceShapes(grid, seed);

  const shuffledCells = shuffleInPlaceCopy(targetCells, rng);

  const isSameOrder = shuffledCells.every((c, i) => c.index === targetCells[i].index);
  const finalOrder = isSameOrder ? shuffleInPlaceCopy(targetCells, createSeededRng(seed + 1)) : shuffledCells;

  const pieces: Record<PieceId, Piece> = {};
  finalOrder.forEach((cell, i) => {
    const id: PieceId = `piece-${i}`;
    const sourceIndex = cell.index;
    pieces[id] = {
      id,
      source: cell,
      status: 'tray',
      trayOrder: i,
      placedCellIndex: null,
      shape: pieceShapes[sourceIndex],
    };
  });

  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${seed}`,
    imageId: input.imageId,
    difficulty: input.difficulty,
    pieceCount: input.pieceCount,
    grid,
    pieces,
    phase: 'playing' as GamePhase,
    startedAtEpochMs: Date.now(),
    elapsedMs: 0,
    moves: 0,
    hintsUsed: 0,
    seed,
    version: 1,
  };
}

export function isSessionComplete(session: GameSession): boolean {
  return Object.values(session.pieces).every(p => p.status === 'locked');
}
