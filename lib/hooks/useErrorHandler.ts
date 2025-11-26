/**
 * Centralized Error Handler for React Hooks
 *
 * Provides consistent error handling, logging, and optional user feedback.
 * Replaces scattered console.error calls with a unified approach.
 */

import { useCallback, useState } from 'react';
import { ApiError } from '@/lib/api';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'warning' | 'error' | 'critical';

/**
 * Error categories for better classification
 */
export type ErrorCategory =
  | 'network'      // API/fetch errors
  | 'validation'   // Invalid data
  | 'game'         // Game logic errors
  | 'state'        // State management errors
  | 'unknown';     // Unclassified errors

/**
 * Structured error information
 */
export interface HookError {
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: string;
  originalError?: unknown;
}

/**
 * Error handler options
 */
export interface ErrorHandlerOptions {
  /** Context name for logging (e.g., 'useCombat', 'useScoring') */
  context: string;
  /** Optional callback when error occurs */
  onError?: (error: HookError) => void;
  /** Whether to log to console (default: true in development) */
  logToConsole?: boolean;
}

/**
 * Classify an error into a category
 */
function classifyError(error: unknown): ErrorCategory {
  if (error instanceof ApiError) {
    return 'network';
  }
  if (error instanceof TypeError) {
    return 'validation';
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('fetch') || message.includes('network') || message.includes('api')) {
      return 'network';
    }
    if (message.includes('invalid') || message.includes('required') || message.includes('missing')) {
      return 'validation';
    }
  }
  return 'unknown';
}

/**
 * Extract error message from various error types
 */
function extractMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Hook for centralized error handling in React hooks
 *
 * @example
 * ```tsx
 * function useMyHook() {
 *   const { handleError, lastError, clearError } = useErrorHandler({
 *     context: 'useMyHook'
 *   });
 *
 *   const fetchData = async () => {
 *     try {
 *       const data = await api.getData();
 *       return data;
 *     } catch (error) {
 *       handleError(error, 'Failed to fetch data');
 *       return null;
 *     }
 *   };
 * }
 * ```
 */
export function useErrorHandler(options: ErrorHandlerOptions) {
  const { context, onError, logToConsole = process.env.NODE_ENV === 'development' } = options;

  const [lastError, setLastError] = useState<HookError | null>(null);

  /**
   * Handle an error with consistent logging and classification
   */
  const handleError = useCallback((
    error: unknown,
    userMessage?: string,
    severity: ErrorSeverity = 'error'
  ): HookError => {
    const category = classifyError(error);
    const message = userMessage || extractMessage(error);

    const hookError: HookError = {
      message,
      category,
      severity,
      timestamp: new Date(),
      context,
      originalError: error
    };

    setLastError(hookError);

    if (logToConsole) {
      const logMethod = severity === 'warning' ? console.warn : console.error;
      logMethod(`[${context}] ${message}`, error);
    }

    if (onError) {
      onError(hookError);
    }

    return hookError;
  }, [context, logToConsole, onError]);

  /**
   * Clear the last error
   */
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  /**
   * Wrap an async function with error handling
   */
  const withErrorHandling = useCallback(<T>(
    fn: () => Promise<T>,
    errorMessage?: string,
    severity?: ErrorSeverity
  ): Promise<T | null> => {
    return fn().catch((error) => {
      handleError(error, errorMessage, severity);
      return null;
    });
  }, [handleError]);

  return {
    handleError,
    lastError,
    clearError,
    withErrorHandling
  };
}

/**
 * Utility function for one-off error handling without hook
 * Useful in callbacks where hooks can't be used
 */
export function logHookError(
  context: string,
  error: unknown,
  userMessage?: string
): void {
  const category = classifyError(error);
  const message = userMessage || extractMessage(error);

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}] ${message}`, { category, error });
  }
}
