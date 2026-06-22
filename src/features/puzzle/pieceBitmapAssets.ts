import { useEffect } from 'react';
import type { GameSession, PieceBitmapAssetMap } from '../../domain/puzzle/types';
import { getSourcePieceDimensions } from '../../domain/puzzle/geometry';
import { getPiecePath } from '../../domain/puzzle/shapes';

interface PieceBitmapImageMeta {
  src: string;
  width: number;
  height: number;
}

interface PieceBitmapState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  assets: PieceBitmapAssetMap | null;
}

const loadedImageCache = new Map<string, Promise<HTMLImageElement>>();
const renderedPieceCache = new Map<string, Promise<PieceBitmapAssetMap>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = loadedImageCache.get(src);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load puzzle image: ${src}`));
    img.src = src;
  });

  loadedImageCache.set(src, promise);
  return promise;
}

function drawPieceToDataUrl(
  image: HTMLImageElement,
  session: GameSession,
  imageWidth: number,
  imageHeight: number,
): PieceBitmapAssetMap {
  const dimensions = getSourcePieceDimensions(imageWidth, imageHeight, session.grid);
  const renderScale = typeof window !== 'undefined' ? Math.max(1, Math.ceil(window.devicePixelRatio || 1)) : 1;
  const strokeWidth = Math.max(1, Math.min(dimensions.baseWidth, dimensions.baseHeight) * 0.013);
  const assets: PieceBitmapAssetMap = {};

  for (const piece of Object.values(session.pieces)) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(dimensions.viewportWidth * renderScale));
    canvas.height = Math.max(1, Math.ceil(dimensions.viewportHeight * renderScale));

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context is unavailable');
    }

    ctx.scale(renderScale, renderScale);

    const path = new Path2D(
      getPiecePath(piece.shape, dimensions.baseWidth, dimensions.baseHeight, dimensions.tabBleed, dimensions.tabBleed),
    );

    ctx.save();
    ctx.clip(path);
    ctx.drawImage(
      image,
      dimensions.tabBleed - piece.source.col * dimensions.baseWidth,
      dimensions.tabBleed - piece.source.row * dimensions.baseHeight,
      imageWidth,
      imageHeight,
    );
    ctx.restore();

    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = 'rgba(28, 31, 42, 0.52)';
    ctx.lineJoin = 'round';
    ctx.stroke(path);

    assets[piece.id] = {
      src: canvas.toDataURL('image/png'),
      width: Math.ceil(dimensions.viewportWidth),
      height: Math.ceil(dimensions.viewportHeight),
    };
  }

  return assets;
}

async function renderPieceBitmapAssets(
  session: GameSession,
  imageMeta: PieceBitmapImageMeta,
): Promise<PieceBitmapAssetMap> {
  const cacheKey = `${session.id}:${imageMeta.src}:${imageMeta.width}x${imageMeta.height}`;
  const cached = renderedPieceCache.get(cacheKey);
  if (cached) return cached;

  const promise = loadImage(imageMeta.src).then((image) => {
    const sourceWidth = image.naturalWidth || imageMeta.width;
    const sourceHeight = image.naturalHeight || imageMeta.height;
    return drawPieceToDataUrl(image, session, sourceWidth, sourceHeight);
  });

  renderedPieceCache.set(cacheKey, promise);
  return promise;
}

export function usePieceBitmapAssets(
  session: GameSession | null,
  imageMeta: PieceBitmapImageMeta | null,
  setState: (state: PieceBitmapState) => void,
) {
  useEffect(() => {
    if (!session || !imageMeta) {
      setState({ status: 'idle', assets: null });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading', assets: null });

    renderPieceBitmapAssets(session, imageMeta).then(
      (assets) => {
        if (!cancelled) {
          setState({ status: 'ready', assets });
        }
      },
      () => {
        if (!cancelled) {
          setState({ status: 'error', assets: null });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [imageMeta, session, setState]);
}
