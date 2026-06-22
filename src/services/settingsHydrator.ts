import type { GameSettings, Difficulty } from '../domain/puzzle/types';

const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];
const VALID_MOTION_VALUES = ['system', 'reduce', 'full'] as const;

function isPieceCountByDifficulty(v: unknown): v is Record<Difficulty, number> {
  if (!v || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  for (const d of VALID_DIFFICULTIES) {
    const val = obj[d];
    if (typeof val !== 'number' || !Number.isInteger(val) || val < 4 || val > 100) {
      return false;
    }
  }
  return true;
}

function isMotionValue(v: unknown): v is GameSettings['reducedMotionOverride'] {
  return typeof v === 'string' && (VALID_MOTION_VALUES as readonly string[]).includes(v);
}

export function hydrateSettings(data: unknown, defaults: GameSettings): GameSettings {
  if (!data || typeof data !== 'object') return defaults;

  const s = data as Record<string, unknown>;

  const result: GameSettings = { ...defaults };

  if (isPieceCountByDifficulty(s.pieceCountByDifficulty)) {
    result.pieceCountByDifficulty = s.pieceCountByDifficulty;
  }

  if (typeof s.showReferenceOverlay === 'boolean') {
    result.showReferenceOverlay = s.showReferenceOverlay;
  }

  if (typeof s.soundEnabled === 'boolean') {
    result.soundEnabled = s.soundEnabled;
  }

  if (typeof s.hapticsEnabled === 'boolean') {
    result.hapticsEnabled = s.hapticsEnabled;
  }

  if (isMotionValue(s.reducedMotionOverride)) {
    result.reducedMotionOverride = s.reducedMotionOverride;
  }

  return result;
}
