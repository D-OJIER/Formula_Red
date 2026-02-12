import type { OfficialRaceResult } from '../../shared/types';

/**
 * Sort race results by lap time (ascending) with stable ordering
 * Tie-break using submission timestamp (earlier submission wins)
 */
export function sortRaceResults(results: OfficialRaceResult[]): OfficialRaceResult[] {
  return [...results].sort((a, b) => {
    // Primary sort: lap time (ascending)
    if (a.lapTime !== b.lapTime) {
      return a.lapTime - b.lapTime;
    }
    // Tie-break: earlier submission wins
    return a.timestamp - b.timestamp;
  });
}

/**
 * Get daily leaderboard for a trackId
 */
export function getDailyLeaderboard(
  results: OfficialRaceResult[]
): OfficialRaceResult[] {
  return sortRaceResults(results);
}

/**
 * Assign positions to sorted race results
 */
export function assignPositions(results: OfficialRaceResult[]): OfficialRaceResult[] {
  return results.map((result, index) => ({
    ...result,
    position: index + 1,
  }));
}
