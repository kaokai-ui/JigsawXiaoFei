import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createSession } from '../../domain/puzzle/session';
import { useGameStore } from '../../stores/gameStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';
import { useDragStore } from '../../stores/dragStore';
import { PuzzleBoard } from './PuzzleBoard';

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    disconnect() {}
  }

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: ResizeObserverMock,
  });
});

afterEach(() => {
  useGameStore.getState().abandon();
  useSettingsStore.getState().resetToDefaults();
  useUiStore.getState().clearUi();
  useDragStore.getState().clearDrag();
});

function seedBoard(showReferenceOverlay: boolean, showReferencePreview = true) {
  const session = createSession({
    imageId: '005',
    imageAspectRatio: 1,
    difficulty: 'easy',
    pieceCount: 9,
    seed: 7,
  });

  const [pieceId] = Object.keys(session.pieces) as Array<keyof typeof session.pieces>;
  useGameStore.setState({
    session,
    lastStartedPerfNow: null,
    pieceBitmapStatus: 'ready',
    pieceBitmapAssets: {
      [pieceId]: {
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9p2YMB0AAAAASUVORK5CYII=',
        width: 1,
        height: 1,
      },
    },
  });
  useUiStore.setState({ selectedPieceId: pieceId, boardRect: null, hintCellIndex: null, showReferencePreview });
  useSettingsStore.setState({ showReferenceOverlay });
}

describe('PuzzleBoard', () => {
  it('always shows the reference image beside the board', () => {
    seedBoard(false);

    const { container } = render(<PuzzleBoard />);

    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(1);
    expect(images[0]?.getAttribute('src')).toBe('images/005.webp');
  });

  it('renders board ghost imagery only when the setting is enabled', () => {
    seedBoard(false);
    const firstRender = render(<PuzzleBoard />);
    expect(firstRender.container.querySelectorAll('img')).toHaveLength(1);
    firstRender.unmount();

    seedBoard(true);
    const secondRender = render(<PuzzleBoard />);
    expect(secondRender.container.querySelectorAll('img')).toHaveLength(2);
  });

  it('hides the reference preview when the topbar toggle state is off', () => {
    seedBoard(false, false);

    const { container } = render(<PuzzleBoard />);

    expect(container.querySelectorAll('img')).toHaveLength(0);
  });
});
