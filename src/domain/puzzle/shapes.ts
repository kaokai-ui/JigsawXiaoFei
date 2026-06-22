import type { GridSpec, PieceShape, EdgeKind, PieceEdge } from './types';
import { createSeededRng } from './random';

const DEFAULT_EDGE_PROFILE = {
  offsetRatio: 0.5,
  spanRatio: 0.32,
  depthRatio: 0.24,
  shoulderRatio: 0.26,
  skewRatio: 0,
} as const;

export function createFlatEdge(): PieceEdge {
  return {
    kind: 0,
    ...DEFAULT_EDGE_PROFILE,
  };
}

export function createLegacyEdge(kind: EdgeKind): PieceEdge {
  return {
    kind,
    ...DEFAULT_EDGE_PROFILE,
  };
}

export function createPieceShapes(grid: GridSpec, seed: number): Record<number, PieceShape> {
  const rng = createSeededRng(seed);
  const shapes: Record<number, PieceShape> = {};

  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const index = row * grid.cols + col;
      const isActive = index < grid.activeCells;

      if (!isActive) {
        shapes[index] = {
          top: createFlatEdge(),
          right: createFlatEdge(),
          bottom: createFlatEdge(),
          left: createFlatEdge(),
        };
        continue;
      }

      const hasTopNeighbour = row > 0 && index - grid.cols < grid.activeCells;
      const hasLeftNeighbour = col > 0 && index - 1 < grid.activeCells;
      const hasRightNeighbour = col < grid.cols - 1 && index + 1 < grid.activeCells;
      const hasBottomNeighbour = row < grid.rows - 1 && index + grid.cols < grid.activeCells;

      shapes[index] = {
        top: hasTopNeighbour ? invertEdge(shapes[index - grid.cols].bottom) : createFlatEdge(),
        left: hasLeftNeighbour ? invertEdge(shapes[index - 1].right) : createFlatEdge(),
        right: hasRightNeighbour ? createInnerEdge(rng) : createFlatEdge(),
        bottom: hasBottomNeighbour ? createInnerEdge(rng) : createFlatEdge(),
      };
    }
  }

  return shapes;
}

function createInnerEdge(rng: () => number): PieceEdge {
  return {
    kind: rng() < 0.5 ? -1 : 1,
    offsetRatio: randomBetween(rng, 0.3, 0.7),
    spanRatio: randomBetween(rng, 0.36, 0.5),
    depthRatio: randomBetween(rng, 0.22, 0.33),
    shoulderRatio: randomBetween(rng, 0.18, 0.42),
    skewRatio: randomBetween(rng, -0.22, 0.22),
  };
}

function invertEdge(edge: PieceEdge): PieceEdge {
  return {
    ...edge,
    kind: edge.kind === 0 ? 0 : ((edge.kind * -1) as EdgeKind),
  };
}

function randomBetween(rng: () => number, min: number, max: number): number {
  return min + (max - min) * rng();
}

function isFlatEdge(edge: PieceEdge): boolean {
  return edge.kind === 0;
}

export function assertComplementaryEdges(
  shapes: Record<number, PieceShape>,
  grid: GridSpec,
): boolean {
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const index = row * grid.cols + col;
      if (index >= grid.activeCells) continue;

      const shape = shapes[index];
      if (!shape) return false;

      const rightIndex = index + 1;
      const bottomIndex = index + grid.cols;
      const hasRight = col < grid.cols - 1 && rightIndex < grid.activeCells;
      const hasBottom = row < grid.rows - 1 && bottomIndex < grid.activeCells;

      if (row === 0 && !isFlatEdge(shape.top)) return false;
      if (col === 0 && !isFlatEdge(shape.left)) return false;
      if (!hasRight && !isFlatEdge(shape.right)) return false;
      if (!hasBottom && !isFlatEdge(shape.bottom)) return false;

      if (hasRight && !edgesAreComplementary(shape.right, shapes[rightIndex]?.left)) {
        return false;
      }
      if (hasBottom && !edgesAreComplementary(shape.bottom, shapes[bottomIndex]?.top)) {
        return false;
      }
    }
  }
  return true;
}

