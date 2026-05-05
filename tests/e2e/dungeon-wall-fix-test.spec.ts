import { test, expect } from '@playwright/test';

test.describe('Dungeon Wall Fix Test', () => {
  test('should analyze wall rendering issues', async ({ page }) => {
    // Navigate and login
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('text=Dungeons & Diplomas', { timeout: 10000 });
    await page.fill('input[type="text"]', 'WallFixUser');
    await page.click('button:has-text("Starten")');

    // Start game
    await page.waitForSelector('button:has-text("Spielen")', { timeout: 10000 });
    await page.click('button:has-text("Spielen")');

    await page.waitForTimeout(3000);

    // Get dungeon data and analyze walls
    const wallAnalysis = await page.evaluate(() => {
      const dungeonData = (window as any).dungeonTestData;
      if (!dungeonData) return { error: 'No dungeon data available' };

      const { dungeon, rooms, roomMap } = dungeonData;
      const issues: string[] = [];
      const TILE = { EMPTY: 0, FLOOR: 1, WALL: 2, DOOR: 3 };

      // Check 1: Double walls between rooms
      let doubleWalls = 0;
      for (let y = 0; y < dungeon.length - 1; y++) {
        for (let x = 0; x < dungeon[0].length; x++) {
          if (dungeon[y][x] === TILE.WALL && dungeon[y + 1][x] === TILE.WALL) {
            // Check if between different rooms
            const roomAbove = roomMap[y - 1]?.[x];
            const roomBelow = roomMap[y + 2]?.[x];
            if (roomAbove >= 0 && roomBelow >= 0 && roomAbove !== roomBelow) {
              doubleWalls++;
              if (doubleWalls <= 5) {
                issues.push(`Double wall (vertical) at (${x}, ${y})`);
              }
            }
          }
        }
      }

      for (let y = 0; y < dungeon.length; y++) {
        for (let x = 0; x < dungeon[0].length - 1; x++) {
          if (dungeon[y][x] === TILE.WALL && dungeon[y][x + 1] === TILE.WALL) {
            const roomLeft = roomMap[y]?.[x - 1];
            const roomRight = roomMap[y]?.[x + 2];
            if (roomLeft >= 0 && roomRight >= 0 && roomLeft !== roomRight) {
              doubleWalls++;
              if (doubleWalls <= 5) {
                issues.push(`Double wall (horizontal) at (${x}, ${y})`);
              }
            }
          }
        }
      }

      // Check 2: Missing walls on room perimeters
      let missingWalls = 0;
      for (const room of rooms) {
        // Check top edge
        for (let x = room.x; x < room.x + room.width; x++) {
          const y = room.y;
          const tile = dungeon[y]?.[x];
          if (tile === TILE.EMPTY) {
            missingWalls++;
            if (missingWalls <= 5) {
              issues.push(`Missing top wall for room ${room.id} at (${x}, ${y})`);
            }
          }
        }

        // Check bottom edge
        for (let x = room.x; x < room.x + room.width; x++) {
          const y = room.y + room.height - 1;
          const tile = dungeon[y]?.[x];
          if (tile === TILE.EMPTY) {
            missingWalls++;
            if (missingWalls <= 5) {
              issues.push(`Missing bottom wall for room ${room.id} at (${x}, ${y})`);
            }
          }
        }

        // Check left edge
        for (let y = room.y; y < room.y + room.height; y++) {
          const x = room.x;
          const tile = dungeon[y]?.[x];
          if (tile === TILE.EMPTY) {
            missingWalls++;
            if (missingWalls <= 5) {
              issues.push(`Missing left wall for room ${room.id} at (${x}, ${y})`);
            }
          }
        }

        // Check right edge
        for (let y = room.y; y < room.y + room.height; y++) {
          const x = room.x + room.width - 1;
          const tile = dungeon[y]?.[x];
          if (tile === TILE.EMPTY) {
            missingWalls++;
            if (missingWalls <= 5) {
              issues.push(`Missing right wall for room ${room.id} at (${x}, ${y})`);
            }
          }
        }
      }

      // Check 3: Isolated wall segments
      let isolatedWalls = 0;
      for (let y = 1; y < dungeon.length - 1; y++) {
        for (let x = 1; x < dungeon[0].length - 1; x++) {
          if (dungeon[y][x] === TILE.WALL) {
            // Count non-wall neighbors
            const neighbors = [
              dungeon[y - 1][x],
              dungeon[y + 1][x],
              dungeon[y][x - 1],
              dungeon[y][x + 1]
            ];
            const nonWallNeighbors = neighbors.filter(n => n !== TILE.WALL).length;

            if (nonWallNeighbors >= 3) {
              isolatedWalls++;
              if (isolatedWalls <= 5) {
                issues.push(`Isolated wall at (${x}, ${y}) with ${nonWallNeighbors} non-wall neighbors`);
              }
            }
          }
        }
      }

      return {
        doubleWalls,
        missingWalls,
        isolatedWalls,
        totalRooms: rooms.length,
        issues: issues.slice(0, 20)
      };
    });

    console.log('\n=== Wall Analysis ===');
    console.log(`Total Rooms: ${wallAnalysis.totalRooms}`);
    console.log(`Double Walls: ${wallAnalysis.doubleWalls}`);
    console.log(`Missing Walls: ${wallAnalysis.missingWalls}`);
    console.log(`Isolated Walls: ${wallAnalysis.isolatedWalls}`);
    console.log('\nFirst issues:');
    wallAnalysis.issues?.forEach((issue: string) => console.log(`  - ${issue}`));
    console.log('=====================\n');

    // Take screenshot for visual inspection
    await page.screenshot({
      path: 'test-results/wall-fix-analysis.png',
      fullPage: false
    });

    // Expect no wall issues
    expect(wallAnalysis.doubleWalls, 'Should have no double walls').toBe(0);
    expect(wallAnalysis.missingWalls, 'Should have no missing walls').toBe(0);
  });

  test('should render walls correctly with TileTheme', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('text=Dungeons & Diplomas', { timeout: 10000 });
    await page.fill('input[type="text"]', 'TileThemeUser');
    await page.click('button:has-text("Starten")');

    await page.waitForSelector('button:has-text("Spielen")', { timeout: 10000 });
    await page.click('button:has-text("Spielen")');

    await page.waitForTimeout(3000);

    // Check if TileTheme is being used correctly
    const tileThemeCheck = await page.evaluate(() => {
      const dungeonData = (window as any).dungeonTestData;
      if (!dungeonData) return { error: 'No dungeon data' };

      // Check if renderMap exists and has wall type detection
      const hasRenderMap = !!dungeonData.renderMap;
      const hasWallTypes = hasRenderMap && dungeonData.renderMap.wallTypes;

      return {
        hasRenderMap,
        hasWallTypes,
        renderMapSize: hasRenderMap ? {
          width: dungeonData.renderMap.width,
          height: dungeonData.renderMap.height
        } : null
      };
    });

    console.log('\n=== TileTheme Check ===');
    console.log(`Has RenderMap: ${tileThemeCheck.hasRenderMap}`);
    console.log(`Has WallTypes: ${tileThemeCheck.hasWallTypes}`);
    console.log(`RenderMap Size: ${JSON.stringify(tileThemeCheck.renderMapSize)}`);
    console.log('=======================\n');

    await page.screenshot({
      path: 'test-results/wall-tiletheme-check.png'
    });
  });
});
