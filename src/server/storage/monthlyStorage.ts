import { redis } from '@devvit/web/server';
import type { MonthlyStanding } from '../../shared/types';
import { getRedditAvatarUrl } from '../../shared/utils/avatar';

/**
 * Get the current month key (YYYYMM format)
 */
function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
}

/**
 * Get monthly standings for a specific month
 */
export async function getMonthlyStandings(monthKey?: string): Promise<MonthlyStanding[]> {
  const key = monthKey || getCurrentMonthKey();
  const data = await redis.get(`monthly:${key}`);
  if (!data) return [];
  const standings = JSON.parse(data) as MonthlyStanding[];
  // Ensure all standings have avatar URLs
  return standings.map((s) => ({
    ...s,
    avatarUrl: s.avatarUrl || getRedditAvatarUrl(s.userId),
  }));
}

/**
 * Store monthly standings for a specific month
 */
export async function storeMonthlyStandings(
  standings: MonthlyStanding[],
  monthKey?: string
): Promise<void> {
  const key = monthKey || getCurrentMonthKey();
  await redis.set(`monthly:${key}`, JSON.stringify(standings));
}

/**
 * Check if monthly standings need to be reset (new month)
 * This should be called before updating standings
 * Note: Monthly standings automatically reset when a new month starts
 * because we use month-specific keys (monthly:YYYYMM)
 */
export async function checkAndResetMonthlyIfNeeded(): Promise<void> {
  // No action needed - monthly standings are automatically isolated by month key
  // Each month gets its own key (monthly:YYYYMM), so there's no need to explicitly reset
  // The standings for the current month will be empty if no races have been completed yet
}

/**
 * Update a user's monthly standing
 */
export async function updateMonthlyStanding(
  userId: string,
  username: string,
  points: number,
  position: number
): Promise<void> {
  // Check if we need to reset for new month
  await checkAndResetMonthlyIfNeeded();
  
  const monthKey = getCurrentMonthKey();
  const standings = await getMonthlyStandings(monthKey);
  let standing = standings.find((s) => s.userId === userId);

  if (!standing) {
    standing = {
      userId,
      username,
      totalPoints: 0,
      racesPlayed: 0,
      wins: 0,
      podiumCount: 0,
      avatarUrl: getRedditAvatarUrl(userId),
    };
    standings.push(standing);
  }

  // Update standing
  standing.username = username;
  standing.totalPoints += points;
  standing.racesPlayed += 1;

  if (position === 1) {
    standing.wins += 1;
  }
  if (position <= 3) {
    standing.podiumCount += 1;
  }

  await storeMonthlyStandings(standings, monthKey);
}

/**
 * Reset monthly standings (called at start of new month)
 */
export async function resetMonthlyStandings(monthKey?: string): Promise<void> {
  const key = monthKey || getCurrentMonthKey();
  await redis.del(`monthly:${key}`);
}

/**
 * Export the helper function
 */
export function getMonthKey(): string {
  return getCurrentMonthKey();
}
