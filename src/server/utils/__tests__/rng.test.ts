import { describe, it, expect } from 'vitest';
import { createRNG, combineSeeds } from '../rng';

describe('Deterministic RNG', () => {
  it('should generate the same sequence for the same seed', () => {
    const rng1 = createRNG('test-seed');
    const rng2 = createRNG('test-seed');

    const values1 = Array.from({ length: 10 }, () => rng1.next());
    const values2 = Array.from({ length: 10 }, () => rng2.next());

    expect(values1).toEqual(values2);
  });

  it('should generate different sequences for different seeds', () => {
    const rng1 = createRNG('seed1');
    const rng2 = createRNG('seed2');

    const value1 = rng1.next();
    const value2 = rng2.next();

    expect(value1).not.toBe(value2);
  });

  it('should generate integers in the specified range', () => {
    const rng = createRNG('test');
    const min = 5;
    const max = 10;

    for (let i = 0; i < 100; i++) {
      const value = rng.nextInt(min, max);
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThanOrEqual(max);
    }
  });

  it('should generate floats in the specified range', () => {
    const rng = createRNG('test');
    const min = 5.5;
    const max = 10.5;

    for (let i = 0; i < 100; i++) {
      const value = rng.nextFloat(min, max);
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThan(max);
    }
  });

  it('should combine seeds correctly', () => {
    const combined = combineSeeds('seed1', 'seed2', 'seed3');
    expect(combined).toBe('seed1:seed2:seed3');
  });
});
