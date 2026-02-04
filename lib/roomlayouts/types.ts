/**
 * TypeScript types and interfaces for the Room Layout System
 */

import type { TileType } from '../constants';

/**
 * Door positions for a room layout
 * Stores exact position of single door on each edge
 * - north/south: X-position along edge (0 to width-1)
 * - east/west: Y-position along edge (0 to height-1)
 * - null: No door on that side
 */
export interface DoorPositions {
  north: number | null;
  south: number | null;
  east: number | null;
  west: number | null;
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
