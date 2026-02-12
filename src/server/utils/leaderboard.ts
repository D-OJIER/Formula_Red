import type { RaceResult, PracticeSession } from '../../shared/types';

/**
 * Sort race results by lap time (ascending) with stable ordering
 * Tie-break using submission timestamp (earlier submission wins)
 */
export function sortRaceResults(results: RaceResult[]): RaceResult[] {
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
 * Sort practice sessions by lap time (ascending) with stable ordering
 */
export function sortPracticeSessions(
  sessions: PracticeSession[]
): PracticeSession[] {
  return [...sessions].sort((a, b) => {
    // Primary sort: lap time (ascending)
    if (a.lapTime !== b.lapTime) {
      return a.lapTime - b.lapTime;
    }
    // Tie-break: earlier submission wins
    return a.timestamp - b.timestamp;
  });
}

/**
 * Assign positions to sorted race results
 */
export function assignPositions(results: RaceResult[]): RaceResult[] {
  return results.map((result, index) => ({
    ...result,
    position: index + 1,
  }));
}
