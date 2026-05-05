/**
 * Gold API endpoints
 */

import { get, post } from './client';
import type { GoldLogEntry, AddGoldResponse } from '../types/api';

// Re-export types for convenience
export type { GoldLogEntry, AddGoldResponse };

/**
 * Add gold to a user and log the transaction
 */
export async function addGold(entry: GoldLogEntry): Promise<AddGoldResponse> {
  return post<AddGoldResponse>('/api/gold', entry);
}

/**
 * Get current gold balance for a user
 */
export async function getUserGold(userId: number): Promise<number> {
  const response = await get<{ gold: number }>(`/api/gold?userId=${userId}`);
  return response.gold;
}
