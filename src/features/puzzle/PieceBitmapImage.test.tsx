import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { PieceBitmapImage } from './PieceBitmapImage';

describe('PieceBitmapImage', () => {
  it('allows board-cell pieces to extend beyond a single cell without global img clamps', () => {
    const { container } = render(
      <PieceBitmapImage
        assetSrc="images/test-piece.png"
        imageAspectRatio={1}
        grid={{ rows: 3, cols: 3, activeCells: 9 }}
        placement="board-cell"
      />,
    );

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.style.maxWidth).toBe('none');
    expect(img?.style.maxHeight).toBe('none');
    expect(img?.style.width).toBe('180%');
    expect(img?.style.height).toBe('180%');
  });
});
