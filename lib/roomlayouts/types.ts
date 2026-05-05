/**
 * TypeScript types and interfaces for the Room Layout System
 */

import type { TileType } from '../constants';

/**
 * Door positions for a room layout (LOCAL coordinates)
 *
 * Stores exact position of single door on each edge using LOCAL indices:
 * - north/south: X-index along edge (0 to width-1)
 *   Example: north=3 means door is at local position (3, 0)
 * - east/west: Y-index along edge (0 to height-1)
 *   Example: west=2 means door is at local position (0, 2)
 * - null: No door on that side
 *
 * Transformation to GLOBAL dungeon coordinates:
 * - North door: (roomX + doorPositions.north, roomY)
 * - South door: (roomX + doorPositions.south, roomY + height - 1)
 * - West door: (roomX, roomY + doorPositions.west)
 * - East door: (roomX + width - 1, roomY + doorPositions.east)
 */
export interface DoorPositions {
  north: number | null;  // X-index (0..width-1)
  south: number | null;  // X-index (0..width-1)
  east: number | null;   // Y-index (0..height-1)
  west: number | null;   // Y-index (0..height-1)
}

/**
 * Legacy door positions (boolean-based)
 * Used only for migration purposes
 */
export interface LegacyDoorPositions {
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
}

/**
 * Room layout metadata
 */
export interface LayoutMetadata {
  name: string;
  roomType: 'empty' | 'treasure' | 'combat' | 'shop' | 'spawn' | 'end' | 'any';
  difficulty: number;  // 1-10
  tags: string[];
}

/**
 * Complete room layout definition
 */
export interface RoomLayout {
  id: number;
  name: string;
  width: number;      // 5-15
  height: number;     // 5-15
  tileGrid: TileType[][];
  doorPositions: DoorPositions;
  roomType: 'empty' | 'treasure' | 'combat' | 'shop' | 'spawn' | 'end' | 'any';
  difficulty: number;
  tags: string[];
  createdBy: number | null;
  createdAt: Date;
}

/**
 * Room layout for database insertion (without id/timestamps)
 */
export interface RoomLayoutInput {
  name: string;
  width: number;
  height: number;
  tileGrid: TileType[][];
  doorPositions: DoorPositions;
  roomType?: 'empty' | 'treasure' | 'combat' | 'shop' | 'spawn' | 'end' | 'any';
  difficulty?: number;
  tags?: string[];
  createdBy?: number;
}

/**
 * Filter options for querying layouts
 */
export interface LayoutFilterOptions {
  roomType?: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  difficulty?: number;
  tags?: string[];
  doorSide?: 'north' | 'south' | 'east' | 'west';  // Has door on this side
}
