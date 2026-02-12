import type {
  DriverSubmission,
  PracticeSession,
  RaceDay,
} from '../../shared/types';
import { getCurrentSession, getDateString } from '../utils/sessionTime';
import { simulateLap } from '../utils/simulation';
import { validateSubmission, validateSessionAccess } from '../utils/validation';
import {
  storePracticeSession,
  getAllPracticeSessions,
} from '../storage/practiceStorage';
import {
  getRaceDay,
  storeRaceSubmission,
  getAllRaceResults,
} from '../storage/raceStorage';
import { generateTrack, generateTrackSeed } from '../utils/trackGenerator';
import { generateDailyModifier } from '../utils/modifierGenerator';
import { sortRaceResults, sortPracticeSessions } from '../utils/leaderboard';

/**
 * Handles a practice session submission
 */
export async function handlePracticeSubmission(
  submission: DriverSubmission
): Promise<{ success: boolean; lapTime: number; error?: string }> {
  // Validate submission
  const validation = validateSubmission(submission);
  if (!validation.valid) {
    return {
      success: false,
      lapTime: 0,
      error: validation.error,
    };
  }

  const date = getDateString();
  const currentSession = getCurrentSession();

  // Validate session access
  const sessionValidation = await validateSessionAccess(date, submission.userId, false);
  if (!sessionValidation.valid) {
    return {
      success: false,
      lapTime: 0,
      error: sessionValidation.error,
    };
  }

  // Ensure race day exists (for track config and modifier)
  let raceDay = await getRaceDay(date);
  if (!raceDay) {
    const trackSeed = generateTrackSeed(date);
    const trackConfig = generateTrack(trackSeed);
    const modifier = generateDailyModifier(trackSeed);

    raceDay = {
      date,
      trackSeed,
      trackConfig,
      modifier,
      frozen: false,
    };
    // Note: We don't store race day here, only when race submissions happen
  }

  // Simulate lap (practice mode adds telemetry noise)
  const seedSuffix = `practice:${currentSession}`;
  const lapTime = simulateLap(
    raceDay.trackConfig,
    raceDay.modifier,
    submission,
    submission.userId,
    seedSuffix,
    true // isPractice = true
  );

  // Store practice session
  const practiceSession: PracticeSession = {
    sessionType: currentSession as 'P1' | 'P2' | 'P3' | 'P4',
    date,
    userId: submission.userId,
    submission,
    lapTime,
    timestamp: submission.timestamp,
  };

  await storePracticeSession(practiceSession);

  return {
    success: true,
    lapTime,
  };
}

/**
 * Handles a race submission
 */
export async function handleRaceSubmission(
  submission: DriverSubmission
): Promise<{ success: boolean; lapTime: number; error?: string }> {
  // Validate submission
  const validation = validateSubmission(submission);
  if (!validation.valid) {
    return {
      success: false,
      lapTime: 0,
      error: validation.error,
    };
  }

  const date = getDateString();

  // Validate session access
  const sessionValidation = await validateSessionAccess(date, submission.userId, true);
  if (!sessionValidation.valid) {
    return {
      success: false,
      lapTime: 0,
      error: sessionValidation.error,
    };
  }

  // Get or create race day
  let raceDay = await getRaceDay(date);
  if (!raceDay) {
    const trackSeed = generateTrackSeed(date);
    const trackConfig = generateTrack(trackSeed);
    const modifier = generateDailyModifier(trackSeed);

    raceDay = {
      date,
      trackSeed,
      trackConfig,
      modifier,
      frozen: false,
      results: [],
    };
    // Store initial race day
    const { storeRaceDay } = await import('../storage/raceStorage');
    await storeRaceDay(raceDay);
  }

  // Simulate lap (race mode, no telemetry noise)
  const seedSuffix = 'race';
  const lapTime = simulateLap(
    raceDay.trackConfig,
    raceDay.modifier,
    submission,
    submission.userId,
    seedSuffix,
    false // isPractice = false
  );

  // Store race submission
  await storeRaceSubmission(date, submission, lapTime);

  return {
    success: true,
    lapTime,
  };
}

/**
 * Get practice leaderboard for current session
 */
export async function getPracticeLeaderboard(
  date: string,
  sessionType: string
): Promise<PracticeSession[]> {
  const sessions = await getAllPracticeSessions(date, sessionType);
  return sortPracticeSessions(sessions);
}

/**
 * Get race leaderboard
 */
export async function getRaceLeaderboard(date: string) {
  const results = await getAllRaceResults(date);
  return sortRaceResults(results);
}
