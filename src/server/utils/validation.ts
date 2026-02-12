import type { DriverSubmission, CarSetup, RaceStrategy } from '../../shared/types';
import { getCurrentSession, isRaceActive, isPracticeActive } from './sessionTime';
import { hasPracticeSubmission, hasRaceSubmission } from '../storage';
import { getRaceDay } from '../storage/raceStorage';

/**
 * Validates a car setup
 */
export function validateCarSetup(setup: CarSetup): { valid: boolean; error?: string } {
  const fields: (keyof CarSetup)[] = ['downforce', 'suspension', 'gearRatio', 'tirePressure', 'brakeBias'];
  
  for (const field of fields) {
    const value = setup[field];
    if (typeof value !== 'number' || value < 0 || value > 100) {
      return {
        valid: false,
        error: `${field} must be a number between 0 and 100`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validates a race strategy
 */
export function validateRaceStrategy(strategy: RaceStrategy): { valid: boolean; error?: string } {
  if (typeof strategy.fuelLoad !== 'number' || strategy.fuelLoad < 0 || strategy.fuelLoad > 100) {
    return {
      valid: false,
      error: 'fuelLoad must be a number between 0 and 100',
    };
  }

  const validCompounds = ['soft', 'medium', 'hard'];
  if (!validCompounds.includes(strategy.tireCompound)) {
    return {
      valid: false,
      error: `tireCompound must be one of: ${validCompounds.join(', ')}`,
    };
  }

  const validPitStrategies = ['no-pit', 'one-stop', 'two-stop'];
  if (!validPitStrategies.includes(strategy.pitStrategy)) {
    return {
      valid: false,
      error: `pitStrategy must be one of: ${validPitStrategies.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validates a driver submission
 */
export function validateSubmission(submission: DriverSubmission): { valid: boolean; error?: string } {
  if (!submission.userId || !submission.username) {
    return {
      valid: false,
      error: 'userId and username are required',
    };
  }

  const setupValidation = validateCarSetup(submission.carSetup);
  if (!setupValidation.valid) {
    return setupValidation;
  }

  const strategyValidation = validateRaceStrategy(submission.strategy);
  if (!strategyValidation.valid) {
    return strategyValidation;
  }

  if (!submission.timestamp || submission.timestamp <= 0) {
    return {
      valid: false,
      error: 'timestamp must be a positive number',
    };
  }

  return { valid: true };
}

/**
 * Validates that the current session allows submissions
 */
export async function validateSessionAccess(
  date: string,
  userId: string,
  isRace: boolean
): Promise<{ valid: boolean; error?: string }> {
  const currentSession = getCurrentSession();
  
  if (currentSession === 'CLOSED') {
    return {
      valid: false,
      error: 'No active session',
    };
  }

  if (isRace) {
    if (!isRaceActive()) {
      return {
        valid: false,
        error: 'Race session is not active',
      };
    }

    // Check if race is frozen
    const raceDay = await getRaceDay(date);
    if (raceDay?.frozen) {
      return {
        valid: false,
        error: 'Race is frozen, submissions are closed',
      };
    }

    // Check for duplicate submission
    const hasSubmitted = await hasRaceSubmission(date, userId);
    if (hasSubmitted) {
      return {
        valid: false,
        error: 'You have already submitted for this race',
      };
    }
  } else {
    if (!isPracticeActive()) {
      return {
        valid: false,
        error: 'Practice session is not active',
      };
    }

    // Check for duplicate submission in current practice session
    const hasSubmitted = await hasPracticeSubmission(date, currentSession, userId);
    if (hasSubmitted) {
      return {
        valid: false,
        error: `You have already submitted for ${currentSession}`,
      };
    }
  }

  return { valid: true };
}
