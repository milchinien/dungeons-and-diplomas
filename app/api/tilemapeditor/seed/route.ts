import { NextResponse } from 'next/server';
import { getTilesets, saveTileset, getTileThemes, saveTileTheme } from '@/lib/tiletheme/db';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { WALL_TYPE, DOOR_TYPE } from '@/lib/tiletheme/types';
import type { TileTheme } from '@/lib/tiletheme/types';

// Default tilesets to seed
const DEFAULT_TILESETS = [
  {
    name: 'Castle Dungeon (Normal)',
    path: '/Assets/Castle-Dungeon2_Tiles/Tileset.png',
    widthTiles: 10,
    heightTiles: 10
  },
  {
    name: 'Castle Dungeon (Dark)',
    path: '/Assets/Castle-Dungeon2_Tiles/Tileset_Dark.png',
    widthTiles: 25,
    heightTiles: 13
  },
  {
    name: 'Castle Dungeon (Bright)',
    path: '/Assets/Castle-Dungeon2_Tiles/Tileset_Bright.png',
    widthTiles: 25,
    heightTiles: 13
  }
];

/**
 * Create a default tile theme using the Dark Castle Dungeon tileset (25x13).
 * Coordinates are verified tile indices on Tileset_Dark.png: clean stone
 * floors on row 1, plain brick walls on row 0, wooden doors at cols 8/9.
 */
function createDefaultTheme(tilesetId: number): Omit<TileTheme, 'id' | 'created_at' | 'updated_at'> {
  const floorVariants = [
    { source: { tilesetId, x: 9, y: 1 }, weight: 200 },
    { source: { tilesetId, x: 10, y: 1 }, weight: 50 },
    { source: { tilesetId, x: 11, y: 1 }, weight: 30 },
    { source: { tilesetId, x: 12, y: 1 }, weight: 20 },
    { source: { tilesetId, x: 13, y: 1 }, weight: 10 }
  ];

  // Plain brick walls (used for all wall types)
  const wallVariants = [
    { source: { tilesetId, x: 1, y: 0 }, weight: 40 },
    { source: { tilesetId, x: 2, y: 0 }, weight: 20 },
    { source: { tilesetId, x: 6, y: 0 }, weight: 15 }
  ];

  // Wooden door tiles on the Dark tileset
  const doorVertical = [{ source: { tilesetId, x: 8, y: 0 }, weight: 100 }];
  const doorHorizontal = [{ source: { tilesetId, x: 9, y: 0 }, weight: 100 }];

  return {
    name: 'Castle Dungeon (Default)',
    floor: {
      default: floorVariants
    },
    wall: {
      [WALL_TYPE.HORIZONTAL]: wallVariants,
      [WALL_TYPE.VERTICAL]: wallVariants,
      [WALL_TYPE.CORNER_TL]: wallVariants,
      [WALL_TYPE.CORNER_TR]: wallVariants,
      [WALL_TYPE.CORNER_BL]: wallVariants,
      [WALL_TYPE.CORNER_BR]: wallVariants,
      [WALL_TYPE.T_UP]: wallVariants,
      [WALL_TYPE.T_DOWN]: wallVariants,
      [WALL_TYPE.T_LEFT]: wallVariants,
      [WALL_TYPE.T_RIGHT]: wallVariants,
      [WALL_TYPE.CROSS]: wallVariants,
      [WALL_TYPE.ISOLATED]: wallVariants,
      [WALL_TYPE.END_LEFT]: wallVariants,
      [WALL_TYPE.END_RIGHT]: wallVariants,
      [WALL_TYPE.END_TOP]: wallVariants,
      [WALL_TYPE.END_BOTTOM]: wallVariants
    },
    door: {
      [DOOR_TYPE.HORIZONTAL_CLOSED]: doorHorizontal,
      [DOOR_TYPE.HORIZONTAL_OPEN]: doorHorizontal,
      [DOOR_TYPE.VERTICAL_CLOSED]: doorVertical,
      [DOOR_TYPE.VERTICAL_OPEN]: doorVertical
    }
  };
}

export const GET = withErrorHandler(async () => {
  const added: string[] = [];

  // 1. Seed tilesets first
  const existingTilesets = await getTilesets();
  const existingPaths = new Set(existingTilesets.map((t) => t.path));

  for (const tileset of DEFAULT_TILESETS) {
    if (!existingPaths.has(tileset.path)) {
      await saveTileset(tileset);
      added.push(`Tileset: ${tileset.name}`);
    }
  }

  // 2. Seed default theme if no themes exist
  const existingThemes = await getTileThemes();
  if (existingThemes.length === 0) {
    // Theme renders against the Dark tileset (25x13).
    const allTilesets = await getTilesets();
    const darkTileset = allTilesets.find(t => t.path.includes('Tileset_Dark.png'));

    if (darkTileset) {
      const defaultTheme = createDefaultTheme(darkTileset.id);
      await saveTileTheme(defaultTheme);
      added.push(`Theme: ${defaultTheme.name}`);
    }
  }

  const allTilesets = await getTilesets();
  const allThemes = await getTileThemes();

  return NextResponse.json({
    message: added.length > 0
      ? `Added ${added.length} items: ${added.join(', ')}`
      : 'All default tilesets and themes already exist',
    tilesets: allTilesets,
    themes: allThemes
  });
}, 'seed tilesets and themes');
