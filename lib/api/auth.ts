/**
 * Authentication API endpoints
 */

import { post } from './client';
import type { LoginRequest, LoginResponse } from '../types/api';

// Re-export types for convenience
export type { LoginRequest, LoginResponse };

export async function login(username: string): Promise<LoginResponse> {
  return post<LoginResponse>('/api/auth/login', { username });
}

export async function logout(): Promise<void> {
  await post<void>('/api/auth/logout', {});
}
