import type { TrackConfig } from '../../shared/types';
import { createRNG } from './rng';

/**
 * Generates a deterministic track configuration from a seed
 */
export function generateTrack(trackSeed: string): TrackConfig {
  const rng = createRNG(trackSeed);

  // Generate track parameters deterministically
  const length = rng.nextFloat(3000, 7000); // Track length in meters (3-7 km)
  const corners = rng.nextInt(8, 20); // Number of corners
  const elevation = rng.nextFloat(0, 150); // Elevation change in meters
  const surfaceType = rng.nextInt(0, 2); // 0=asphalt, 1=concrete, 2=mixed
  const difficulty = rng.nextInt(20, 90); // Difficulty rating 20-90

  const surfaceMap: ('asphalt' | 'concrete' | 'mixed')[] = [
    'asphalt',
    'concrete',
    'mixed',
  ];

  return {
    seed: trackSeed,
    length: Math.round(length),
    corners,
    elevation: Math.round(elevation * 10) / 10,
    surface: surfaceMap[surfaceType],
    difficulty,
  };
}

/**
 * Generates a track seed for a given date
 */
export function generateTrackSeed(date: string): string {
  return `track:${date}`;
}
