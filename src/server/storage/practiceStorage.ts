import { redis } from '@devvit/web/server';
import type { PracticeSession } from '../../shared/types';
import { getDateString } from '../utils/sessionTime';

/**
 * Get practice session key
 */
function getPracticeKey(date: string, sessionType: string, userId: string): string {
  return `practice:${date}:${sessionType}:${userId}`;
}

/**
 * Store a practice session result
 */
export async function storePracticeSession(
  session: PracticeSession
): Promise<void> {
  const key = getPracticeKey(
    session.date,
    session.sessionType,
    session.userId
  );
  
  // Store the session
  await redis.set(key, JSON.stringify(session));
  
  // Update the index
  const indexKey = getPracticeIndexKey(session.date, session.sessionType);
  const indexData = await redis.get(indexKey);
  const userIds = indexData ? (JSON.parse(indexData) as string[]) : [];
  
  // Add userId to index if not already present
  if (!userIds.includes(session.userId)) {
    userIds.push(session.userId);
    await redis.set(indexKey, JSON.stringify(userIds));
  }
}

/**
 * Get a practice session result
 */
export async function getPracticeSession(
  date: string,
  sessionType: string,
  userId: string
): Promise<PracticeSession | null> {
  const key = getPracticeKey(date, sessionType, userId);
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as PracticeSession;
}

/**
 * Get index key for practice sessions
 */
function getPracticeIndexKey(date: string, sessionType: string): string {
  return `practice:index:${date}:${sessionType}`;
}

/**
 * Get all practice sessions for a specific date and session type
 */
export async function getAllPracticeSessions(
  date: string,
  sessionType: string
): Promise<PracticeSession[]> {
  const indexKey = getPracticeIndexKey(date, sessionType);
  const indexData = await redis.get(indexKey);
  
  if (!indexData) {
    return [];
  }

  const userIds = JSON.parse(indexData) as string[];
  const sessions: PracticeSession[] = [];

  // Fetch all sessions in parallel
  const sessionPromises = userIds.map((userId) =>
    getPracticeSession(date, sessionType, userId)
  );
  const results = await Promise.all(sessionPromises);

  for (const session of results) {
    if (session) {
      sessions.push(session);
    }
  }

  return sessions;
}

/**
 * Check if user has already submitted for a practice session
 */
export async function hasPracticeSubmission(
  date: string,
  sessionType: string,
  userId: string
): Promise<boolean> {
  const session = await getPracticeSession(date, sessionType, userId);
  return session !== null;
}

/**
 * Reset practice sessions for a specific date
 */
export async function resetPracticeSessions(date: string): Promise<void> {
  const sessionTypes = ['P1', 'P2', 'P3', 'P4'];
  
  for (const sessionType of sessionTypes) {
    const indexKey = getPracticeIndexKey(date, sessionType);
    const indexData = await redis.get(indexKey);
    
    if (indexData) {
      const userIds = JSON.parse(indexData) as string[];
      
      // Delete all session keys
      for (const userId of userIds) {
        const key = getPracticeKey(date, sessionType, userId);
        await redis.del(key);
      }
      
      // Delete the index
      await redis.del(indexKey);
    }
  }
}
