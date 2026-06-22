import { describe, it, expect } from 'vitest';
import { hydrateSettings } from './settingsHydrator';
import type { GameSettings } from '../domain/puzzle/types';

const DEFAULTS: GameSettings = {
  pieceCountByDifficulty: { easy: 10, normal: 20, hard: 30 },
  showReferenceOverlay: false,
  soundEnabled: true,
  hapticsEnabled: true,
  reducedMotionOverride: 'system',
};

describe('hydrateSettings', () => {
  it('returns defaults for null input', () => {
    expect(hydrateSettings(null, DEFAULTS)).toEqual(DEFAULTS);
  });

  it('returns defaults for non-object input', () => {
    expect(hydrateSettings('bad', DEFAULTS)).toEqual(DEFAULTS);
  });

  it('returns defaults when all fields are valid', () => {
    const valid = { ...DEFAULTS };
    expect(hydrateSettings(valid, DEFAULTS)).toEqual(DEFAULTS);
  });

  it('uses defaults for invalid pieceCountByDifficulty', () => {
    const data = { pieceCountByDifficulty: null };
    const result = hydrateSettings(data, DEFAULTS);
    expect(result.pieceCountByDifficulty).toEqual(DEFAULTS.pieceCountByDifficulty);
  });

  it('uses defaults for out-of-range piece count', () => {
    const data = { pieceCountByDifficulty: { easy: 3, normal: 20, hard: 30 } };
    const result = hydrateSettings(data, DEFAULTS);
    expect(result.pieceCountByDifficulty).toEqual(DEFAULTS.pieceCountByDifficulty);
  });

  it('uses defaults for non-boolean showReferenceOverlay', () => {
    const data = { showReferenceOverlay: 'yes' };
    const result = hydrateSettings(data, DEFAULTS);
    expect(result.showReferenceOverlay).toBe(false);
  });

  it('uses defaults for invalid reducedMotionOverride', () => {
    const data = { reducedMotionOverride: 'invalid' };
    const result = hydrateSettings(data, DEFAULTS);
    expect(result.reducedMotionOverride).toBe('system');
  });

  it('accepts valid partial override', () => {
    const data = { soundEnabled: false, hapticsEnabled: false };
    const result = hydrateSettings(data, DEFAULTS);
    expect(result.soundEnabled).toBe(false);
    expect(result.hapticsEnabled).toBe(false);
    expect(result.showReferenceOverlay).toBe(false);
    expect(result.pieceCountByDifficulty).toEqual(DEFAULTS.pieceCountByDifficulty);
  });

  it('discards unknown fields', () => {
    const data = { ...DEFAULTS, unknownField: 123 };
    const result = hydrateSettings(data, DEFAULTS);
    expect((result as unknown as Record<string, unknown>).unknownField).toBeUndefined();
  });
});
