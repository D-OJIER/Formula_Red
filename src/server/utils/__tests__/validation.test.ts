import { describe, it, expect } from 'vitest';
import { validateSubmissionPayload, validateCarConfig } from '../validation';
import type { SubmissionPayload, CarConfig } from '../../../shared/types';

describe('Submission Validation', () => {
  const createValidPayload = (): SubmissionPayload => ({
    userId: 'test-user',
    username: 'TestUser',
    trackId: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    lapTime: 120.5,
    config: {
      downforce: 50,
      gearBias: 50,
      tyres: 'medium',
      drivingStyle: 50,
      tacticalAbility: 50,
    },
    checkpointTimes: [30, 60, 90, 120],
    replayHash: 'a'.repeat(32),
  });

  it('should validate valid submission payload', () => {
    const payload = createValidPayload();
    const result = validateSubmissionPayload(payload);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid trackId format', () => {
    const payload = createValidPayload();
    payload.trackId = 'invalid';
    const result = validateSubmissionPayload(payload);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('trackId');
  });

  it('should reject lap time out of bounds', () => {
    const payload = createValidPayload();
    payload.lapTime = 5; // Too fast (below 10 seconds)
    const result = validateSubmissionPayload(payload);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('lapTime');

    payload.lapTime = 700; // Too slow (above 600 seconds)
    const result2 = validateSubmissionPayload(payload);
    expect(result2.valid).toBe(false);
    expect(result2.error).toContain('lapTime');
  });

  it('should reject invalid checkpoint order', () => {
    const payload = createValidPayload();
    payload.checkpointTimes = [60, 30, 90, 120]; // Not ascending
    const result = validateSubmissionPayload(payload);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('ascending');
  });

  it('should reject checkpoint time exceeding lap time', () => {
    const payload = createValidPayload();
    payload.checkpointTimes = [30, 60, 90, 150]; // Last checkpoint > lapTime
    const result = validateSubmissionPayload(payload);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceed');
  });

  it('should validate car config', () => {
    const config: CarConfig = {
      downforce: 50,
      gearBias: 50,
      tyres: 'medium',
      drivingStyle: 50,
      tacticalAbility: 50,
    };
    const result = validateCarConfig(config);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid car config values', () => {
    const config: CarConfig = {
      downforce: 150, // Out of range
      gearBias: 50,
      tyres: 'medium',
      drivingStyle: 50,
      tacticalAbility: 50,
    };
    const result = validateCarConfig(config);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('downforce');
  });
});