function edgesAreComplementary(a?: PieceEdge, b?: PieceEdge): boolean {
  if (!a || !b) return false;
  if (a.kind === 0 || b.kind === 0) return false;
  return (
    a.kind === ((b.kind * -1) as EdgeKind)
    && nearlyEqual(a.offsetRatio, b.offsetRatio)
    && nearlyEqual(a.spanRatio, b.spanRatio)
    && nearlyEqual(a.depthRatio, b.depthRatio)
    && nearlyEqual(a.shoulderRatio, b.shoulderRatio)
    && nearlyEqual(a.skewRatio, b.skewRatio)
  );
}

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-9;
}

interface EdgeMetrics {
  start: number;
  end: number;
  center: number;
  neckStart: number;
  neckEnd: number;
  depth: number;
  shoulder: number;
  neckSpan: number;
  skew: number;
}

/**
 * Returns a clockwise, closed jigsaw outline. `x` and `y` identify the base
 * cell's top-left corner; tabs may extend outside that base rectangle.
 */
export function getPiecePath(
  shape: PieceShape,
  width: number,
  height: number,
  x = 0,
  y = 0,
): string {
  const right = x + width;
  const bottom = y + height;

  return [
    `M ${x} ${y}`,
    topEdge(shape.top, x, y, width, height),
    rightEdge(shape.right, right, y, width, height),
    bottomEdge(shape.bottom, x, bottom, width, height),
    leftEdge(shape.left, x, y, width, height),
    'Z',
  ].join(' ');
}

function topEdge(edge: PieceEdge, x: number, y: number, width: number, height: number): string {
  if (edge.kind === 0) return `L ${x + width} ${y}`;
  const metrics = resolveEdgeMetrics(edge, width, height);
  const rise = y - edge.kind * metrics.depth * 0.12;
  const peak = y - edge.kind * metrics.depth;
  const high = y - edge.kind * metrics.depth * 0.86;
  const shoulder = metrics.shoulder;

  return [
    `L ${x + metrics.start} ${y}`,
    `C ${x + metrics.start + shoulder * 0.58} ${y}, ${x + metrics.neckStart - shoulder * 0.42 + metrics.skew * 0.4} ${y}, ${x + metrics.neckStart} ${rise}`,
    `C ${x + metrics.neckStart + shoulder * 0.08} ${high}, ${x + metrics.center - shoulder * 0.52 + metrics.skew} ${peak}, ${x + metrics.center} ${peak}`,
    `C ${x + metrics.center + shoulder * 0.52 + metrics.skew} ${peak}, ${x + metrics.neckEnd - shoulder * 0.08} ${high}, ${x + metrics.neckEnd} ${rise}`,
    `C ${x + metrics.neckEnd + shoulder * 0.42 + metrics.skew * 0.4} ${y}, ${x + metrics.end - shoulder * 0.58} ${y}, ${x + metrics.end} ${y}`,
    `L ${x + width} ${y}`,
  ].join(' ');
}

function rightEdge(edge: PieceEdge, x: number, y: number, width: number, height: number): string {
  if (edge.kind === 0) return `L ${x} ${y + height}`;
  const metrics = resolveEdgeMetrics(edge, height, width);
  const rise = x + edge.kind * metrics.depth * 0.12;
  const peak = x + edge.kind * metrics.depth;
  const high = x + edge.kind * metrics.depth * 0.86;
  const shoulder = metrics.shoulder;

  return [
    `L ${x} ${y + metrics.start}`,
    `C ${x} ${y + metrics.start + shoulder * 0.58}, ${x} ${y + metrics.neckStart - shoulder * 0.42 + metrics.skew * 0.4}, ${rise} ${y + metrics.neckStart}`,
    `C ${high} ${y + metrics.neckStart + shoulder * 0.08}, ${peak} ${y + metrics.center - shoulder * 0.52 + metrics.skew}, ${peak} ${y + metrics.center}`,
    `C ${peak} ${y + metrics.center + shoulder * 0.52 + metrics.skew}, ${high} ${y + metrics.neckEnd - shoulder * 0.08}, ${rise} ${y + metrics.neckEnd}`,
    `C ${x} ${y + metrics.neckEnd + shoulder * 0.42 + metrics.skew * 0.4}, ${x} ${y + metrics.end - shoulder * 0.58}, ${x} ${y + metrics.end}`,
    `L ${x} ${y + height}`,
  ].join(' ');
}

