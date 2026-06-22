import { create } from 'zustand';
import type { PieceId } from '../domain/puzzle/types';
import type { BoardRect } from '../domain/puzzle/hitTest';

interface UiRuntimeState {
  selectedPieceId: PieceId | null;
  boardRect: BoardRect | null;
  hintCellIndex: number | null;
  showReferencePreview: boolean;
}

interface UiRuntimeActions {
  selectPiece: (pieceId: PieceId | null) => void;
  setBoardRect: (rect: BoardRect | null) => void;
  setHintCellIndex: (index: number | null) => void;
  setShowReferencePreview: (value: boolean) => void;
  clearUi: () => void;
}

export type UiRuntimeStore = UiRuntimeState & UiRuntimeActions;

export const useUiStore = create<UiRuntimeStore>((set) => ({
  selectedPieceId: null,
  boardRect: null,
  hintCellIndex: null,
  showReferencePreview: true,

  selectPiece: (pieceId) => set({ selectedPieceId: pieceId }),
  setBoardRect: (rect) => set({ boardRect: rect }),
  setHintCellIndex: (index) => set({ hintCellIndex: index }),
  setShowReferencePreview: (value) => set({ showReferencePreview: value }),
  clearUi: () => set({ selectedPieceId: null, boardRect: null, hintCellIndex: null, showReferencePreview: true }),
}));
