import type { DailyRace, OfficialRaceResult, PodiumResult } from '../../shared/types';
import {
  getDailyRace,
  freezeRace,
  updateRaceResults,
} from '../storage/dailyRaceStorage';
import { updateUserStanding } from '../storage/seasonStorage';
import { updateMonthlyStanding } from '../storage/monthlyStorage';
import { updatePlayerProfileFromResult } from '../storage/playerProfileStorage';
import { sortRaceResults, assignPositions } from './leaderboard';
import { calculatePoints } from './points';
import { getRedditAvatarUrl } from '../../shared/utils/avatar';

/**
 * Finalizes a race day:
 * - Freezes the race
 * - Sorts results
 * - Assigns positions
 * - Calculates points
 * - Updates season standings
 * - Returns podium results
 */
export async function finalizeRaceDay(trackId: string): Promise<PodiumResult> {
  const race = await getDailyRace(trackId);
  if (!race) {
    throw new Error(`Race ${trackId} not found`);
  }

  if (race.frozen) {
    // Already finalized, return existing podium
    return getPodiumFromResults(race.results || []);
  }

  // Freeze the race
  await freezeRace(trackId);

  // Get and sort results
  let results = race.results || [];
  results = sortRaceResults(results);
  results = assignPositions(results);

  // Calculate points for each result and ensure avatar URLs
  results = results.map((result) => ({
    ...result,
    points: calculatePoints(result.position),
    avatarUrl: result.avatarUrl || getRedditAvatarUrl(result.userId),
  }));

  // Update race results
  await updateRaceResults(trackId, results);

  // Update season standings
  for (const result of results) {
    await updateUserStanding(
      result.userId,
      result.username,
      result.points,
      result.position
    );
    // Update monthly standings
    await updateMonthlyStanding(
      result.userId,
      result.username,
      result.points,
      result.position
    );
    // Update player profiles
    await updatePlayerProfileFromResult(result);
  }

  return getPodiumFromResults(results);
}

/**
 * Extract podium results from race results
 */
export function getPodiumFromResults(results: OfficialRaceResult[]): PodiumResult {
  const sorted = sortRaceResults(results);
  return {
    p1: sorted[0] || null,
    p2: sorted[1] || null,
    p3: sorted[2] || null,
  };
}
