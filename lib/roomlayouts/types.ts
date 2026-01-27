/**
 * TypeScript types and interfaces for the Room Layout System
 */

import type { TileType } from '../constants';

/**
 * Door positions for a room layout
 */
export interface DoorPositions {
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
  roomType: 'empty' | 'treasure' | 'combat' | 'shop' | 'any';
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
  roomType: 'empty' | 'treasure' | 'combat' | 'shop' | 'any';
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
  roomType?: 'empty' | 'treasure' | 'combat' | 'shop' | 'any';
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
