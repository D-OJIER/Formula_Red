import type {
  TrackConfig,
  DailyModifier,
  DriverSubmission,
  CarSetup,
} from '../../shared/types';
import { createRNG, combineSeeds } from './rng';

/**
 * Simulates a lap time based on track, modifier, and driver submission
 * @param track - Track configuration
 * @param modifier - Daily modifier affecting the race
 * @param submission - Driver's submission with car setup and strategy
 * @param userId - User ID for deterministic seeding
 * @param seedSuffix - Additional seed suffix for practice vs race
 * @param isPractice - Whether this is a practice run (adds telemetry noise)
 * @returns Lap time in seconds
 */
export function simulateLap(
  track: TrackConfig,
  modifier: DailyModifier,
  submission: DriverSubmission,
  userId: string,
  seedSuffix: string,
  isPractice: boolean = false
): number {
  const seed = combineSeeds(
    track.seed,
    modifier,
    userId,
    seedSuffix,
    submission.timestamp.toString()
  );
  const rng = createRNG(seed);

  // Base lap time calculation
  // Formula: baseTime = trackLength / averageSpeed
  // Average speed affected by track difficulty, corners, elevation

  const baseSpeed = 180; // km/h base average speed
  const speedReductionFromDifficulty = track.difficulty * 0.5; // 0-45 km/h reduction
  const speedReductionFromCorners = track.corners * 2; // 2 km/h per corner
  const speedReductionFromElevation = track.elevation * 0.1; // 0.1 km/h per meter

  let averageSpeed =
    baseSpeed -
    speedReductionFromDifficulty -
    speedReductionFromCorners -
    speedReductionFromElevation;

  // Car setup effects
  const downforceEffect = (submission.carSetup.downforce - 50) * 0.2; // -10 to +10 km/h
  const suspensionEffect = (submission.carSetup.suspension - 50) * 0.15; // -7.5 to +7.5 km/h
  const gearRatioEffect = (submission.carSetup.gearRatio - 50) * 0.1; // -5 to +5 km/h

  averageSpeed += downforceEffect + suspensionEffect + gearRatioEffect;

  // Modifier effects
  const modifierEffects: Record<DailyModifier, number> = {
    RAIN: -25, // Significant speed reduction
    DIRTY_AIR: -8, // Moderate speed reduction
    HIGH_TYRE_WEAR: -12, // Moderate speed reduction
    SAFETY_CAR: -5, // Small speed reduction
    LOW_GRIP: -15, // Moderate speed reduction
  };

  averageSpeed += modifierEffects[modifier];

  // Tire compound effects
  const tireEffects: Record<string, number> = {
    soft: 5, // Faster but more wear
    medium: 0, // Neutral
    hard: -3, // Slower but more durable
  };
  averageSpeed += tireEffects[submission.strategy.tireCompound] || 0;

  // Fuel load effects (heavier = slower)
  const fuelEffect = (submission.strategy.fuelLoad - 50) * -0.1; // -5 to +5 km/h
  averageSpeed += fuelEffect;

  // Ensure minimum speed
  averageSpeed = Math.max(80, averageSpeed);

  // Calculate base lap time: distance (km) / speed (km/h) * 3600 = seconds
  const trackLengthKm = track.length / 1000;
  let lapTime = (trackLengthKm / averageSpeed) * 3600;

  // Add telemetry noise for practice sessions only
  if (isPractice) {
    const noise = rng.nextFloat(-0.5, 0.5); // ±0.5 seconds noise
    lapTime += noise;
  }

  // Round to 3 decimal places
  return Math.round(lapTime * 1000) / 1000;
}
