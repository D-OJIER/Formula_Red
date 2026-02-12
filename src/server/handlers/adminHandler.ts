import { reddit } from '@devvit/web/server';
import { getRaceDay, freezeRace, updateRaceResults } from '../storage/raceStorage';
import { resetPracticeSessions } from '../storage/practiceStorage';
import { finalizeRaceDay } from '../utils/finalization';
import { sortRaceResults, assignPositions } from '../utils/leaderboard';
import { calculatePoints } from '../utils/points';

/**
 * Check if current user is a moderator
 */
export async function isModerator(): Promise<boolean> {
  try {
    const username = await reddit.getCurrentUsername();
    if (!username) return false;
    
    const { context } = await import('@devvit/web/server');
    const subreddit = context.subreddit;
    if (!subreddit) return false;

    // Check if user is moderator (this would need proper Reddit API call)
    // For now, we'll use a simple check - in production, use reddit API
    return false; // Placeholder - implement proper moderator check
  } catch {
    return false;
  }
}

/**
 * Force freeze a race
 */
export async function adminForceFreezeRace(date: string): Promise<{ success: boolean; error?: string }> {
  if (!(await isModerator())) {
    return {
      success: false,
      error: 'Unauthorized: Moderator access required',
    };
  }

  try {
    await freezeRace(date);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Recompute race results
 */
export async function adminRecomputeRaceResults(
  date: string
): Promise<{ success: boolean; error?: string }> {
  if (!(await isModerator())) {
    return {
      success: false,
      error: 'Unauthorized: Moderator access required',
    };
  }

  try {
    const raceDay = await getRaceDay(date);
    if (!raceDay) {
      return {
        success: false,
        error: `Race day ${date} not found`,
      };
    }

    if (!raceDay.results || raceDay.results.length === 0) {
      return {
        success: false,
        error: 'No results to recompute',
      };
    }

    // Sort and assign positions
    let results = sortRaceResults(raceDay.results);
    results = assignPositions(results);

    // Recalculate points
    results = results.map((result) => ({
      ...result,
      points: calculatePoints(result.position),
    }));

    // Update race results
    await updateRaceResults(date, results);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reset practice sessions for a date
 */
export async function adminResetPracticeSessions(
  date: string
): Promise<{ success: boolean; error?: string }> {
  if (!(await isModerator())) {
    return {
      success: false,
      error: 'Unauthorized: Moderator access required',
    };
  }

  try {
    await resetPracticeSessions(date);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Force finalize a race day
 */
export async function adminFinalizeRaceDay(
  date: string
): Promise<{ success: boolean; error?: string; podium?: any }> {
  if (!(await isModerator())) {
    return {
      success: false,
      error: 'Unauthorized: Moderator access required',
    };
  }

  try {
    const podium = await finalizeRaceDay(date);
    return { success: true, podium };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
