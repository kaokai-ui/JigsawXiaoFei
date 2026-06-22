import { create } from 'zustand';
import type {
  GameSession,
  PieceId,
  StartGameInput,
  PlacementOutcome,
  Hint,
  Point,
  GridCell,
  PieceBitmapAssetMap,
} from '../domain/puzzle/types';
import { createSession } from '../domain/puzzle/session';
import { attemptPlacePiece } from '../domain/puzzle/reducer';
import { getSnapCandidate } from '../domain/puzzle/hitTest';
import { getHint } from '../domain/puzzle/hint';
import { createSeededRng } from '../domain/puzzle/random';
import { calculateScore } from '../domain/scoring/calculateScore';
import {
  saveActiveSession,
  clearActiveSession,
  loadActiveSession,
} from '../services/storage';
import { hydrateSession } from '../services/gameStorage';
import { imageManifest } from '../generated/imageManifest';
import { playPlaceSound, playErrorSound, playCompleteSound } from '../services/audio';
import { vibrateSuccess, vibrateError } from '../services/haptics';
import { useSettingsStore } from './settingsStore';
import { useDragStore } from './dragStore';
import { useRecordsStore } from './recordsStore';
import { useUiStore } from './uiStore';

const PERSIST_DEBOUNCE_MS = 300;
const VALID_IMAGE_IDS = imageManifest.map((img) => img.id);

export type RestoreResult =
  | { ok: true; session: GameSession }
  | { ok: false; error: string };

interface GameActions {
  startGame: (input: StartGameInput) => void;
  restoreGame: (serialized: unknown) => RestoreResult;
  restoreFromStorage: () => RestoreResult;
  beginDrag: (pieceId: PieceId, pointerId: number, start: Point) => void;
  updateDrag: (point: Point) => void;
  endDrag: (point: Point) => PlacementOutcome;
  cancelDrag: () => void;
  selectPiece: (pieceId: PieceId | null) => void;
  tryPlaceSelected: (cellIndex: number) => PlacementOutcome;
  requestHint: () => Hint | null;
  clearHint: () => void;
  pause: () => void;
  resume: () => void;
  abandon: () => void;
  resetWithSameOptions: () => void;
  solidifyElapsed: () => void;
  setPieceBitmapState: (status: GameState['pieceBitmapStatus'], assets: PieceBitmapAssetMap | null) => void;
}

interface GameState {
  session: GameSession | null;
  lastStartedPerfNow: number | null;
  pieceBitmapAssets: PieceBitmapAssetMap | null;
  pieceBitmapStatus: 'idle' | 'loading' | 'ready' | 'error';
}

export type GameStore = GameState & GameActions;

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedPersist(session: GameSession): void {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
  }
  persistTimer = setTimeout(() => {
    saveActiveSession(session);
    persistTimer = null;
  }, PERSIST_DEBOUNCE_MS);
}

