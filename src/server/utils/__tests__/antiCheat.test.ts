import { describe, it, expect } from 'vitest';
import {
  checkSuspiciousLapTime,
  detectDuplicatedCheckpoints,
  validateReplayHash,
} from '../antiCheat';
import type { SubmissionPayload } from '../../../shared/types';

describe('Anti-Cheat', () => {
  it('should detect suspicious lap times', () => {
    const trackLength = 5000; // 5km track
    const minTime = trackLength / 83.33; // ~60 seconds minimum

    // Suspiciously fast
    const result1 = checkSuspiciousLapTime(minTime * 0.7, trackLength);
    expect(result1.suspicious).toBe(true);

    // Reasonable time
    const result2 = checkSuspiciousLapTime(minTime * 1.2, trackLength);
    expect(result2.suspicious).toBe(false);
  });

  it('should detect duplicated checkpoints', () => {
    // Duplicate times
    const result1 = detectDuplicatedCheckpoints([30, 60, 60, 90]);
    expect(result1.suspicious).toBe(true);
    expect(result1.reason).toContain('Duplicate');

    // Checkpoints too close
    const result2 = detectDuplicatedCheckpoints([30, 30.05, 60, 90]);
    expect(result2.suspicious).toBe(true);
    expect(result2.reason).toContain('too close');

    // Valid checkpoints
    const result3 = detectDuplicatedCheckpoints([30, 60, 90, 120]);
    expect(result3.suspicious).toBe(false);
  });

  it('should validate replay hash format', () => {
    const payload: SubmissionPayload = {
      userId: 'test',
      username: 'test',
      trackId: '20240101',
      lapTime: 120,
      config: {
        downforce: 50,
        gearBias: 50,
        tyres: 'medium',
        drivingStyle: 50,
        tacticalAbility: 50,
      },
      checkpointTimes: [30, 60, 90],
      replayHash: 'a'.repeat(32),
    };

    const result = validateReplayHash(payload.replayHash, payload);
    expect(result.valid).toBe(true);
    expect(result.suspicious).toBe(false);

    // Invalid hash
    const result2 = validateReplayHash('short', payload);
    expect(result2.valid).toBe(false);
    expect(result2.suspicious).toBe(true);
  });
});
