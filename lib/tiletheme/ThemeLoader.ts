import type { TileTheme, ImportedTileset } from './types';
import { getThemeRenderer } from './ThemeRenderer';
import { api } from '../api';

/**
 * Result of loading a theme with its associated tilesets
 */
export interface ThemeLoadResult {
  theme: TileTheme;
  tilesets: ImportedTileset[];
}

/**
 * Centralized theme loading service with caching.
 * Eliminates duplicated theme-loading logic in DungeonManager and DungeonView.
 */
export class ThemeLoader {
  private static cache = new Map<number, ThemeLoadResult>();

  /**
   * Load a theme and its tilesets. Uses cache for repeated requests.
   * @param themeId The ID of the theme to load
   * @returns The loaded theme and tilesets, or null if loading fails
   */
  static async loadTheme(themeId: number): Promise<ThemeLoadResult | null> {
    // Check cache first
    const cached = this.cache.get(themeId);
    if (cached) {
      return cached;
    }

    try {
      const data = await api.theme.getTheme(themeId);
      const result: ThemeLoadResult = {
        theme: data.theme,
        tilesets: data.tilesets
      };

      // Load all tilesets into ThemeRenderer
      await this.ensureTilesetsLoaded(result.tilesets);

      // Cache the result
      this.cache.set(themeId, result);

      console.log(`ThemeLoader: Loaded theme "${result.theme?.name}" (ID: ${themeId})`);
      return result;
    } catch (error) {
      console.warn(`ThemeLoader: Failed to load theme ${themeId}:`, error);
      return null;
    }
  }

  /**
   * Ensure all tilesets are loaded into the ThemeRenderer
   */
  static async ensureTilesetsLoaded(tilesets: ImportedTileset[]): Promise<void> {
    const renderer = getThemeRenderer();

    for (const tileset of tilesets) {
      if (!renderer.isTilesetLoaded(tileset.id)) {
        await renderer.loadTileset(tileset.id, tileset.path);
      }
    }
  }

  /**
   * Clear the theme cache (useful for development/testing)
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Check if a theme is already cached
   */
  static isCached(themeId: number): boolean {
    return this.cache.has(themeId);
  }

  /**
   * Get a cached theme without loading (returns undefined if not cached)
   */
  static getCached(themeId: number): ThemeLoadResult | undefined {
    return this.cache.get(themeId);
  }
}
