/**
 * User-related database operations
 *
 * Uses database adapter for backend-agnostic operations.
 */

import { getAdapter } from './adapters';

export interface User {
  id: number;
  username: string;
  xp: number;
  created_at: string;
  last_login: string;
}

/**
 * Login or create a user
 */
export async function loginUser(username: string): Promise<User> {
  const adapter = await getAdapter();
  return adapter.loginUser(username);
}

/**
 * Get user by ID
 */
export async function getUserById(id: number): Promise<User | undefined> {
  const adapter = await getAdapter();
  return adapter.getUserById(id);
}
