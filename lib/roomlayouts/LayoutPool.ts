/**
 * LayoutPool - Manages available room layouts for dungeon generation
 *
 * Client-side safe: does not import database modules.
 * Layouts are loaded externally (via API) and injected via setLayouts().
 */

import type { RoomLayout, LayoutFilterOptions } from './types';

export class LayoutPool {
  private layouts: RoomLayout[] = [];

  /**
   * Replaces the internal layout list (called after API fetch)
   */
  setLayouts(layouts: RoomLayout[]): void {
    this.layouts = layouts;
  }

  /**
   * Gets a random layout matching filters
   */
  getRandomLayout(filters?: LayoutFilterOptions): RoomLayout | null {
    const filtered = this.filterLayouts(filters);
    if (filtered.length === 0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  /**
   * Gets all layouts matching filters
   */
  getLayouts(filters?: LayoutFilterOptions): RoomLayout[] {
    return this.filterLayouts(filters);
  }

  /**
   * Gets a random layout with a specific door on a specific side
   */
  getLayoutWithDoor(side: 'north' | 'south' | 'east' | 'west', roomType?: string): RoomLayout | null {
    const filters: LayoutFilterOptions = { doorSide: side };
    if (roomType) {
      filters.roomType = roomType;
    }
    return this.getRandomLayout(filters);
  }

  /**
   * Gets total count of layouts in pool
   */
  getCount(): number {
    return this.layouts.length;
  }

  /**
   * Filters layouts based on provided options
   */
  private filterLayouts(filters?: LayoutFilterOptions): RoomLayout[] {
    if (!filters) return [...this.layouts];

    return this.layouts.filter(layout => {
      if (filters.roomType && layout.roomType !== filters.roomType && layout.roomType !== 'any') {
        return false;
      }
      if (filters.minWidth && layout.width < filters.minWidth) return false;
      if (filters.maxWidth && layout.width > filters.maxWidth) return false;
      if (filters.minHeight && layout.height < filters.minHeight) return false;
      if (filters.maxHeight && layout.height > filters.maxHeight) return false;
      if (filters.difficulty && layout.difficulty !== filters.difficulty) return false;
      if (filters.doorSide) {
        if (layout.doorPositions[filters.doorSide] === null) return false;
      }
      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag => layout.tags.includes(tag));
        if (!hasTag) return false;
      }
      return true;
    });
  }
}

// Singleton instance
let poolInstance: LayoutPool | null = null;

/**
 * Gets the singleton LayoutPool instance
 */
export function getLayoutPool(): LayoutPool {
  if (!poolInstance) {
    poolInstance = new LayoutPool();
  }
  return poolInstance;
}

/**
 * Resets the singleton (useful for testing)
 */
export function resetLayoutPool(): void {
  poolInstance = null;
}
