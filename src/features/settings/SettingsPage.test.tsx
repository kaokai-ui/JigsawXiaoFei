import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { SettingsPage } from './SettingsPage';
import { useSettingsStore } from '../../stores/settingsStore';

function renderSettings() {
  return render(
    <BrowserRouter>
      <SettingsPage />
    </BrowserRouter>,
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
  });

  it('renders the title', () => {
    renderSettings();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('設定');
  });

  it('shows three difficulty inputs', () => {
    renderSettings();
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(3);
    expect(screen.getByText('簡單')).toBeInTheDocument();
    expect(screen.getByText('普通')).toBeInTheDocument();
    expect(screen.getByText('困難')).toBeInTheDocument();
  });

  it('shows toggles for show reference, sound, and haptics', () => {
    renderSettings();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
    expect(screen.getAllByText('顯示參考圖預覽').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('音效')).toBeInTheDocument();
    expect(screen.getByText('震動回饋')).toBeInTheDocument();
  });

  it('changing a piece count value calls setPieceCount', async () => {
    const user = userEvent.setup();
    renderSettings();
    const easyInput = screen.getAllByRole('spinbutton')[0];
    await user.clear(easyInput);
    await user.type(easyInput, '25');
    const state = useSettingsStore.getState();
    expect(state.pieceCountByDifficulty.easy).toBe(25);
  });

  it('invalid value shows error message', async () => {
    const user = userEvent.setup();
    renderSettings();
    const easyInput = screen.getAllByRole('spinbutton')[0];
    await user.clear(easyInput);
    await user.type(easyInput, '0');
    expect(screen.getByText('張數不可少於 4')).toBeInTheDocument();
  });
});
