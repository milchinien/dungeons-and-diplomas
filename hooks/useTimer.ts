import { useState, useRef, useCallback } from 'react';

/**
 * Timer scheduler interface for dependency injection
 */
interface TimerScheduler {
  setInterval: typeof setInterval;
  clearInterval: typeof clearInterval;
}

/**
 * Default scheduler using global timer functions.
 * Defined outside component to maintain stable reference.
 */
const DEFAULT_SCHEDULER: TimerScheduler = {
  setInterval: globalThis.setInterval.bind(globalThis),
  clearInterval: globalThis.clearInterval.bind(globalThis)
};

/**
 * Timer configuration
 */
interface UseTimerOptions {
  /** Initial duration in seconds */
  initialDuration: number;
  /** Callback when timer reaches zero */
  onExpire: () => void;
  /** Optional scheduler for testing (default: window.setInterval/clearInterval) */
  scheduler?: TimerScheduler;
}

/**
 * Return type for useTimer hook
 */
interface UseTimerReturn {
  /** Current time remaining in seconds */
  timeRemaining: number;
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Start or restart the timer with optional new duration */
  start: (duration?: number) => void;
  /** Stop the timer */
  stop: () => void;
  /** Reset the timer to initial duration without starting */
  reset: () => void;
}

/**
 * Custom hook for countdown timer functionality
 *
 * Extracted from useCombat to improve testability and reusability.
 * Supports dependency injection of scheduler for deterministic testing.
 *
 * @example
 * const { timeRemaining, start, stop } = useTimer({
 *   initialDuration: 10,
 *   onExpire: () => handleTimeout()
 * });
 *
 * // Start timer
 * start();
 *
 * // Start with different duration
 * start(15);
 *
 * // Stop timer
 * stop();
 */
export function useTimer({
  initialDuration,
  onExpire,
  scheduler
}: UseTimerOptions): UseTimerReturn {
  // Use stable default scheduler reference to prevent unnecessary re-renders
  const stableScheduler = scheduler ?? DEFAULT_SCHEDULER;
  const [timeRemaining, setTimeRemaining] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);

  // Keep onExpire callback reference up to date
  onExpireRef.current = onExpire;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      stableScheduler.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [stableScheduler]);

  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const start = useCallback((duration?: number) => {
    // Clear any existing timer
    clearTimer();

    const targetDuration = duration ?? initialDuration;
    setTimeRemaining(targetDuration);
    setIsRunning(true);

    intervalRef.current = stableScheduler.setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          // Use setTimeout to avoid calling setState during render
          setTimeout(() => onExpireRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [initialDuration, stableScheduler, clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setTimeRemaining(initialDuration);
    setIsRunning(false);
  }, [initialDuration, clearTimer]);

  return {
    timeRemaining,
    isRunning,
    start,
    stop,
    reset
  };
}
