import { redis } from '@devvit/web/server';
import type { RaceDay, RaceResult, DriverSubmission } from '../../shared/types';
import { getDateString } from '../utils/sessionTime';

/**
 * Get race key for a date
 */
function getRaceKey(date: string): string {
  return `race:${date}`;
}

/**
 * Get race submission key for a user
 */
function getRaceSubmissionKey(date: string, userId: string): string {
  return `race:${date}:submission:${userId}`;
}

/**
 * Initialize or get race day data
 */
export async function getRaceDay(date: string): Promise<RaceDay | null> {
  const key = getRaceKey(date);
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as RaceDay;
}

/**
 * Store race day data
 */
export async function storeRaceDay(raceDay: RaceDay): Promise<void> {
  const key = getRaceKey(raceDay.date);
  await redis.set(key, JSON.stringify(raceDay));
}

/**
 * Store a race submission
 * Enforces: one official submission per user
 */
export async function storeRaceSubmission(
  date: string,
  submission: DriverSubmission,
  lapTime: number
): Promise<void> {
  const raceDay = await getRaceDay(date);
  if (!raceDay) {
    throw new Error(`Race day ${date} not found`);
  }

  if (raceDay.frozen) {
    throw new Error(`Race ${date} is frozen, cannot submit`);
  }

  // Check if user already submitted
  const existingKey = getRaceSubmissionKey(date, submission.userId);
  const existing = await redis.get(existingKey);
  if (existing) {
    throw new Error(`User ${submission.userId} already submitted for race ${date}`);
  }

  // Store submission
  const result: RaceResult = {
    userId: submission.userId,
    username: submission.username,
    submission,
    lapTime,
    position: 0, // Will be set during finalization
    points: 0, // Will be set during finalization
    timestamp: submission.timestamp,
  };

  await redis.set(existingKey, JSON.stringify(result));

  // Update race day results
  if (!raceDay.results) {
    raceDay.results = [];
  }
  raceDay.results.push(result);
  await storeRaceDay(raceDay);
}

/**
 * Get race submission for a user
 */
export async function getRaceSubmission(
  date: string,
  userId: string
): Promise<RaceResult | null> {
  const key = getRaceSubmissionKey(date, userId);
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as RaceResult;
}

/**
 * Get all race results for a date
 */
export async function getAllRaceResults(date: string): Promise<RaceResult[]> {
  const raceDay = await getRaceDay(date);
  if (!raceDay || !raceDay.results) {
    return [];
  }
  return raceDay.results;
}

/**
 * Check if user has already submitted for race
 */
export async function hasRaceSubmission(
  date: string,
  userId: string
): Promise<boolean> {
  const submission = await getRaceSubmission(date, userId);
  return submission !== null;
}

/**
 * Freeze a race (prevent further submissions)
 */
export async function freezeRace(date: string): Promise<void> {
  const raceDay = await getRaceDay(date);
  if (!raceDay) {
    throw new Error(`Race day ${date} not found`);
  }
  raceDay.frozen = true;
  await storeRaceDay(raceDay);
}

/**
 * Update race results (used during finalization)
 */
export async function updateRaceResults(
  date: string,
  results: RaceResult[]
): Promise<void> {
  const raceDay = await getRaceDay(date);
  if (!raceDay) {
    throw new Error(`Race day ${date} not found`);
  }
  raceDay.results = results;
  await storeRaceDay(raceDay);
}
