import { NextResponse } from 'next/server';

/**
 * API parameter validation utilities.
 * Reduces duplication in API route handlers.
 */

/**
 * Result of parameter validation
 */
export type ValidationResult<T> =
  | { success: true; value: T }
  | { success: false; error: NextResponse };

/**
 * Get a required string parameter from URL search params.
 * Returns error response if parameter is missing.
 */
export function getRequiredStringParam(
  searchParams: URLSearchParams,
  paramName: string
): ValidationResult<string> {
  const value = searchParams.get(paramName);

  if (!value) {
    return {
      success: false,
      error: NextResponse.json(
        { error: `Missing ${paramName} parameter` },
        { status: 400 }
      )
    };
  }

  return { success: true, value };
}

/**
 * Get a required integer parameter from URL search params.
 * Returns error response if parameter is missing or not a valid integer.
 */
export function getRequiredIntParam(
  searchParams: URLSearchParams,
  paramName: string
): ValidationResult<number> {
  const stringResult = getRequiredStringParam(searchParams, paramName);

  if (!stringResult.success) {
    return stringResult;
  }

  const value = parseInt(stringResult.value, 10);

  if (isNaN(value)) {
    return {
      success: false,
      error: NextResponse.json(
        { error: `Invalid ${paramName} parameter: must be an integer` },
        { status: 400 }
      )
    };
  }

  return { success: true, value };
}

/**
 * Get an optional string parameter from URL search params.
 * Returns null if parameter is missing.
 */
export function getOptionalStringParam(
  searchParams: URLSearchParams,
  paramName: string
): string | null {
  return searchParams.get(paramName);
}

/**
 * Get an optional integer parameter from URL search params.
 * Returns null if parameter is missing, error if invalid.
 */
export function getOptionalIntParam(
  searchParams: URLSearchParams,
  paramName: string
): ValidationResult<number | null> {
  const value = searchParams.get(paramName);

  if (!value) {
    return { success: true, value: null };
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed)) {
    return {
      success: false,
      error: NextResponse.json(
        { error: `Invalid ${paramName} parameter: must be an integer` },
        { status: 400 }
      )
    };
  }

  return { success: true, value: parsed };
}

/**
 * Parse an integer from a route parameter (e.g., [id]).
 * Returns error response if not a valid integer.
 */
export function parseRouteIntParam(
  value: string,
  paramName: string = 'id'
): ValidationResult<number> {
  const parsed = parseInt(value, 10);

  if (isNaN(parsed)) {
    return {
      success: false,
      error: NextResponse.json(
        { error: `Invalid ${paramName}: must be an integer` },
        { status: 400 }
      )
    };
  }

  return { success: true, value: parsed };
}

/**
 * Extract searchParams from request URL
 */
export function getSearchParams(request: Request): URLSearchParams {
  return new URL(request.url).searchParams;
}

// =============================================================================
// POST Body Validation
// =============================================================================

/**
 * Validate that a value is a positive integer (> 0)
 */
export function validatePositiveInt(
  value: unknown,
  fieldName: string
): ValidationResult<number> {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    return {
      success: false,
      error: NextResponse.json(
        { error: `Valid ${fieldName} is required (must be a positive integer)` },
        { status: 400 }
      )
    };
  }
  return { success: true, value };
}

/**
 * Validate that a value is a non-negative integer (>= 0)
 */
export function validateNonNegativeInt(
  value: unknown,
  fieldName: string
): ValidationResult<number> {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return {
      success: false,
      error: NextResponse.json(
        { error: `Valid ${fieldName} is required (must be a non-negative integer)` },
        { status: 400 }
      )
    };
  }
  return { success: true, value };
}

/**
 * Validate that a value is a boolean
 */
export function validateBoolean(
  value: unknown,
  fieldName: string
): ValidationResult<boolean> {
  if (typeof value !== 'boolean') {
    return {
      success: false,
      error: NextResponse.json(
        { error: `${fieldName} must be a boolean` },
        { status: 400 }
      )
    };
  }
  return { success: true, value };
}

/**
 * Validate that a value is a non-empty string
 */
export function validateNonEmptyString(
  value: unknown,
  fieldName: string
): ValidationResult<string> {
  if (typeof value !== 'string' || value.trim() === '') {
    return {
      success: false,
      error: NextResponse.json(
        { error: `${fieldName} must be a non-empty string` },
        { status: 400 }
      )
    };
  }
  return { success: true, value };
}

/**
 * Validate an integer that can be -1 (for timeout) or >= 0
 */
export function validateAnswerIndex(
  value: unknown,
  fieldName: string
): ValidationResult<number> {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < -1) {
    return {
      success: false,
      error: NextResponse.json(
        { error: `Valid ${fieldName} is required (must be >= -1)` },
        { status: 400 }
      )
    };
  }
  return { success: true, value };
}
