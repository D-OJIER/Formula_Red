import { redis } from '@devvit/web/server';
import type { PlayerProfile, OfficialRaceResult } from '../../shared/types';
import { getRedditAvatarUrl } from '../../shared/utils/avatar';

/**
 * Get player profile
 */
export async function getPlayerProfile(userId: string): Promise<PlayerProfile | null> {
  const data = await redis.get(`profile:${userId}`);
  if (!data) return null;
  const profile = JSON.parse(data) as PlayerProfile;
  // Ensure avatar URL is set
  if (!profile.avatarUrl) {
    profile.avatarUrl = getRedditAvatarUrl(userId);
  }
  return profile;
}

/**
 * Store player profile
 */
export async function storePlayerProfile(profile: PlayerProfile): Promise<void> {
  await redis.set(`profile:${profile.userId}`, JSON.stringify(profile));
}

/**
 * Update player profile from a race result
 */
export async function updatePlayerProfileFromResult(
  result: OfficialRaceResult
): Promise<void> {
  const profile = await getPlayerProfile(result.userId);
  
  const updatedProfile: PlayerProfile = profile
    ? {
        ...profile,
        username: result.username,
        racesParticipated: profile.racesParticipated + 1,
        racesWon: result.position === 1 ? profile.racesWon + 1 : profile.racesWon,
        totalPoints: profile.totalPoints + result.points,
        podiumCount: result.position <= 3 ? profile.podiumCount + 1 : profile.podiumCount,
        bestPosition: Math.min(profile.bestPosition, result.position),
        recentRaces: [
          {
            trackId: result.trackId,
            position: result.position,
            points: result.points,
            lapTime: result.lapTime,
            timestamp: result.timestamp,
          },
          ...profile.recentRaces.slice(0, 9), // Keep last 10 races
        ],
        avatarUrl: result.avatarUrl || profile.avatarUrl || getRedditAvatarUrl(result.userId),
      }
    : {
        userId: result.userId,
        username: result.username,
        racesParticipated: 1,
        racesWon: result.position === 1 ? 1 : 0,
        totalPoints: result.points,
        podiumCount: result.position <= 3 ? 1 : 0,
        bestPosition: result.position,
        recentRaces: [
          {
            trackId: result.trackId,
            position: result.position,
            points: result.points,
            lapTime: result.lapTime,
            timestamp: result.timestamp,
          },
        ],
        avatarUrl: result.avatarUrl || getRedditAvatarUrl(result.userId),
      };

  await redis.set(`profile:${result.userId}`, JSON.stringify(updatedProfile));
}
