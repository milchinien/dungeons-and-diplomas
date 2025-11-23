/**
 * Clock interface for time-related operations.
 * Allows injection of custom clock implementations for testing.
 */
export interface Clock {
  /**
   * Returns the current timestamp in milliseconds.
   */
  now(): number;
}

/**
 * Default system clock implementation using Date.now().
 */
export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}

/**
 * Mock clock for testing with controllable time.
 */
export class MockClock implements Clock {
  private currentTime: number;

  constructor(initialTime: number = 0) {
    this.currentTime = initialTime;
  }

  now(): number {
    return this.currentTime;
  }

  /**
   * Set the current time to a specific value.
   */
  setTime(time: number): void {
    this.currentTime = time;
  }

  /**
   * Advance time by the specified amount of milliseconds.
   */
  advance(ms: number): void {
    this.currentTime += ms;
  }
}

/**
 * Default clock instance for production use.
 */
export const defaultClock: Clock = new SystemClock();
