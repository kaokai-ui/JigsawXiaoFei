import { create } from 'zustand';
import type { Point, PieceId } from '../domain/puzzle/types';

interface DragState {
  activeDrag: {
    pieceId: PieceId;
    pointerId: number;
    point: Point;
  } | null;
  setDragPoint: (point: Point) => void;
  setActiveDrag: (drag: DragState['activeDrag']) => void;
  clearDrag: () => void;
}

export const useDragStore = create<DragState>((set) => ({
  activeDrag: null,
  setDragPoint: (point) =>
    set((state) =>
      state.activeDrag ? { activeDrag: { ...state.activeDrag, point } } : state,
    ),
  setActiveDrag: (drag) => set({ activeDrag: drag }),
  clearDrag: () => set({ activeDrag: null }),
}));
