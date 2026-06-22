import type { GameSettings, BestRecord } from '../domain/puzzle/types';
import { serializeSession, type SerializedSession } from './gameStorage';

const KEYS = {
  settings: 'jigsaw:settings:v1',
  activeSession: 'jigsaw:active-session:v1',
  records: 'jigsaw:records:v1',
} as const;

function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function loadSettings(): GameSettings | null {
  const raw = localStorage.getItem(KEYS.settings);
  return safeJsonParse<GameSettings | null>(raw, null);
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  } catch {
    console.warn('Failed to save settings to localStorage');
  }
}

export function loadActiveSession(): SerializedSession | null {
  const raw = localStorage.getItem(KEYS.activeSession);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SerializedSession;
  } catch {
    return null;
  }
}

export function saveActiveSession(session: Parameters<typeof serializeSession>[0]): void {
  try {
    const serialized = serializeSession(session);
    localStorage.setItem(KEYS.activeSession, JSON.stringify(serialized));
  } catch {
    console.warn('Failed to save session to localStorage');
  }
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(KEYS.activeSession);
  } catch {
    // ignore
  }
}

export function loadRecords(): Record<string, BestRecord> {
  const raw = localStorage.getItem(KEYS.records);
  return safeJsonParse<Record<string, BestRecord>>(raw, {});
}

export function saveRecords(records: Record<string, BestRecord>): void {
  try {
    localStorage.setItem(KEYS.records, JSON.stringify(records));
  } catch {
    console.warn('Failed to save records to localStorage');
  }
}

export function updateBestRecord(key: string, result: { score: number; elapsedMs: number; moves: number; hintsUsed: number; completedAtEpochMs: number }): boolean {
  const records = loadRecords();
  const existing = records[key];
  if (!existing || result.score > existing.score) {
    records[key] = result;
    saveRecords(records);
    return true;
  }
  return false;
}
