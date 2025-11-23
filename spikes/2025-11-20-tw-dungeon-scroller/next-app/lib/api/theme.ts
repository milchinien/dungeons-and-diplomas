/**
 * Theme API endpoints
 */

import { get } from './client';
import type { TileTheme, ImportedTileset } from '../tiletheme/types';

export interface ThemeResponse {
  theme: TileTheme;
  tilesets: ImportedTileset[];
}

export async function getTheme(themeId: number): Promise<ThemeResponse> {
  return get<ThemeResponse>(`/api/theme/${themeId}`);
}
