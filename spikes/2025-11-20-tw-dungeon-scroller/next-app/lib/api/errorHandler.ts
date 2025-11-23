import { NextResponse } from 'next/server';

/**
 * Higher-Order Function to wrap API route handlers with consistent error handling.
 *
 * @param handler - The async function that handles the request
 * @param action - A short description of the action (e.g., 'fetch subjects', 'log answer')
 * @returns A wrapped handler with try-catch error handling
 *
 * @example
 * // Before:
 * export async function GET() {
 *   try {
 *     const data = getData();
 *     return NextResponse.json(data);
 *   } catch (error) {
 *     console.error('Error fetching data:', error);
 *     return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
 *   }
 * }
 *
 * // After:
 * export const GET = withErrorHandler(async () => {
 *   const data = getData();
 *   return NextResponse.json(data);
 * }, 'fetch data');
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  action: string
): (...args: T) => Promise<NextResponse> {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error(`Error ${action}:`, error);
      return NextResponse.json(
        { error: `Failed to ${action}` },
        { status: 500 }
      );
    }
  };
}
