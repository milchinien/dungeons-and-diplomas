import {
  TileTheme,
  TileVariant,
  RenderMap,
  RenderTile,
  WallType
} from './types';
import { detectWallType, detectDoorType, WALL_TYPE_FALLBACKS } from './WallTypeDetector';
import { TILE, TILE_SOURCE_SIZE, type TileType } from '../constants';
import { SeededRandom } from '../dungeon/SeededRandom';

/**
 * Select a tile variant based on weight
 */
function selectVariant(variants: TileVariant[], rng: SeededRandom): TileVariant | null {
  if (!variants || variants.length === 0) return null;

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  let random = rng.next() * totalWeight;

  for (const variant of variants) {
    random -= variant.weight;
    if (random <= 0) return variant;
  }

  return variants[0];
}

/**
 * Convert Dark + Light variants to RenderTile
 * Light is optional - if null, Dark will be used during rendering
 */
function variantsToRenderTile(
  darkVariant: TileVariant | null,
  lightVariant: TileVariant | null
): RenderTile | null {
  if (!darkVariant) return null;

  return {
    // Dark (always present)
    darkTilesetId: darkVariant.source.tilesetId,
    darkSrcX: darkVariant.source.x * TILE_SOURCE_SIZE,
    darkSrcY: darkVariant.source.y * TILE_SOURCE_SIZE,

    // Light (optional)
    lightTilesetId: lightVariant?.source.tilesetId ?? null,
    lightSrcX: lightVariant ? lightVariant.source.x * TILE_SOURCE_SIZE : null,
    lightSrcY: lightVariant ? lightVariant.source.y * TILE_SOURCE_SIZE : null,
  };
}

/**
 * Generate the complete RenderMap with Dark + Light tiles
 * Call ONCE during dungeon generation!
 *
 * @param dungeon - The logical dungeon map
 * @param darkTheme - TileTheme for dark mode (required)
 * @param lightTheme - TileTheme for light mode (optional, null = no light)
 * @param rngSeed - Seed for consistent variant selection
 */
export function generateRenderMap(
  dungeon: TileType[][],
  darkTheme: TileTheme,
  lightTheme: TileTheme | null,
  rngSeed: number
): RenderMap {
  const height = dungeon.length;
  const width = dungeon[0]?.length ?? 0;

  // Two RNGs with same seed for consistent Dark/Light selection
  const darkRng = new SeededRandom(rngSeed);
  const lightRng = new SeededRandom(rngSeed);

  const tiles: (RenderTile | null)[][] = [];

  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      const tile = dungeon[y][x];

      if (tile === TILE.EMPTY) {
        tiles[y][x] = null;
        continue;
      }

      if (tile === TILE.FLOOR) {
        const darkVariant = selectVariant(darkTheme.floor.default, darkRng);
        const lightVariant = lightTheme
          ? selectVariant(lightTheme.floor.default, lightRng)
          : null;
        tiles[y][x] = variantsToRenderTile(darkVariant, lightVariant);
        continue;
      }

      if (tile === TILE.WALL) {
        const wallType = detectWallType(dungeon, x, y);

        // Dark variant
        let darkVariants = darkTheme.wall[wallType];
        if (!darkVariants?.length) {
          const fallback = WALL_TYPE_FALLBACKS[wallType];
          if (fallback) darkVariants = darkTheme.wall[fallback];
        }
        const darkVariant = selectVariant(darkVariants || [], darkRng);

        // Light variant (optional)
        let lightVariant: TileVariant | null = null;
        if (lightTheme) {
          let lightVariants = lightTheme.wall[wallType];
          if (!lightVariants?.length) {
            const fallback = WALL_TYPE_FALLBACKS[wallType];
            if (fallback) lightVariants = lightTheme.wall[fallback];
          }
          lightVariant = selectVariant(lightVariants || [], lightRng);
        }

        tiles[y][x] = variantsToRenderTile(darkVariant, lightVariant);
        continue;
      }

      if (tile === TILE.DOOR) {
        const doorType = detectDoorType(dungeon, x, y, false);

        const darkVariant = selectVariant(darkTheme.door[doorType] || [], darkRng);
        const lightVariant = lightTheme
          ? selectVariant(lightTheme.door[doorType] || [], lightRng)
          : null;

        tiles[y][x] = variantsToRenderTile(darkVariant, lightVariant);
        continue;
      }

      // Fallback
      tiles[y][x] = null;
    }
  }

  return { width, height, tiles };
}

/**
 * Generate a RenderMap for a single theme (no Dark/Light distinction)
 * Useful for the editor preview
 */
export function generateSingleThemeRenderMap(
  dungeon: TileType[][],
  theme: TileTheme,
  rngSeed: number
): RenderMap {
  return generateRenderMap(dungeon, theme, null, rngSeed);
}
