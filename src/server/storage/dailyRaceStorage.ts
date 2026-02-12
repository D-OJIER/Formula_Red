import { redis } from '@devvit/web/server';
import type { DailyRace, OfficialRaceResult } from '../../shared/types';

/**
 * Get race key for a trackId
 */
function getRaceKey(trackId: string): string {
  return `race:${trackId}`;
}

/**
 * Get race result key for a user
 */
function getRaceResultKey(trackId: string, userId: string): string {
  return `race:${trackId}:result:${userId}`;
}

/**
 * Get index key for race results
 */
function getRaceIndexKey(trackId: string): string {
  return `race:index:${trackId}`;
}

/**
 * Get or create daily race
 */
export async function getDailyRace(trackId: string): Promise<DailyRace | null> {
  const key = getRaceKey(trackId);
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as DailyRace;
}

/**
 * Store daily race
 */
export async function storeDailyRace(race: DailyRace): Promise<void> {
  const key = getRaceKey(race.trackId);
  await redis.set(key, JSON.stringify(race));
}

/**
 * Store official race result
 * Enforces: exactly one official run per user per trackId
 */
export async function storeOfficialResult(
  result: OfficialRaceResult
): Promise<void> {
  const race = await getDailyRace(result.trackId);
  if (!race) {
    throw new Error(`Race ${result.trackId} not found`);
  }

  if (race.frozen) {
    throw new Error(`Race ${result.trackId} is frozen, cannot submit`);
  }

  // Check if user already submitted
  const existingKey = getRaceResultKey(result.trackId, result.userId);
  const existing = await redis.get(existingKey);
  if (existing) {
    throw new Error(`User ${result.userId} already submitted for race ${result.trackId}`);
  }

  // Store individual result
  await redis.set(existingKey, JSON.stringify(result));

  // Update race results
  if (!race.results) {
    race.results = [];
  }
  race.results.push(result);

  // Update index
  const indexKey = getRaceIndexKey(result.trackId);
  const indexData = await redis.get(indexKey);
  const userIds = indexData ? (JSON.parse(indexData) as string[]) : [];
  if (!userIds.includes(result.userId)) {
    userIds.push(result.userId);
    await redis.set(indexKey, JSON.stringify(userIds));
  }

  await storeDailyRace(race);
}

/**
 * Get official result for a user
 */
export async function getOfficialResult(
  trackId: string,
  userId: string
): Promise<OfficialRaceResult | null> {
  const key = getRaceResultKey(trackId, userId);
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as OfficialRaceResult;
}

/**
 * Check if user has already submitted
 */
export async function hasOfficialResult(
  trackId: string,
  userId: string
): Promise<boolean> {
  const result = await getOfficialResult(trackId, userId);
  return result !== null;
}

/**
 * Get all official results for a trackId
 */
export async function getAllOfficialResults(
  trackId: string
): Promise<OfficialRaceResult[]> {
  const indexKey = getRaceIndexKey(trackId);
  const indexData = await redis.get(indexKey);
  
  if (!indexData) {
    return [];
  }

  const userIds = JSON.parse(indexData) as string[];
  const results: OfficialRaceResult[] = [];

  // Fetch all results in parallel
  const resultPromises = userIds.map((userId) =>
    getOfficialResult(trackId, userId)
  );
  const fetchedResults = await Promise.all(resultPromises);

  for (const result of fetchedResults) {
    if (result) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Freeze a race (prevent further submissions)
 */
export async function freezeRace(trackId: string): Promise<void> {
  const race = await getDailyRace(trackId);
  if (!race) {
    throw new Error(`Race ${trackId} not found`);
  }
  race.frozen = true;
  await storeDailyRace(race);
}

/**
 * Update race results (used during finalization)
 */
export async function updateRaceResults(
  trackId: string,
  results: OfficialRaceResult[]
): Promise<void> {
  const race = await getDailyRace(trackId);
  if (!race) {
    throw new Error(`Race ${trackId} not found`);
  }
  race.results = results;
  await storeDailyRace(race);
}
