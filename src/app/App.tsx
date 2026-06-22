import { HashRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useRecordsStore } from '../stores/recordsStore';
import { HomePage } from '../features/gallery/HomePage';
import { ImageSelectPage } from '../features/gallery/ImageSelectPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { GamePage } from '../features/puzzle/GamePage';
import { DragLayer } from '../features/puzzle/DragLayer';

export function App() {
  const initSettings = useSettingsStore((s) => s.initialize);
  const initRecords = useRecordsStore((s) => s.initialize);

  useEffect(() => {
    initSettings();
    initRecords();
  }, [initSettings, initRecords]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/images" element={<ImageSelectPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/play/:sessionId" element={<GamePage />} />
      </Routes>
      <DragLayer />
    </HashRouter>
  );
}
