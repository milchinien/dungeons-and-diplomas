/**
 * Database Adapters
 *
 * Re-exports adapter types and factory functions.
 */

export type { DatabaseAdapter, AdapterType } from './types';
export { getAdapter, getAdapterType, isSupabaseMode, resetAdapter, createAdapter } from './factory';