function bottomEdge(edge: PieceEdge, x: number, y: number, width: number, height: number): string {
  if (edge.kind === 0) return `L ${x} ${y}`;
  const metrics = resolveEdgeMetrics(edge, width, height);
  const rise = y + edge.kind * metrics.depth * 0.12;
  const peak = y + edge.kind * metrics.depth;
  const high = y + edge.kind * metrics.depth * 0.86;
  const shoulder = metrics.shoulder;

  return [
    `L ${x + metrics.end} ${y}`,
    `C ${x + metrics.end - shoulder * 0.58} ${y}, ${x + metrics.neckEnd + shoulder * 0.42 + metrics.skew * 0.4} ${y}, ${x + metrics.neckEnd} ${rise}`,
    `C ${x + metrics.neckEnd - shoulder * 0.08} ${high}, ${x + metrics.center + shoulder * 0.52 + metrics.skew} ${peak}, ${x + metrics.center} ${peak}`,
    `C ${x + metrics.center - shoulder * 0.52 + metrics.skew} ${peak}, ${x + metrics.neckStart + shoulder * 0.08} ${high}, ${x + metrics.neckStart} ${rise}`,
    `C ${x + metrics.neckStart - shoulder * 0.42 + metrics.skew * 0.4} ${y}, ${x + metrics.start + shoulder * 0.58} ${y}, ${x + metrics.start} ${y}`,
    `L ${x} ${y}`,
  ].join(' ');
}

function leftEdge(edge: PieceEdge, x: number, y: number, width: number, height: number): string {
  if (edge.kind === 0) return `L ${x} ${y}`;
  const metrics = resolveEdgeMetrics(edge, height, width);
  const rise = x - edge.kind * metrics.depth * 0.12;
  const peak = x - edge.kind * metrics.depth;
  const high = x - edge.kind * metrics.depth * 0.86;
  const shoulder = metrics.shoulder;

  return [
    `L ${x} ${y + metrics.end}`,
    `C ${x} ${y + metrics.end - shoulder * 0.58}, ${x} ${y + metrics.neckEnd + shoulder * 0.42 + metrics.skew * 0.4}, ${rise} ${y + metrics.neckEnd}`,
    `C ${high} ${y + metrics.neckEnd - shoulder * 0.08}, ${peak} ${y + metrics.center + shoulder * 0.52 + metrics.skew}, ${peak} ${y + metrics.center}`,
    `C ${peak} ${y + metrics.center - shoulder * 0.52 + metrics.skew}, ${high} ${y + metrics.neckStart + shoulder * 0.08}, ${rise} ${y + metrics.neckStart}`,
    `C ${x} ${y + metrics.neckStart - shoulder * 0.42 + metrics.skew * 0.4}, ${x} ${y + metrics.start + shoulder * 0.58}, ${x} ${y + metrics.start}`,
    `L ${x} ${y}`,
  ].join(' ');
}

function resolveEdgeMetrics(edge: PieceEdge, mainLength: number, crossLength: number): EdgeMetrics {
  const span = clamp(mainLength * edge.spanRatio, mainLength * 0.3, mainLength * 0.52);
  const margin = mainLength * 0.08;
  const halfSpan = span / 2;
  const center = clamp(mainLength * edge.offsetRatio, margin + halfSpan, mainLength - margin - halfSpan);
  const neckSpan = span * clamp(edge.shoulderRatio, 0.18, 0.42);
  const neckDelta = neckSpan / 2;
  const depth = clamp(crossLength * edge.depthRatio, crossLength * 0.18, crossLength * 0.34);
  const shoulder = Math.max(2, (span - neckSpan) / 2);
  const skew = span * clamp(edge.skewRatio, -0.24, 0.24) * 0.42;

  return {
    start: center - halfSpan,
    end: center + halfSpan,
    center,
    neckStart: center - neckDelta,
    neckEnd: center + neckDelta,
    depth,
    shoulder,
    neckSpan,
    skew,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
