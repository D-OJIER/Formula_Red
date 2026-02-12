import { redis } from '@devvit/web/server';
import type { SeasonStanding } from '../../shared/types';

const SEASON_KEY = 'season:current';

/**
 * Get current season standings
 */
export async function getSeasonStandings(): Promise<SeasonStanding[]> {
  const data = await redis.get(SEASON_KEY);
  if (!data) return [];
  return JSON.parse(data) as SeasonStanding[];
}

/**
 * Store season standings
 */
export async function storeSeasonStandings(
  standings: SeasonStanding[]
): Promise<void> {
  await redis.set(SEASON_KEY, JSON.stringify(standings));
}

/**
 * Get standing for a specific user
 */
export async function getUserStanding(
  userId: string
): Promise<SeasonStanding | null> {
  const standings = await getSeasonStandings();
  return standings.find((s) => s.userId === userId) || null;
}

/**
 * Initialize or update a user's standing
 */
export async function updateUserStanding(
  userId: string,
  username: string,
  points: number,
  position: number
): Promise<void> {
  const standings = await getSeasonStandings();
  let standing = standings.find((s) => s.userId === userId);

  if (!standing) {
    standing = {
      userId,
      username,
      totalPoints: 0,
      racesPlayed: 0,
      podiumCount: 0,
      wins: 0,
      positions: [],
    };
    standings.push(standing);
  }

  // Update standing
  standing.username = username; // Update username in case it changed
  standing.totalPoints += points;
  standing.racesPlayed += 1;
  standing.positions.push(position);

  if (position === 1) {
    standing.wins += 1;
  }
  if (position <= 3) {
    standing.podiumCount += 1;
  }

  await storeSeasonStandings(standings);
}

/**
 * Reset season standings
 */
export async function resetSeasonStandings(): Promise<void> {
  await redis.del(SEASON_KEY);
}
