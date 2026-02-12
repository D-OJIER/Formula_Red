import type { SubmissionPayload, CarConfig } from '../../shared/types';
import { getDailyRace, hasOfficialResult } from '../storage/dailyRaceStorage';
import { getDateString } from './sessionTime';

/**
 * Validates a car configuration
 */
export function validateCarConfig(config: CarConfig): { valid: boolean; error?: string } {
  if (typeof config.downforce !== 'number' || config.downforce < 0 || config.downforce > 100) {
    return {
      valid: false,
      error: 'downforce must be a number between 0 and 100',
    };
  }

  if (typeof config.gearBias !== 'number' || config.gearBias < 0 || config.gearBias > 100) {
    return {
      valid: false,
      error: 'gearBias must be a number between 0 and 100',
    };
  }

  const validTyres = ['soft', 'medium', 'hard'];
  if (!validTyres.includes(config.tyres)) {
    return {
      valid: false,
      error: `tyres must be one of: ${validTyres.join(', ')}`,
    };
  }

  if (typeof config.drivingStyle !== 'number' || config.drivingStyle < 0 || config.drivingStyle > 100) {
    return {
      valid: false,
      error: 'drivingStyle must be a number between 0 and 100',
    };
  }

  if (typeof config.tacticalAbility !== 'number' || config.tacticalAbility < 0 || config.tacticalAbility > 100) {
    return {
      valid: false,
      error: 'tacticalAbility must be a number between 0 and 100',
    };
  }

  return { valid: true };
}

/**
 * Validates submission payload
 */
export function validateSubmissionPayload(
  payload: SubmissionPayload
): { valid: boolean; error?: string } {
  if (!payload.userId || !payload.username) {
    return {
      valid: false,
      error: 'userId and username are required',
    };
  }

  if (!payload.trackId || !payload.trackId.match(/^\d{8}$/)) {
    return {
      valid: false,
      error: 'trackId must be in YYYYMMDD format',
    };
  }

  // Verify trackId equals today
  const today = getDateString();
  if (payload.trackId !== today) {
    return {
      valid: false,
      error: `trackId must equal today's date (${today})`,
    };
  }

  // Verify lap time bounds (reasonable bounds: 5 seconds to 10 minutes)
  // Lower bound accounts for very short tracks, upper bound prevents unrealistic times
  // Using 5 seconds as minimum to be very permissive
  if (typeof payload.lapTime !== 'number' || isNaN(payload.lapTime) || payload.lapTime < 5 || payload.lapTime > 600) {
    return {
      valid: false,
      error: `lapTime must be between 5 and 600 seconds (received: ${payload.lapTime})`,
    };
  }

  // Validate checkpoint times
  if (!Array.isArray(payload.checkpointTimes)) {
    return {
      valid: false,
      error: 'checkpointTimes must be an array',
    };
  }

  // Allow empty checkpointTimes - we'll create defaults if needed
  // But if provided, they must be valid
  if (payload.checkpointTimes.length === 0) {
    // Empty is okay, we'll handle it on the server
    // Don't return error here
  }

  // Verify checkpoints are in ascending order (only if checkpoints provided)
  if (payload.checkpointTimes.length > 0) {
    for (let i = 1; i < payload.checkpointTimes.length; i++) {
      if (payload.checkpointTimes[i] <= payload.checkpointTimes[i - 1]) {
        return {
          valid: false,
          error: 'checkpointTimes must be in ascending order',
        };
      }
    }

    // Verify last checkpoint is less than or equal to lap time
    const lastCheckpoint = payload.checkpointTimes[payload.checkpointTimes.length - 1];
    if (lastCheckpoint > payload.lapTime) {
      return {
        valid: false,
        error: 'Last checkpoint time cannot exceed lap time',
      };
    }
  }

  // Validate replay hash
  if (!payload.replayHash || typeof payload.replayHash !== 'string') {
    return {
      valid: false,
      error: 'replayHash is required and must be a string',
    };
  }

  // Validate car config
  const configValidation = validateCarConfig(payload.config);
  if (!configValidation.valid) {
    return configValidation;
  }

  return { valid: true };
}

/**
 * Validates that submission is allowed
 */
export async function validateSubmissionAccess(
  trackId: string,
  userId: string
): Promise<{ valid: boolean; error?: string }> {
  // Verify trackId equals today
  const today = getDateString();
  if (trackId !== today) {
    return {
      valid: false,
      error: `trackId must equal today's date (${today})`,
    };
  }

  // Check if race is frozen
  const race = await getDailyRace(trackId);
  if (race?.frozen) {
    return {
      valid: false,
      error: 'Race is frozen, submissions are closed',
    };
  }

  // Check for duplicate submission
  const hasSubmitted = await hasOfficialResult(trackId, userId);
  if (hasSubmitted) {
    return {
      valid: false,
      error: 'You have already submitted for this race',
    };
  }

  return { valid: true };
}
