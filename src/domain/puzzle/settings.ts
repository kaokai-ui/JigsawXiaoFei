import type { ValidationResult, Difficulty, GameSettings } from './types';

export function validatePieceCount(input: unknown): ValidationResult {
  if (typeof input !== 'number' || !Number.isFinite(input)) {
    return { ok: false, error: '張數必須為整數' };
  }
  if (!Number.isInteger(input)) {
    return { ok: false, error: '張數不可為小數' };
  }
  if (input < 4) {
    return { ok: false, error: '張數不可少於 4' };
  }
  if (input > 100) {
    return { ok: false, error: '張數不可超過 100' };
  }
  return { ok: true, value: input };
}

export const DEFAULT_PIECE_COUNTS: Record<Difficulty, number> = {
  easy: 10,
  normal: 20,
  hard: 30,
};

export const DEFAULT_SETTINGS: GameSettings = {
  pieceCountByDifficulty: { easy: 10, normal: 20, hard: 30 },
  showReferenceOverlay: false,
  soundEnabled: true,
  hapticsEnabled: true,
  reducedMotionOverride: 'system' as const,
};
