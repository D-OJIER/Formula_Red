/**
 * Points system for Formula Red
 * Standard F1 points system: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1
 */
const POINTS_TABLE: Record<number, number> = {
  1: 25,
  2: 18,
  3: 15,
  4: 12,
  5: 10,
  6: 8,
  7: 6,
  8: 4,
  9: 2,
  10: 1,
};

/**
 * Calculate points for a finishing position
 */
export function calculatePoints(position: number): number {
  return POINTS_TABLE[position] || 0;
}

/**
 * Get points table for display
 */
export function getPointsTable(): Record<number, number> {
  return { ...POINTS_TABLE };
}
