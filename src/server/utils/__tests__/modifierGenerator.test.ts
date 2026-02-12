import { describe, it, expect } from 'vitest';
import { generateDailyModifier } from '../modifierGenerator';

describe('Daily Modifier Generator', () => {
  it('should generate deterministic modifiers for the same seed', () => {
    const seed = 'test-seed';
    const modifier1 = generateDailyModifier(seed);
    const modifier2 = generateDailyModifier(seed);

    expect(modifier1).toBe(modifier2);
  });

  it('should generate one of the valid modifiers', () => {
    const validModifiers = [
      'RAIN',
      'DIRTY_AIR',
      'HIGH_TYRE_WEAR',
      'SAFETY_CAR',
      'LOW_GRIP',
    ];

    for (let i = 0; i < 20; i++) {
      const modifier = generateDailyModifier(`seed-${i}`);
      expect(validModifiers).toContain(modifier);
    }
  });

  it('should generate different modifiers for different seeds', () => {
    const modifiers = new Set();
    for (let i = 0; i < 100; i++) {
      modifiers.add(generateDailyModifier(`seed-${i}`));
    }
    // Should have some variety (not all the same)
    expect(modifiers.size).toBeGreaterThan(1);
  });
});
