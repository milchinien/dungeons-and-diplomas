/**
 * Database Adapter Factory
 *
 * Selects and caches the appropriate database adapter based on environment variables.
 *
 * - If NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set: use Supabase
 * - Otherwise: use SQLite (local development)
 */

import type { DatabaseAdapter, AdapterType } from './types';

// Singleton adapter instance
let adapterInstance: DatabaseAdapter | null = null;

/**
 * Check if running on Vercel
 */
export function isVercel(): boolean {
  return !!process.env.VERCEL;
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key);
}

/**
 * Determine which adapter type to use based on environment
 */
export function getAdapterType(): AdapterType {
  // Use Supabase if URL and any key (service role or anon) are configured
  if (isSupabaseConfigured()) {
    return 'supabase';
  }

  // On Vercel, SQLite is not available - require Supabase configuration
  if (isVercel()) {
    throw new Error(
      'Database not configured for Vercel deployment. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
  }

  return 'sqlite';
}

/**
 * Check if running in Supabase mode
 */
export function isSupabaseMode(): boolean {
  return getAdapterType() === 'supabase';
}

/**
 * Get the database adapter (singleton)
 *
 * This function returns a cached adapter instance.
 * The adapter type is determined by environment variables.
 */
export async function getAdapter(): Promise<DatabaseAdapter> {
  if (adapterInstance) {
    return adapterInstance;
  }

  const type = getAdapterType();

  if (type === 'supabase') {
    // Dynamic import to avoid loading Supabase SDK when not needed
    const { SupabaseAdapter } = await import('./supabase');
    adapterInstance = new SupabaseAdapter();
  } else {
    // Dynamic import to avoid loading better-sqlite3 when not needed
    const { SQLiteAdapter } = await import('./sqlite');
    const { getDatabase } = await import('../connection');
    adapterInstance = new SQLiteAdapter(getDatabase());
  }

  return adapterInstance;
}

/**
 * Reset the adapter instance (useful for testing)
 */
export function resetAdapter(): void {
  adapterInstance = null;
}

/**
 * Create a fresh adapter without caching (useful for testing)
 */
export async function createAdapter(type?: AdapterType): Promise<DatabaseAdapter> {
  const adapterType = type ?? getAdapterType();

  if (adapterType === 'supabase') {
    const { SupabaseAdapter } = await import('./supabase');
    return new SupabaseAdapter();
  } else {
    const { SQLiteAdapter } = await import('./sqlite');
    const { getDatabase } = await import('../connection');
    return new SQLiteAdapter(getDatabase());
  }
}
