import type { DailyModifier } from '../../shared/types';
import { createRNG } from './rng';

const MODIFIERS: DailyModifier[] = [
  'RAIN',
  'DIRTY_AIR',
  'HIGH_TYRE_WEAR',
  'SAFETY_CAR',
  'LOW_GRIP',
];

/**
 * Generates exactly one modifier per day deterministically
 */
export function generateDailyModifier(trackSeed: string): DailyModifier {
  const rng = createRNG(`modifier:${trackSeed}`);
  const index = rng.nextInt(0, MODIFIERS.length - 1);
  return MODIFIERS[index];
}
