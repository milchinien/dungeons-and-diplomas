import { NextResponse } from 'next/server';
import { getTilesets, saveTileset, initializeTilethemeTables } from '@/lib/tiletheme/db';

// Default tilesets to seed
const DEFAULT_TILESETS = [
  {
    name: 'Castle Dungeon (Normal)',
    path: '/Assets/Castle-Dungeon2_Tiles/Tileset.png',
    widthTiles: 20,
    heightTiles: 12
  },
  {
    name: 'Castle Dungeon (Dark)',
    path: '/Assets/Castle-Dungeon2_Tiles/Tileset_Dark.png',
    widthTiles: 20,
    heightTiles: 12
  },
  {
    name: 'Castle Dungeon (Bright)',
    path: '/Assets/Castle-Dungeon2_Tiles/Tileset_Bright.png',
    widthTiles: 20,
    heightTiles: 12
  }
];

// GET /api/tilemapeditor/seed - Seed the database with default tilesets
export async function GET() {
  try {
    // Initialize tables first
    initializeTilethemeTables();

    // Check existing tilesets
    const existing = getTilesets();
    const existingPaths = new Set(existing.map((t) => t.path));

    const added: string[] = [];

    // Add default tilesets that don't exist yet
    for (const tileset of DEFAULT_TILESETS) {
      if (!existingPaths.has(tileset.path)) {
        saveTileset(tileset);
        added.push(tileset.name);
      }
    }

    const allTilesets = getTilesets();

    return NextResponse.json({
      message: added.length > 0
        ? `Added ${added.length} tilesets: ${added.join(', ')}`
        : 'All default tilesets already exist',
      tilesets: allTilesets
    });
  } catch (error) {
    console.error('Error seeding tilesets:', error);
    return NextResponse.json({ error: 'Failed to seed tilesets' }, { status: 500 });
  }
}
