/**
 * Seeded Random Number Generator using Mulberry32
 *
 * Provides reproducible random sequences for dungeon generation.
 * Mulberry32 is a simple, fast PRNG with good statistical properties.
 *
 * @see https://stackoverflow.com/a/47593316
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    // Ensure seed is a 32-bit integer
    this.seed = seed >>> 0;
  }

  /**
   * Get the next random number in the sequence (0-1)
   *
   * Mulberry32 algorithm:
   * - Good statistical properties
   * - Fast execution
   * - Simple implementation
   */
  next(): number {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  /**
   * Get a random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Get a random integer between 0 (inclusive) and max (exclusive)
   */
  nextIntMax(max: number): number {
    return Math.floor(this.next() * max);
  }

  /**
   * Get a random boolean with the given probability (0-1)
   *
   * @param probability Chance of returning true (default: 0.5)
   */
  nextBoolean(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Reset the seed to a new value
   */
  setSeed(seed: number): void {
    this.seed = seed >>> 0;
  }

  /**
   * Get the current seed value
   */
  getSeed(): number {
    return this.seed;
  }
}
