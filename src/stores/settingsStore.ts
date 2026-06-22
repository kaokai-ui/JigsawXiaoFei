import { create } from 'zustand';
import type { GameSettings, Difficulty } from '../domain/puzzle/types';
import { validatePieceCount } from '../domain/puzzle/settings';
import { loadSettings, saveSettings } from '../services/storage';
import { hydrateSettings } from '../services/settingsHydrator';

const DEFAULT_SETTINGS: GameSettings = {
  pieceCountByDifficulty: { easy: 10, normal: 20, hard: 30 },
  showReferenceOverlay: false,
  soundEnabled: true,
  hapticsEnabled: true,
  reducedMotionOverride: 'system',
};

interface SettingsActions {
  initialize: () => void;
  setPieceCount: (difficulty: Difficulty, count: number) => string | null;
  setShowReferenceOverlay: (value: boolean) => void;
  setSoundEnabled: (value: boolean) => void;
  setHapticsEnabled: (value: boolean) => void;
  setReducedMotionOverride: (value: GameSettings['reducedMotionOverride']) => void;
  resetToDefaults: () => void;
}

export type SettingsStore = GameSettings & SettingsActions;

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,

  initialize: () => {
    const saved = loadSettings();
    if (saved) {
      const hydrated = hydrateSettings(saved, DEFAULT_SETTINGS);
      set(hydrated);
    }
  },

  setPieceCount: (difficulty: Difficulty, count: number) => {
    const result = validatePieceCount(count);
    if (!result.ok) return result.error;
    const newCounts = { ...get().pieceCountByDifficulty, [difficulty]: result.value };
    const newState = { pieceCountByDifficulty: newCounts };
    set(newState);
    saveSettings({ ...get(), ...newState });
    return null;
  },

  setShowReferenceOverlay: (value: boolean) => {
    set({ showReferenceOverlay: value });
    saveSettings({ ...get(), showReferenceOverlay: value });
  },

  setSoundEnabled: (value: boolean) => {
    set({ soundEnabled: value });
    saveSettings({ ...get(), soundEnabled: value });
  },

  setHapticsEnabled: (value: boolean) => {
    set({ hapticsEnabled: value });
    saveSettings({ ...get(), hapticsEnabled: value });
  },

  setReducedMotionOverride: (value: GameSettings['reducedMotionOverride']) => {
    set({ reducedMotionOverride: value });
    saveSettings({ ...get(), reducedMotionOverride: value });
  },

  resetToDefaults: () => {
    set(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  },
}));
