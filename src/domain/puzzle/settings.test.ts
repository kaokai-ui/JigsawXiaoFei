import { describe, it, expect } from 'vitest';
import { validatePieceCount } from './settings';

describe('validatePieceCount', () => {
  describe('valid inputs', () => {
    it('accepts boundary value 4', () => {
      expect(validatePieceCount(4)).toEqual({ ok: true, value: 4 });
    });

    it('accepts boundary value 100', () => {
      expect(validatePieceCount(100)).toEqual({ ok: true, value: 100 });
    });

    it('accepts interior value 10', () => {
      expect(validatePieceCount(10)).toEqual({ ok: true, value: 10 });
    });

    it('accepts interior value 50', () => {
      expect(validatePieceCount(50)).toEqual({ ok: true, value: 50 });
    });
  });

  describe('rejects non-finite numbers', () => {
    it('rejects null', () => {
      expect(validatePieceCount(null)).toEqual({ ok: false, error: expect.any(String) });
    });

    it('rejects undefined', () => {
      expect(validatePieceCount(undefined)).toEqual({ ok: false, error: expect.any(String) });
    });

    it('rejects NaN', () => {
      expect(validatePieceCount(NaN)).toEqual({ ok: false, error: expect.any(String) });
    });

    it('rejects Infinity', () => {
      expect(validatePieceCount(Infinity)).toEqual({ ok: false, error: expect.any(String) });
    });

    it('rejects -Infinity', () => {
      expect(validatePieceCount(-Infinity)).toEqual({ ok: false, error: expect.any(String) });
    });
  });

  describe('rejects non-numbers', () => {
    it('rejects string', () => {
      expect(validatePieceCount('10')).toEqual({ ok: false, error: expect.any(String) });
    });

    it('rejects boolean true', () => {
      expect(validatePieceCount(true as unknown)).toEqual({ ok: false, error: expect.any(String) });
    });

    it('rejects boolean false', () => {
      expect(validatePieceCount(false as unknown)).toEqual({ ok: false, error: expect.any(String) });
    });

    it('rejects object', () => {
      expect(validatePieceCount({} as unknown)).toEqual({ ok: false, error: expect.any(String) });
    });

    it('rejects array', () => {
      expect(validatePieceCount([10] as unknown)).toEqual({ ok: false, error: expect.any(String) });
    });
  });

  describe('rejects decimals', () => {
    it('rejects 1.5', () => {
      expect(validatePieceCount(1.5)).toEqual({ ok: false, error: expect.any(String) });
    });

    it('rejects 10.7', () => {
      expect(validatePieceCount(10.7)).toEqual({ ok: false, error: expect.any(String) });
    });
  });

  describe('rejects values below 4', () => {
    it('rejects 0', () => {
      expect(validatePieceCount(0)).toEqual({ ok: false, error: expect.any(String) });
    });

    it('rejects 1', () => {
      expect(validatePieceCount(1)).toEqual({ ok: false, error: expect.any(String) });
    });

    it('rejects 3', () => {
      expect(validatePieceCount(3)).toEqual({ ok: false, error: expect.any(String) });
    });

    it('rejects -5', () => {
      expect(validatePieceCount(-5)).toEqual({ ok: false, error: expect.any(String) });
    });
  });

  describe('rejects values above 100', () => {
    it('rejects 101', () => {
      expect(validatePieceCount(101)).toEqual({ ok: false, error: expect.any(String) });
    });

    it('rejects 200', () => {
      expect(validatePieceCount(200)).toEqual({ ok: false, error: expect.any(String) });
    });
  });
});
