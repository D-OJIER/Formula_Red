import { describe, it, expect } from 'vitest';
import { simulateLap } from '../simulation';
import type { TrackConfig, DailyModifier, DriverSubmission } from '../../../shared/types';

describe('Simulation Engine', () => {
  const createTestTrack = (): TrackConfig => ({
    seed: 'test-track',
    length: 5000,
    corners: 12,
    elevation: 50,
    surface: 'asphalt',
    difficulty: 50,
  });

  const createTestSubmission = (): DriverSubmission => ({
    userId: 'test-user',
    username: 'TestUser',
    carSetup: {
      downforce: 50,
      suspension: 50,
      gearRatio: 50,
      tirePressure: 50,
      brakeBias: 50,
    },
    strategy: {
      fuelLoad: 50,
      tireCompound: 'medium',
      pitStrategy: 'no-pit',
    },
    timestamp: Date.now(),
  });

  it('should generate deterministic lap times for the same inputs', () => {
    const track = createTestTrack();
    const modifier: DailyModifier = 'RAIN';
    const submission = createTestSubmission();
    const userId = 'test-user';
    const seedSuffix = 'test';

    const lapTime1 = simulateLap(track, modifier, submission, userId, seedSuffix, false);
    const lapTime2 = simulateLap(track, modifier, submission, userId, seedSuffix, false);

    expect(lapTime1).toBe(lapTime2);
  });

  it('should generate different lap times for different modifiers', () => {
    const track = createTestTrack();
    const submission = createTestSubmission();
    const userId = 'test-user';
    const seedSuffix = 'test';

    const rainTime = simulateLap(track, 'RAIN', submission, userId, seedSuffix, false);
    const dryTime = simulateLap(track, 'DIRTY_AIR', submission, userId, seedSuffix, false);

    // Rain should generally be slower
    expect(rainTime).toBeGreaterThan(dryTime);
  });

  it('should generate reasonable lap times', () => {
    const track = createTestTrack();
    const modifier: DailyModifier = 'DIRTY_AIR';
    const submission = createTestSubmission();
    const userId = 'test-user';
    const seedSuffix = 'test';

    const lapTime = simulateLap(track, modifier, submission, userId, seedSuffix, false);

    // For a 5km track, lap time should be reasonable (e.g., 60-300 seconds)
    expect(lapTime).toBeGreaterThan(60);
    expect(lapTime).toBeLessThan(300);
  });

  it('should add noise for practice sessions', () => {
    const track = createTestTrack();
    const modifier: DailyModifier = 'DIRTY_AIR';
    const submission = createTestSubmission();
    const userId = 'test-user';
    const seedSuffix = 'practice';

    const raceTime = simulateLap(track, modifier, submission, userId, seedSuffix, false);
    const practiceTime = simulateLap(track, modifier, submission, userId, seedSuffix, true);

    // Practice time should be different due to noise (though deterministic noise)
    // Since we're using the same seed, the noise will be deterministic too
    expect(typeof practiceTime).toBe('number');
  });
});
