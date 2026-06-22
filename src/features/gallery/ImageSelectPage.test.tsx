import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

async function loadImageSelectPage() {
  const pageModule = await import('./ImageSelectPage');
  const gameStoreModule = await import('../../stores/gameStore');
  const settingsStoreModule = await import('../../stores/settingsStore');

  return {
    ImageSelectPage: pageModule.ImageSelectPage,
    useGameStore: gameStoreModule.useGameStore,
    useSettingsStore: settingsStoreModule.useSettingsStore,
  };
}

describe('ImageSelectPage', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('shows an empty state when no images are available', async () => {
    vi.doMock('../../generated/imageManifest', () => ({
      imageManifest: [],
      __esModule: true,
    }));

    const { ImageSelectPage } = await loadImageSelectPage();

    render(
      <BrowserRouter>
        <ImageSelectPage />
      </BrowserRouter>,
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });

  it('shows image cards when images exist', async () => {
    vi.doMock('../../generated/imageManifest', async (importOriginal) => {
      const original = await importOriginal<typeof import('../../generated/imageManifest')>();
      return { ...original, __esModule: true };
    });

    const { ImageSelectPage, useGameStore, useSettingsStore } = await loadImageSelectPage();
    useGameStore.getState().abandon();
    useSettingsStore.getState().resetToDefaults();

    render(
      <BrowserRouter>
        <ImageSelectPage />
      </BrowserRouter>,
    );

    const cards = screen.getAllByRole('button').filter((button) => button.querySelector('img'));
    expect(cards.length).toBeGreaterThan(0);
  });

  it('resolves square image counts before starting a game', async () => {
    const user = userEvent.setup();

    vi.doMock('../../generated/imageManifest', () => ({
      __esModule: true,
      imageManifest: [
        {
          id: 'square',
          filename: 'square.png',
          src: 'images/square.webp',
          thumbnailSrc: 'images/square-thumb.webp',
          alt: 'square',
          width: 900,
          height: 900,
          aspectRatio: 1,
        },
      ],
    }));

    const { ImageSelectPage, useGameStore, useSettingsStore } = await loadImageSelectPage();
    useGameStore.getState().abandon();
    useSettingsStore.getState().resetToDefaults();

    render(
      <BrowserRouter>
        <ImageSelectPage />
      </BrowserRouter>,
    );

    await user.click(screen.getByRole('button', { name: /square\.png/i }));

    expect(screen.getByText('9 pcs')).toBeInTheDocument();
    expect(screen.getByText('20 pcs')).toBeInTheDocument();
    expect(screen.getByText('30 pcs')).toBeInTheDocument();

    await user.click(screen.getByText('9 pcs'));

    const session = useGameStore.getState().session;
    expect(session).not.toBeNull();
    expect(session?.imageId).toBe('square');
    expect(session?.pieceCount).toBe(9);
  });
});
