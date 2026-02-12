// Deterministic RNG utility for Formula Red
// Uses a seeded random number generator to ensure reproducibility

export type SeededRNG = {
  seed: number;
  next: () => number;
  nextInt: (min: number, max: number) => number;
  nextFloat: (min: number, max: number) => number;
};

/**
 * Creates a deterministic RNG from a seed string
 */
export function createRNG(seed: string): SeededRNG {
  // Convert string seed to numeric seed using hash
  let numericSeed = hashString(seed);

  // Simple Linear Congruential Generator (LCG)
  // Using parameters from Numerical Recipes
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);

  const rng: SeededRNG = {
    seed: numericSeed,
    next: () => {
      numericSeed = (a * numericSeed + c) % m;
      return numericSeed / m;
    },
    nextInt: (min: number, max: number) => {
      return Math.floor(rng.next() * (max - min + 1)) + min;
    },
    nextFloat: (min: number, max: number) => {
      return rng.next() * (max - min) + min;
    },
  };

  return rng;
}

/**
 * Hash a string to a numeric seed
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Create a combined seed from multiple inputs
 */
export function combineSeeds(...seeds: string[]): string {
  return seeds.join(':');
}