function flushPersist(): void {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  session: null,
  lastStartedPerfNow: null,
  pieceBitmapAssets: null,
  pieceBitmapStatus: 'idle',

  startGame: (input: StartGameInput) => {
    const session = createSession(input);
    const now = performance.now();
    useUiStore.getState().clearUi();
    set({
      session,
      lastStartedPerfNow: now,
      pieceBitmapAssets: null,
      pieceBitmapStatus: 'idle',
    });
    saveActiveSession(session);
  },

  restoreGame: (serialized: unknown): RestoreResult => {
    const result = hydrateSession(serialized, VALID_IMAGE_IDS);
    if (!result.ok) {
      clearActiveSession();
      return result;
    }
    const session = { ...result.session };
    if (session.phase === 'playing') {
      session.phase = 'paused' as const;
    }
    useUiStore.getState().clearUi();
    set({
      session,
      lastStartedPerfNow: null,
      pieceBitmapAssets: null,
      pieceBitmapStatus: 'idle',
    });
    return { ok: true, session };
  },

  restoreFromStorage: (): RestoreResult => {
    const serialized = loadActiveSession();
    if (!serialized) {
      return { ok: false, error: 'No saved session' };
    }
    return get().restoreGame(serialized);
  },

  beginDrag: (pieceId: PieceId, pointerId: number, start: Point) => {
    const { session } = get();
    if (!session || session.phase !== 'playing') return;
    const piece = session.pieces[pieceId];
    if (!piece || piece.status !== 'tray') return;

    const updatedPieces = {
      ...session.pieces,
      [pieceId]: { ...piece, status: 'dragging' as const, trayOrder: null },
    };
    const updatedSession: GameSession = { ...session, pieces: updatedPieces };

    useDragStore.getState().setActiveDrag({ pieceId, pointerId, point: start });
    set({ session: updatedSession });
    useUiStore.getState().selectPiece(null);
  },

  updateDrag: (point: Point) => {
    useDragStore.getState().setDragPoint(point);
  },

  endDrag: (point: Point): PlacementOutcome => {
    get().solidifyElapsed();
    const { session } = get();
    const boardRect = useUiStore.getState().boardRect;
    if (!session || session.phase !== 'playing') {
      useDragStore.getState().clearDrag();
      const s = get().session;
      return { kind: 'ignored', session: s!, reason: 'not-draggable' };
    }

    const dragState = useDragStore.getState().activeDrag;
    if (!dragState) {
      return { kind: 'ignored', session, reason: 'not-draggable' };
    }

    const { pieceId } = dragState;
    useDragStore.getState().clearDrag();

    const cell = boardRect
      ? getSnapCandidate(point, boardRect, session.grid)
      : null;

    const outcome = attemptPlacePiece(session, pieceId, cell);
    const settings = useSettingsStore.getState();

    if (outcome.kind === 'locked') {
      if (settings.soundEnabled) playPlaceSound();
      if (settings.hapticsEnabled) vibrateSuccess();
    } else if (outcome.kind === 'incorrect') {
      if (settings.soundEnabled) playErrorSound();
      if (settings.hapticsEnabled) vibrateError();
    }

    const updates: Partial<GameState> = { session: outcome.session };

    if (outcome.session.phase === 'completed') {
      updates.lastStartedPerfNow = null;
      applyCompletionSideEffects(outcome.session);
      flushPersist();
      clearActiveSession();
    } else {
      debouncedPersist(outcome.session);
    }

    set(updates);

    return outcome;
  },

  cancelDrag: () => {
    const { session } = get();
    if (!session) return;

    const dragState = useDragStore.getState().activeDrag;
    if (!dragState) return;

    useDragStore.getState().clearDrag();

    const { pieceId } = dragState;
    const piece = session.pieces[pieceId];
    if (!piece || piece.status !== 'dragging') return;

    const maxTrayOrder = Math.max(
      0,
      ...Object.values(session.pieces)
        .filter((p) => p.status === 'tray' && p.trayOrder !== null)
        .map((p) => p.trayOrder as number),
    );

    const updatedPieces = {
      ...session.pieces,
      [pieceId]: {
        ...piece,
        status: 'tray' as const,
        trayOrder: maxTrayOrder + 1,
        placedCellIndex: null,
      },
    };
    const updatedSession: GameSession = { ...session, pieces: updatedPieces };

    set({ session: updatedSession });
  },

  selectPiece: (pieceId: PieceId | null) => {
    const { session } = get();
    if (!session || session.phase !== 'playing') return;
    if (pieceId !== null) {
      useDragStore.getState().clearDrag();
    }
    useUiStore.getState().selectPiece(pieceId);
  },

  tryPlaceSelected: (cellIndex: number): PlacementOutcome => {
    get().solidifyElapsed();
    const { session } = get();
    const selectedPieceId = useUiStore.getState().selectedPieceId;
    if (!session || session.phase !== 'playing' || !selectedPieceId) {
      return { kind: 'ignored', session: session!, reason: 'not-draggable' };
    }

    const piece = session.pieces[selectedPieceId];
    if (!piece || piece.status !== 'tray') {
      return { kind: 'ignored', session, reason: 'not-draggable' };
    }

    const draggingPieces = {
      ...session.pieces,
      [selectedPieceId]: { ...piece, status: 'dragging' as const, trayOrder: null },
    };
    const sessionWithDragging: GameSession = { ...session, pieces: draggingPieces };

    const row = Math.floor(cellIndex / session.grid.cols);
    const col = cellIndex % session.grid.cols;
    const candidateCell: GridCell = { row, col, index: cellIndex };

    const outcome = attemptPlacePiece(sessionWithDragging, selectedPieceId, candidateCell);
    const settings = useSettingsStore.getState();

    if (outcome.kind === 'locked') {
      if (settings.soundEnabled) playPlaceSound();
      if (settings.hapticsEnabled) vibrateSuccess();
    } else if (outcome.kind === 'incorrect') {
      if (settings.soundEnabled) playErrorSound();
      if (settings.hapticsEnabled) vibrateError();
    }

    const updates: Partial<GameState> = {
      session: outcome.session,
    };
    useUiStore.getState().selectPiece(null);

    if (outcome.session.phase === 'completed') {
      updates.lastStartedPerfNow = null;
      applyCompletionSideEffects(outcome.session);
      flushPersist();
      clearActiveSession();
    } else {
      debouncedPersist(outcome.session);
    }

    set(updates);

    return outcome;
  },

  requestHint: (): Hint | null => {
    const { session } = get();
    if (!session || session.phase !== 'playing') return null;

    const rng = createSeededRng(session.seed + session.hintsUsed + 1);
    const hint = getHint(session, rng);
    if (!hint) return null;

    const updatedSession: GameSession = {
      ...session,
      hintsUsed: session.hintsUsed + 1,
    };

    set({ session: updatedSession });
    useUiStore.getState().setHintCellIndex(hint.targetCell.index);
    debouncedPersist(updatedSession);

    return hint;
  },

  clearHint: () => {
    useUiStore.getState().setHintCellIndex(null);
  },

  pause: () => {
    get().solidifyElapsed();
    const session = get().session;
    if (!session || session.phase !== 'playing') return;

    const pausedSession: GameSession = { ...session, phase: 'paused' };
    set({
      session: pausedSession,
      lastStartedPerfNow: null,
    });
    useUiStore.getState().setHintCellIndex(null);
    flushPersist();
    saveActiveSession(pausedSession);
  },

  resume: () => {
    const { session } = get();
    if (!session || session.phase !== 'paused') return;

    const resumedSession: GameSession = { ...session, phase: 'playing' };
    set({
      session: resumedSession,
      lastStartedPerfNow: performance.now(),
    });
    useUiStore.getState().setHintCellIndex(null);
    flushPersist();
    saveActiveSession(resumedSession);
  },

  abandon: () => {
    flushPersist();
    clearActiveSession();
    set({
      session: null,
      lastStartedPerfNow: null,
      pieceBitmapAssets: null,
      pieceBitmapStatus: 'idle',
    });
    useUiStore.getState().clearUi();
    useDragStore.getState().clearDrag();
  },

  resetWithSameOptions: () => {
    const { session } = get();
    if (!session) return;
    const img = imageManifest.find((m) => m.id === session.imageId);
    const imageAspectRatio = img?.aspectRatio ?? (session.grid.cols / session.grid.rows);
    const input: StartGameInput = {
      imageId: session.imageId,
      imageAspectRatio,
      difficulty: session.difficulty,
      pieceCount: session.pieceCount,
    };
    get().startGame(input);
  },

  solidifyElapsed: () => {
    const { session, lastStartedPerfNow } = get();
    if (!session || session.phase !== 'playing' || lastStartedPerfNow === null) return;

    const now = performance.now();
    const delta = now - lastStartedPerfNow;
    set({
      session: { ...session, elapsedMs: session.elapsedMs + delta },
      lastStartedPerfNow: now,
    });
  },

  setPieceBitmapState: (status, assets) => {
    set({
      pieceBitmapStatus: status,
      pieceBitmapAssets: assets,
    });
  },
}));

function applyCompletionSideEffects(session: GameSession): void {
  const score = calculateScore({
    pieceCount: session.pieceCount,
    elapsedMs: session.elapsedMs,
    moves: session.moves,
    hintsUsed: session.hintsUsed,
  });

  const settings = useSettingsStore.getState();
  if (settings.soundEnabled) playCompleteSound();
  if (settings.hapticsEnabled) vibrateSuccess();

  const recordKey = `${session.imageId}:${session.difficulty}:${session.pieceCount}`;
  useRecordsStore.getState().maybeUpdateRecord(
    recordKey,
    score,
    session.elapsedMs,
    session.moves,
    session.hintsUsed,
  );
}
