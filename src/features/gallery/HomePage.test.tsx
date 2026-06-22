import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { useGameStore } from '../../stores/gameStore';
import { useRecordsStore } from '../../stores/recordsStore';

function renderHome() {
  return render(
    <BrowserRouter>
      <HomePage />
    </BrowserRouter>,
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    useGameStore.getState().abandon();
    useRecordsStore.setState({ records: {} });
  });

  it('renders the app title', () => {
    renderHome();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('拼圖小飛');
  });

  it('shows the 開始新遊戲 link', () => {
    renderHome();
    const link = screen.getByRole('link', { name: '開始新遊戲' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/images');
  });

  it('shows the 設定 link', () => {
    renderHome();
    const link = screen.getByRole('link', { name: '設定' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/settings');
  });
});
