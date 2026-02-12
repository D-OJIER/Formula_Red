import type { SessionType } from '../../shared/types';

/**
 * Determines the active session based on UTC time
 * P1: 00:00-04:00 UTC
 * P2: 04:00-08:00 UTC
 * P3: 08:00-12:00 UTC
 * P4: 12:00-16:00 UTC
 * RACE: 16:00-23:59 UTC
 * CLOSED: Outside of race day (for future use)
 */
export function getCurrentSession(date?: Date): SessionType {
  const now = date || new Date();
  const hour = now.getUTCHours();

  if (hour >= 0 && hour < 4) {
    return 'P1';
  } else if (hour >= 4 && hour < 8) {
    return 'P2';
  } else if (hour >= 8 && hour < 12) {
    return 'P3';
  } else if (hour >= 12 && hour < 16) {
    return 'P4';
  } else if (hour >= 16) {
    return 'RACE';
  }

  return 'CLOSED';
}

/**
 * Gets the date string in YYYYMMDD format
 */
export function getDateString(date?: Date): string {
  const d = date || new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Checks if a session is currently active
 */
export function isSessionActive(sessionType: SessionType): boolean {
  return sessionType !== 'CLOSED';
}

/**
 * Checks if the race is currently active
 */
export function isRaceActive(date?: Date): boolean {
  return getCurrentSession(date) === 'RACE';
}

/**
 * Checks if practice sessions are active
 */
export function isPracticeActive(date?: Date): boolean {
  const session = getCurrentSession(date);
  return session === 'P1' || session === 'P2' || session === 'P3' || session === 'P4';
}
