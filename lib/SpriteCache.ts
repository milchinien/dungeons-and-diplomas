/**
 * Global sprite cache to avoid loading the same sprite multiple times
 * Major performance improvement for enemy spawning
 */

import { SpriteSheetLoader } from './SpriteSheetLoader';

class SpriteCache {
  private cache: Map<string, Promise<SpriteSheetLoader>> = new Map();

  /**
   * Get a sprite from cache or load it if not cached
   * Returns a promise that resolves to the loaded sprite
   */
  async getSprite(spriteName: string): Promise<SpriteSheetLoader> {
    // Check if sprite is already in cache or being loaded
    if (this.cache.has(spriteName)) {
      // Clone the sprite (each enemy needs its own instance for independent animations)
      const cachedSprite = await this.cache.get(spriteName)!;
      return this.cloneSprite(cachedSprite);
    }

    // Start loading the sprite and cache the promise
    const loadPromise = (async () => {
      const sprite = new SpriteSheetLoader(spriteName);
      await sprite.load();
      return sprite;
    })();

    this.cache.set(spriteName, loadPromise);
    const loadedSprite = await loadPromise;

    // Return a clone (keep original in cache)
    return this.cloneSprite(loadedSprite);
  }

  /**
   * Clone a sprite (shares the same image but has independent animation state)
   */
  private cloneSprite(original: SpriteSheetLoader): SpriteSheetLoader {
    const clone = new SpriteSheetLoader(original.spritesheetName);

    // Share the same image and config (no need to reload)
    clone.image = original.image;
    clone.config = original.config;
    clone.loaded = original.loaded;

    // Independent animation state
    clone.currentAnimation = original.currentAnimation;
    clone.currentDirection = original.currentDirection;
    clone.currentFrame = 0;
    clone.animTimer = 0;

    return clone;
  }

  /**
   * Preload sprites to avoid loading delays later
   */
  async preload(spriteNames: string[]): Promise<void> {
    await Promise.all(spriteNames.map(name => this.getSprite(name)));
  }

  /**
   * Clear the cache (useful for memory management)
   */
  clear(): void {
    this.cache.clear();
  }
}

// Global singleton instance
export const spriteCache = new SpriteCache();
