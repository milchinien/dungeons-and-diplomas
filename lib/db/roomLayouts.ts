/**
 * Database operations for room layouts
 */

import { getDatabase } from './connection';
import type { RoomLayout, RoomLayoutInput, LayoutFilterOptions } from '../roomlayouts/types';
import { validateRoomLayout } from '../roomlayouts/validation';

/**
 * Creates a new room layout
 */
export function createRoomLayout(layout: RoomLayoutInput): RoomLayout {
  // Validate first
  const validation = validateRoomLayout(layout);
  if (!validation.isValid) {
    throw new Error(`Layout validation failed: ${validation.errors.join(', ')}`);
  }

  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT INTO room_layouts (
      name, width, height, tile_grid, door_positions,
      room_type, difficulty, tags, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    layout.name,
    layout.width,
    layout.height,
    JSON.stringify(layout.tileGrid),
    JSON.stringify(layout.doorPositions),
    layout.roomType || 'any',
    layout.difficulty || 5,
    JSON.stringify(layout.tags || []),
    layout.createdBy || null
  );

  return getRoomLayoutById(result.lastInsertRowid as number)!;
}

/**
 * Gets a room layout by ID
 */
export function getRoomLayoutById(id: number): RoomLayout | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM room_layouts WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return null;

  return parseRoomLayoutRow(row);
}

/**
 * Gets all room layouts with optional filters
 */
export function getRoomLayouts(filters?: LayoutFilterOptions): RoomLayout[] {
  const db = getDatabase();
  let query = 'SELECT * FROM room_layouts WHERE 1=1';
  const params: any[] = [];

  if (filters) {
    if (filters.roomType) {
      query += " AND (room_type = ? OR room_type = 'any')";
      params.push(filters.roomType);
    }
    if (filters.minWidth !== undefined) {
      query += ' AND width >= ?';
      params.push(filters.minWidth);
    }
    if (filters.maxWidth !== undefined) {
      query += ' AND width <= ?';
      params.push(filters.maxWidth);
    }
    if (filters.minHeight !== undefined) {
      query += ' AND height >= ?';
      params.push(filters.minHeight);
    }
    if (filters.maxHeight !== undefined) {
      query += ' AND height <= ?';
      params.push(filters.maxHeight);
    }
    if (filters.difficulty !== undefined) {
      query += ' AND difficulty = ?';
      params.push(filters.difficulty);
    }
    if (filters.doorSide) {
      // Filter by specific door position
      query += ` AND json_extract(door_positions, '$.${filters.doorSide}') = 1`;
    }
  }

  query += ' ORDER BY created_at DESC';

  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as any[];

  return rows.map(parseRoomLayoutRow);
}

/**
 * Gets a random room layout matching filters
 */
export function getRandomRoomLayout(filters?: LayoutFilterOptions): RoomLayout | null {
  const layouts = getRoomLayouts(filters);
  if (layouts.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * layouts.length);
  return layouts[randomIndex];
}

/**
 * Updates a room layout
 */
export function updateRoomLayout(id: number, layout: Partial<RoomLayoutInput>): RoomLayout {
  const existing = getRoomLayoutById(id);
  if (!existing) {
    throw new Error(`Layout with id ${id} not found`);
  }

  const updated: RoomLayoutInput = {
    name: layout.name ?? existing.name,
    width: layout.width ?? existing.width,
    height: layout.height ?? existing.height,
    tileGrid: layout.tileGrid ?? existing.tileGrid,
    doorPositions: layout.doorPositions ?? existing.doorPositions,
    roomType: layout.roomType ?? existing.roomType,
    difficulty: layout.difficulty ?? existing.difficulty,
    tags: layout.tags ?? existing.tags,
  };

  // Validate
  const validation = validateRoomLayout(updated);
  if (!validation.isValid) {
    throw new Error(`Layout validation failed: ${validation.errors.join(', ')}`);
  }

  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE room_layouts
    SET name = ?, width = ?, height = ?, tile_grid = ?, door_positions = ?,
        room_type = ?, difficulty = ?, tags = ?
    WHERE id = ?
  `);

  stmt.run(
    updated.name,
    updated.width,
    updated.height,
    JSON.stringify(updated.tileGrid),
    JSON.stringify(updated.doorPositions),
    updated.roomType,
    updated.difficulty,
    JSON.stringify(updated.tags),
    id
  );

  return getRoomLayoutById(id)!;
}

/**
 * Deletes a room layout
 */
export function deleteRoomLayout(id: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM room_layouts WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Parses a database row into a RoomLayout object
 */
function parseRoomLayoutRow(row: any): RoomLayout {
  return {
    id: row.id,
    name: row.name,
    width: row.width,
    height: row.height,
    tileGrid: JSON.parse(row.tile_grid),
    doorPositions: JSON.parse(row.door_positions),
    roomType: row.room_type,
    difficulty: row.difficulty,
    tags: JSON.parse(row.tags),
    createdBy: row.created_by,
    createdAt: new Date(row.created_at)
  };
}

/**
 * Seeds starter room layouts into database
 */
export function seedRoomLayouts(): void {
  const db = getDatabase();

  // Check if already seeded
  const count = db.prepare('SELECT COUNT(*) as count FROM room_layouts').get() as { count: number };
  if (count.count > 0) {
    console.log('Room layouts already seeded, skipping...');
    return;
  }

  console.log('Seeding room layouts...');

  // Import seed data
  const seedLayouts = require('../data/seed-room-layouts.json');

  for (const layout of seedLayouts) {
    try {
      createRoomLayout(layout);
      console.log(`  ✓ Seeded layout: ${layout.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to seed layout ${layout.name}:`, error);
    }
  }

  console.log(`Seeded ${seedLayouts.length} room layouts`);
}
