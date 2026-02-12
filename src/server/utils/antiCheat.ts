import type { SubmissionPayload } from '../../shared/types';

/**
 * Validates replay hash (placeholder for anti-cheat)
 */
export function validateReplayHash(
  replayHash: string,
  payload: SubmissionPayload
): { valid: boolean; suspicious: boolean; reason?: string } {
  // Placeholder: In production, this would verify the hash matches the replay data
  // For now, just check format
  if (!replayHash || replayHash.length < 32) {
    return {
      valid: false,
      suspicious: true,
      reason: 'Invalid replay hash format',
    };
  }

  return { valid: true, suspicious: false };
}

/**
 * Checks for suspicious race completion time
 * Note: This checks total race time, not individual lap time
 */
export function checkSuspiciousLapTime(
  lapTime: number, // Actually total race completion time
  trackLength: number
): { suspicious: boolean; reason?: string } {
  // Calculate minimum theoretical time per lap
  // Assuming max speed of 300 km/h = 83.33 m/s
  const maxSpeed = 83.33;
  const minTheoreticalTimePerLap = trackLength / maxSpeed;
  
  // For total race time, we need at least 3 laps typically
  // So minimum theoretical total time would be ~3x single lap time
  const minTheoreticalTotalTime = minTheoreticalTimePerLap * 2; // At least 2 laps worth

  // If total time is less than 50% of theoretical minimum, flag as suspicious
  // More lenient threshold since this is total race time, not single lap
  if (lapTime < minTheoreticalTotalTime * 0.5) {
    return {
      suspicious: true,
      reason: `Race completion time ${lapTime.toFixed(2)}s seems suspiciously fast for track length ${trackLength}m`,
    };
  }

  return { suspicious: false };
}

/**
 * Detects duplicated checkpoints
 */
export function detectDuplicatedCheckpoints(
  checkpointTimes: number[]
): { suspicious: boolean; reason?: string } {
  // Check for duplicate checkpoint times
  const seen = new Set<number>();
  for (const time of checkpointTimes) {
    if (seen.has(time)) {
      return {
        suspicious: true,
        reason: 'Duplicate checkpoint times detected',
      };
    }
    seen.add(time);
  }

  // Check for checkpoints that are too close together (< 0.1s apart)
  for (let i = 1; i < checkpointTimes.length; i++) {
    const diff = checkpointTimes[i] - checkpointTimes[i - 1];
    if (diff < 0.1) {
      return {
        suspicious: true,
        reason: 'Checkpoints are too close together',
      };
    }
  }

  return { suspicious: false };
}

/**
 * Comprehensive anti-cheat check
 */
export function performAntiCheatCheck(
  payload: SubmissionPayload,
  trackLength: number
): { valid: boolean; suspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Check replay hash
  const hashCheck = validateReplayHash(payload.replayHash, payload);
  if (!hashCheck.valid || hashCheck.suspicious) {
    reasons.push(hashCheck.reason || 'Replay hash validation failed');
  }

  // Check lap time
  const timeCheck = checkSuspiciousLapTime(payload.lapTime, trackLength);
  if (timeCheck.suspicious) {
    reasons.push(timeCheck.reason || 'Suspicious lap time');
  }

  // Check checkpoints
  const checkpointCheck = detectDuplicatedCheckpoints(payload.checkpointTimes);
  if (checkpointCheck.suspicious) {
    reasons.push(checkpointCheck.reason || 'Suspicious checkpoint data');
  }

  const suspicious = reasons.length > 0;
  const valid = !suspicious || reasons.length < 2; // Allow if only one minor issue

  return {
    valid,
    suspicious,
    reasons,
  };
}
