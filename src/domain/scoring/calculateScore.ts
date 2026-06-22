export interface ScoreInput {
  pieceCount: number;
  elapsedMs: number;
  moves: number;
  hintsUsed: number;
}

export function calculateScore(input: ScoreInput): number {
  const { pieceCount, elapsedMs, moves, hintsUsed } = input;
  const base = pieceCount * 100;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const timePenalty = Math.floor(elapsedSeconds / 5) * 2;
  const movePenalty = Math.max(0, moves - pieceCount) * 5;
  const hintPenalty = hintsUsed * 50;
  return Math.max(0, base - timePenalty - movePenalty - hintPenalty);
}
