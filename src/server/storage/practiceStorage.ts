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
  await redis.set(key, JSON.stringify(session));
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
 * Get all practice sessions for a specific date and session type
 */
export async function getAllPracticeSessions(
  date: string,
  sessionType: string
): Promise<PracticeSession[]> {
  const pattern = `practice:${date}:${sessionType}:*`;
  const keys = await redis.keys(pattern);
  const sessions: PracticeSession[] = [];

  for (const key of keys) {
    const data = await redis.get(key);
    if (data) {
      sessions.push(JSON.parse(data) as PracticeSession);
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
  const pattern = `practice:${date}:*`;
  const keys = await redis.keys(pattern);
  for (const key of keys) {
    await redis.del(key);
  }
}
