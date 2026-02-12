import { finalizeRaceDay } from '../utils/finalization';
import { getDateString } from '../utils/sessionTime';

/**
 * Scheduled job to finalize races at the end of each day
 * This should be called daily at a scheduled time (e.g., 00:00 UTC)
 */
export async function runDailyFinalization(): Promise<void> {
  // Finalize yesterday's race (since we're running at 00:00 UTC)
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const trackId = getDateString(yesterday);

  try {
    await finalizeRaceDay(trackId);
    console.log(`Successfully finalized race for ${trackId}`);
  } catch (error) {
    console.error(`Failed to finalize race for ${trackId}:`, error);
    throw error;
  }
}
