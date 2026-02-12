import type {
  SubmissionPayload,
  OfficialRaceResult,
  PlayerResultView,
} from '../../shared/types';
import { getDailyRace, storeOfficialResult, getAllOfficialResults, updateRaceResults } from '../storage/dailyRaceStorage';
import { generateDailyTrack } from '../utils/trackGenerator';
import { validateSubmissionPayload, validateSubmissionAccess } from '../utils/validation';
import { performAntiCheatCheck } from '../utils/antiCheat';
import { getDailyLeaderboard, assignPositions } from '../utils/leaderboard';
import { calculatePoints } from '../utils/points';
import { getRedditAvatarUrl } from '../../shared/utils/avatar';

/**
 * Handles official race submission
 */
export async function handleOfficialSubmission(
  payload: SubmissionPayload
): Promise<{ success: boolean; result?: PlayerResultView; error?: string }> {
  // Log payload for debugging
  console.log('Submission payload:', {
    lapTime: payload.lapTime,
    checkpointTimesLength: payload.checkpointTimes?.length,
    trackId: payload.trackId,
  });

  // Validate submission payload
  const validation = validateSubmissionPayload(payload);
  if (!validation.valid) {
    console.error('Validation failed:', validation.error, 'Payload:', payload);
    return {
      success: false,
      error: validation.error,
    };
  }

  // Validate submission access
  const accessValidation = await validateSubmissionAccess(payload.trackId, payload.userId);
  if (!accessValidation.valid) {
    return {
      success: false,
      error: accessValidation.error,
    };
  }

  // Get or create race
  let race = await getDailyRace(payload.trackId);
  if (!race) {
    // Create new race with track config
    const trackConfig = generateDailyTrack(payload.trackId);
    const { generateLapsRequired } = await import('../utils/trackGenerator');
    const lapsRequired = generateLapsRequired(payload.trackId);
    race = {
      trackId: payload.trackId,
      trackConfig,
      frozen: false,
      results: [],
      lapsRequired,
    };
    const { storeDailyRace } = await import('../storage/dailyRaceStorage');
    await storeDailyRace(race);
  }

  // Perform anti-cheat checks
  const antiCheatCheck = performAntiCheatCheck(payload, race.trackConfig.length);
  if (!antiCheatCheck.valid) {
    return {
      success: false,
      error: `Submission flagged: ${antiCheatCheck.reasons.join(', ')}`,
    };
  }

  // Create official result
  const result: OfficialRaceResult = {
    userId: payload.userId,
    username: payload.username,
    trackId: payload.trackId,
    lapTime: payload.lapTime,
    position: 0, // Will be set after sorting
    points: 0, // Will be set after finalization
    config: payload.config,
    checkpointTimes: payload.checkpointTimes,
    replayHash: payload.replayHash,
    timestamp: Date.now(),
    avatarUrl: getRedditAvatarUrl(payload.userId),
  };

  // Store result
  await storeOfficialResult(result);

  // Get updated leaderboard
  const allResults = await getAllOfficialResults(payload.trackId);
  const sortedResults = getDailyLeaderboard(allResults);
  const resultsWithPositions = assignPositions(sortedResults);

  // Calculate points for all results
  const resultsWithPoints = resultsWithPositions.map((r) => ({
    ...r,
    points: calculatePoints(r.position),
  }));

  // Update stored results with positions and points
  await updateRaceResults(payload.trackId, resultsWithPoints);

  // Find player's rank
  const playerResult = resultsWithPoints.find((r) => r.userId === payload.userId);
  if (!playerResult) {
    return {
      success: false,
      error: 'Failed to retrieve player result',
    };
  }

  // Get top leaderboard slice (top 10)
  const topLeaderboard = resultsWithPoints.slice(0, 10);

  return {
    success: true,
    result: {
      rank: playerResult.position,
      lapTime: playerResult.lapTime,
      leaderboard: topLeaderboard,
    },
  };
}
