import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolvePieceCountForImage } from '../../domain/puzzle/pieceCountPolicy';
import type { Difficulty } from '../../domain/puzzle/types';
import { imageManifest } from '../../generated/imageManifest';
import type { ImageAsset } from '../../generated/imageManifest';
import zhTW from '../../i18n/zh-TW';
import { useGameStore } from '../../stores/gameStore';
import { useSettingsStore } from '../../stores/settingsStore';
import styles from './ImageSelectPage.module.css';

const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];

export function ImageSelectPage() {
  const navigate = useNavigate();
  const pieceCountByDifficulty = useSettingsStore((state) => state.pieceCountByDifficulty);
  const startGame = useGameStore((state) => state.startGame);
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);

  const handleCardClick = useCallback((image: ImageAsset) => {
    setSelectedImage(image);
  }, []);

  const handleDifficultySelect = useCallback(
    (difficulty: Difficulty) => {
      if (!selectedImage) {
        return;
      }

      const requestedPieceCount = pieceCountByDifficulty[difficulty];
      const resolvedPieceCount = resolvePieceCountForImage(selectedImage, requestedPieceCount);

      startGame({
        imageId: selectedImage.id,
        imageAspectRatio: selectedImage.aspectRatio,
        difficulty,
        pieceCount: resolvedPieceCount,
      });

      const session = useGameStore.getState().session;
      if (session) {
        navigate(`/play/${session.id}`);
      }
    },
    [navigate, pieceCountByDifficulty, selectedImage, startGame],
  );

  const handleCancel = useCallback(() => {
    setSelectedImage(null);
  }, []);

  if (imageManifest.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <p>{zhTW.gallery.empty}</p>
          <button type="button" onClick={() => navigate('/')} className={styles.cancelButton}>
            {zhTW.settings.back}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate('/')}
          aria-label={zhTW.game.back}
        >
          {'<-'}
        </button>
        <h1 className={styles.title}>{zhTW.gallery.title}</h1>
      </div>

      <div className={styles.grid}>
        {imageManifest.map((image) => (
          <button
            key={image.id}
            type="button"
            className={styles.card}
            onClick={() => handleCardClick(image)}
          >
            <img
              src={image.thumbnailSrc}
              alt={image.alt}
              className={styles.cardThumb}
              loading="lazy"
            />
            <span className={styles.cardName}>{image.filename}</span>
          </button>
        ))}
      </div>

      {selectedImage && (
        <div className={styles.difficultyOverlay} onClick={handleCancel}>
          <div className={styles.difficultyPanel} onClick={(event) => event.stopPropagation()}>
            <h2 className={styles.difficultyPanelTitle}>{selectedImage.filename}</h2>
            <img
              src={selectedImage.thumbnailSrc}
              alt={selectedImage.alt}
              className={styles.difficultyPreview}
            />
            <div className={styles.difficultyButtons}>
              {difficulties.map((difficulty) => {
                const resolvedPieceCount = resolvePieceCountForImage(
                  selectedImage,
                  pieceCountByDifficulty[difficulty],
                );

                return (
                  <button
                    key={difficulty}
                    type="button"
                    className={styles.difficultyButton}
                    onClick={() => handleDifficultySelect(difficulty)}
                  >
                    {zhTW.difficulty[difficulty]}
                    <span className={styles.difficultyPieceCount}>
                      {resolvedPieceCount}
                      {' pcs'}
                    </span>
                  </button>
                );
              })}
            </div>
            <button type="button" className={styles.cancelButton} onClick={handleCancel}>
              {zhTW.game.back}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
