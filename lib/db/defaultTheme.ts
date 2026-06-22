/**
 * Canonical definition of the default Castle Dungeon tileset + theme.
 *
 * Single source of truth shared by the synchronous seed (init.ts), the SQLite
 * adapter seed, and the theme migration. Keeping these in one place prevents the
 * three copies from drifting apart (which is how the renderer ended up pointing
 * at stale tile coordinates).
 *
 * IMPORTANT: All tile coordinates are in TILE units and are multiplied by
 * TILE_SOURCE_SIZE (64px) by the renderer. They are authored for the original
 * 1600x832 "Castle Dungeon" tileset (25x13 tiles at 64px).
 */

/** Bump when the canonical theme/tileset data below changes, to re-run the migration. */
export const THEME_SEED_VERSION = 1;

export const DEFAULT_THEME_NAME = 'Castle Dungeon (Default)';

export interface DefaultTilesetDef {
  name: string;
  path: string;
  widthTiles: number;
  heightTiles: number;
}

/** The 1600x832 tileset is a 25x13 grid at 64px per tile. */
export const DEFAULT_TILESETS: DefaultTilesetDef[] = [
  { name: 'Castle Dungeon (Normal)', path: '/Assets/Castle-Dungeon2_Tiles/Tileset.png', widthTiles: 25, heightTiles: 13 },
  { name: 'Castle Dungeon (Dark)', path: '/Assets/Castle-Dungeon2_Tiles/Tileset_Dark.png', widthTiles: 25, heightTiles: 13 },
  { name: 'Castle Dungeon (Bright)', path: '/Assets/Castle-Dungeon2_Tiles/Tileset_Bright.png', widthTiles: 25, heightTiles: 13 },
];

/** Path of the tileset the default theme draws from. */
export const DEFAULT_NORMAL_TILESET_PATH = '/Assets/Castle-Dungeon2_Tiles/Tileset.png';

export const WALL_TYPE_KEYS = [
  'horizontal', 'vertical', 'corner_tl', 'corner_tr', 'corner_bl', 'corner_br',
  't_up', 't_down', 't_left', 't_right', 'cross', 'isolated',
  'end_left', 'end_right', 'end_top', 'end_bottom',
] as const;

export interface TileVariantDef {
  source: { tilesetId: number; x: number; y: number };
  weight: number;
}

export interface DefaultThemeConfig {
  floorConfig: { default: TileVariantDef[] };
  wallConfig: Record<string, TileVariantDef[]>;
  doorConfig: Record<string, TileVariantDef[]>;
}

/**
 * Build the floor/wall/door config objects for the default theme, bound to a
 * specific tileset id.
 */
export function buildDefaultThemeConfig(tilesetId: number): DefaultThemeConfig {
  const floorVariants: TileVariantDef[] = [
    { source: { tilesetId, x: 0, y: 1 }, weight: 200 },
    { source: { tilesetId, x: 1, y: 1 }, weight: 50 },
    { source: { tilesetId, x: 2, y: 1 }, weight: 30 },
    { source: { tilesetId, x: 2, y: 11 }, weight: 2 },
    { source: { tilesetId, x: 19, y: 8 }, weight: 1 },
  ];
  const wallVariants: TileVariantDef[] = [
    { source: { tilesetId, x: 0, y: 0 }, weight: 20 },
    { source: { tilesetId, x: 1, y: 0 }, weight: 15 },
    { source: { tilesetId, x: 2, y: 0 }, weight: 15 },
    { source: { tilesetId, x: 3, y: 0 }, weight: 15 },
    { source: { tilesetId, x: 3, y: 11 }, weight: 1 },
  ];
  const doorHorizontal: TileVariantDef[] = [{ source: { tilesetId, x: 13, y: 0 }, weight: 100 }];
  const doorVertical: TileVariantDef[] = [{ source: { tilesetId, x: 8, y: 0 }, weight: 100 }];

  const wallConfig: Record<string, TileVariantDef[]> = {};
  for (const t of WALL_TYPE_KEYS) wallConfig[t] = wallVariants;

  const doorConfig: Record<string, TileVariantDef[]> = {
    horizontal_closed: doorHorizontal,
    horizontal_open: doorHorizontal,
    vertical_closed: doorVertical,
    vertical_open: doorVertical,
  };

  return {
    floorConfig: { default: floorVariants },
    wallConfig,
    doorConfig,
  };
}

/** Same as buildDefaultThemeConfig but returns JSON strings for direct DB insertion. */
export function buildDefaultThemeConfigJSON(tilesetId: number): {
  floor: string;
  wall: string;
  door: string;
} {
  const cfg = buildDefaultThemeConfig(tilesetId);
  return {
    floor: JSON.stringify(cfg.floorConfig),
    wall: JSON.stringify(cfg.wallConfig),
    door: JSON.stringify(cfg.doorConfig),
  };
}
