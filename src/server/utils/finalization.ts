import type { RaceDay, RaceResult, PodiumResult } from '../../shared/types';
import {
  getRaceDay,
  freezeRace,
  updateRaceResults,
} from '../storage/raceStorage';
import { updateUserStanding } from '../storage/seasonStorage';
import { sortRaceResults, assignPositions } from './leaderboard';
import { calculatePoints } from './points';

/**
 * Finalizes a race day:
 * - Freezes the race
 * - Sorts results
 * - Assigns positions
 * - Calculates points
 * - Updates season standings
 * - Returns podium results
 */
export async function finalizeRaceDay(date: string): Promise<PodiumResult> {
  const raceDay = await getRaceDay(date);
  if (!raceDay) {
    throw new Error(`Race day ${date} not found`);
  }

  if (raceDay.frozen) {
    // Already finalized, return existing podium
    return getPodiumFromResults(raceDay.results || []);
  }

  // Freeze the race
  await freezeRace(date);

  // Get and sort results
  let results = raceDay.results || [];
  results = sortRaceResults(results);
  results = assignPositions(results);

  // Calculate points for each result
  results = results.map((result) => ({
    ...result,
    points: calculatePoints(result.position),
  }));

  // Update race results
  await updateRaceResults(date, results);

  // Update season standings
  for (const result of results) {
    await updateUserStanding(
      result.userId,
      result.username,
      result.points,
      result.position
    );
  }

  return getPodiumFromResults(results);
}

/**
 * Extract podium results from race results
 */
export function getPodiumFromResults(results: RaceResult[]): PodiumResult {
  const sorted = sortRaceResults(results);
  return {
    p1: sorted[0] || null,
    p2: sorted[1] || null,
    p3: sorted[2] || null,
  };
}
