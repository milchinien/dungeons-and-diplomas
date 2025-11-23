/**
 * XP API endpoints
 */

import { post } from './client';

export interface XpLogEntry {
  user_id: number;
  xp_amount: number;
  reason: string;
  enemy_level?: number;
}

export interface AddXpResponse {
  success: boolean;
}

export async function addXp(entry: XpLogEntry): Promise<AddXpResponse> {
  return post<AddXpResponse>('/api/xp', entry);
}
