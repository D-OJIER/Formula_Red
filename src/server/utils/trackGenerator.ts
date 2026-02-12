import type { TrackConfig } from '../../shared/types';
import { createRNG } from './rng';

/**
 * Generates a deterministic track configuration from a trackId (YYYYMMDD)
 */
export function generateDailyTrack(trackId: string): TrackConfig {
  const rng = createRNG(`track:${trackId}`);

  // Generate track parameters deterministically
  const length = rng.nextFloat(3000, 7000); // Track length in meters (3-7 km)
  const cornerDensity = rng.nextInt(20, 80); // 20-80% corner density
  const straightRatio = rng.nextInt(30, 70); // 30-70% straight sections
  const width = rng.nextFloat(10, 15); // Track width in meters
  const surfaceGrip = rng.nextInt(60, 95); // 60-95 grip level
  const weatherProbability = rng.nextInt(0, 30); // 0-30% chance of weather

  // Generate elevation profile (array of elevation points)
  const numPoints = rng.nextInt(10, 20);
  const elevationProfile: number[] = [];
  let currentElevation = 0;
  
  for (let i = 0; i < numPoints; i++) {
    const change = rng.nextFloat(-20, 20);
    currentElevation = Math.max(0, Math.min(150, currentElevation + change));
    elevationProfile.push(Math.round(currentElevation * 10) / 10);
  }

  return {
    trackId,
    length: Math.round(length),
    cornerDensity,
    straightRatio,
    width: Math.round(width * 10) / 10,
    surfaceGrip,
    elevationProfile,
    weatherProbability,
  };
}

/**
 * Generate number of laps required for a race (deterministic based on trackId)
 */
export function generateLapsRequired(trackId: string): number {
  const rng = createRNG(`laps:${trackId}`);
  // Generate between 3-5 laps
  return rng.nextInt(3, 5);
}
