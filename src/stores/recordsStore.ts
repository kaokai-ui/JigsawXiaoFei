import { create } from 'zustand';
import type { BestRecord } from '../domain/puzzle/types';
import { loadRecords, updateBestRecord } from '../services/storage';

interface RecordsState {
  records: Record<string, BestRecord>;
}

interface RecordsActions {
  initialize: () => void;
  maybeUpdateRecord: (
    key: string,
    score: number,
    elapsedMs: number,
    moves: number,
    hintsUsed: number,
  ) => boolean;
}

export type RecordsStore = RecordsState & RecordsActions;

export const useRecordsStore = create<RecordsStore>((set) => ({
  records: {},

  initialize: () => {
    const records = loadRecords();
    set({ records });
  },

  maybeUpdateRecord: (key, score, elapsedMs, moves, hintsUsed) => {
    const isNew = updateBestRecord(key, {
      score,
      elapsedMs,
      moves,
      hintsUsed,
      completedAtEpochMs: Date.now(),
    });
    if (isNew) {
      set({ records: loadRecords() });
    }
    return isNew;
  },
}));
