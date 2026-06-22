import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { GridSpec } from '../../domain/puzzle/types';
import { getBoardCellPlacement, getPieceDimensions } from '../../domain/puzzle/geometry';

interface PieceBitmapImageProps {
  assetSrc: string;
  imageAspectRatio: number;
  grid: GridSpec;
  className?: string;
  placement?: 'intrinsic' | 'board-cell';
}

export function PieceBitmapImage({
  assetSrc,
  imageAspectRatio,
  grid,
  className,
  placement = 'intrinsic',
}: PieceBitmapImageProps) {
  const dimensions = useMemo(
    () => getPieceDimensions(imageAspectRatio, grid),
    [imageAspectRatio, grid],
  );

  const style: CSSProperties = useMemo(() => {
    const baseStyle: CSSProperties = {
      display: 'block',
      maxWidth: 'none',
      maxHeight: 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      touchAction: 'none',
    };

    if (placement === 'intrinsic') {
      return { ...baseStyle, width: '100%', height: '100%' };
    }

    const placementMetrics = getBoardCellPlacement(dimensions);
    return {
      ...baseStyle,
      position: 'absolute',
      left: `${placementMetrics.leftPercent}%`,
      top: `${placementMetrics.topPercent}%`,
      width: `${placementMetrics.widthPercent}%`,
      height: `${placementMetrics.heightPercent}%`,
      pointerEvents: 'none',
    };
  }, [dimensions, placement]);

  return (
    <img
      src={assetSrc}
      alt=""
      className={className}
      style={style}
      draggable={false}
      aria-hidden="true"
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
