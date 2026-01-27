/**
 * LayoutPool - Manages available room layouts for dungeon generation
 */

import { getRoomLayouts, getRandomRoomLayout } from '../db/roomLayouts';
import type { RoomLayout, LayoutFilterOptions } from './types';

export class LayoutPool {
  private layouts: RoomLayout[] = [];

  constructor() {
    this.reload();
  }

  /**
   * Reloads all layouts from database
   */
  reload(): void {
    this.layouts = getRoomLayouts();
  }

  /**
   * Gets a random layout matching filters
   */
  getRandomLayout(filters?: LayoutFilterOptions): RoomLayout | null {
    return getRandomRoomLayout(filters);
  }

  /**
   * Gets all layouts matching filters
   */
  getLayouts(filters?: LayoutFilterOptions): RoomLayout[] {
    return getRoomLayouts(filters);
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
