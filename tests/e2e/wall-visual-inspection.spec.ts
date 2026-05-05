import { test, expect } from '@playwright/test';

test.describe('Wall Visual Inspection', () => {
  test('should show game for 60 seconds for visual inspection', async ({ page }) => {
    // Navigate and login
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Login
    await page.waitForSelector('input[type="text"]', { timeout: 10000 });
    await page.fill('input[type="text"]', 'VisualInspectionUser');

    const submitButton = page.locator('button:has-text("Starten"), button:has-text("Start"), button[type="submit"]').first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Click play button if available
    const playButton = page.locator('button:has-text("Spielen"), button:has-text("Play")').first();
    if (await playButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await playButton.click();
    }

    // Wait for game canvas
    const canvas = page.locator('canvas').first();
    await canvas.waitFor({ state: 'visible', timeout: 10000 });

    console.log('\n=== VISUAL INSPECTION MODE ===');
    console.log('Browser will stay open for 60 seconds for manual inspection');
    console.log('Look for:');
    console.log('  1. Missing walls on room perimeters');
    console.log('  2. Double walls between rooms');
    console.log('  3. Gaps or holes in walls');
    console.log('==============================\n');

    // Take screenshots at intervals
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(5000);

      // Get wall data
      const wallData = await page.evaluate(() => {
        const data = (window as any).dungeonTestData;
        if (!data) return { error: 'No data' };

        const { dungeon, rooms, roomMap } = data;
        let doubleWalls = 0;
        let missingWalls = 0;
        const issues: string[] = [];

        // Check for double walls
        for (let y = 0; y < dungeon.length - 1; y++) {
          for (let x = 0; x < dungeon[0].length; x++) {
            if (dungeon[y][x] === 2 && dungeon[y + 1][x] === 2) {
              const rAbove = roomMap[y - 1]?.[x];
              const rBelow = roomMap[y + 2]?.[x];
              if (rAbove >= 0 && rBelow >= 0 && rAbove !== rBelow) {
                doubleWalls++;
                if (doubleWalls <= 3) {
                  issues.push(`Double wall (V) at (${x}, ${y})`);
                }
              }
            }
          }
        }

        for (let y = 0; y < dungeon.length; y++) {
          for (let x = 0; x < dungeon[0].length - 1; x++) {
            if (dungeon[y][x] === 2 && dungeon[y][x + 1] === 2) {
              const rLeft = roomMap[y]?.[x - 1];
              const rRight = roomMap[y]?.[x + 2];
              if (rLeft >= 0 && rRight >= 0 && rLeft !== rRight) {
                doubleWalls++;
                if (doubleWalls <= 3) {
                  issues.push(`Double wall (H) at (${x}, ${y})`);
                }
              }
            }
          }
        }

        // Check for missing walls
        for (const room of rooms) {
          // Top edge
          for (let x = room.x; x < room.x + room.width; x++) {
            if (dungeon[room.y]?.[x] === 0) {
              missingWalls++;
              if (missingWalls <= 5) {
                issues.push(`Missing top wall for room ${room.id} at (${x}, ${room.y})`);
              }
            }
          }
          // Bottom edge
          for (let x = room.x; x < room.x + room.width; x++) {
            const y = room.y + room.height - 1;
            if (dungeon[y]?.[x] === 0) {
              missingWalls++;
              if (missingWalls <= 5) {
                issues.push(`Missing bottom wall for room ${room.id} at (${x}, ${y})`);
              }
            }
          }
          // Left edge
          for (let y = room.y; y < room.y + room.height; y++) {
            if (dungeon[y]?.[room.x] === 0) {
              missingWalls++;
              if (missingWalls <= 5) {
                issues.push(`Missing left wall for room ${room.id} at (${room.x}, ${y})`);
              }
            }
          }
          // Right edge
          for (let y = room.y; y < room.y + room.height; y++) {
            const x = room.x + room.width - 1;
            if (dungeon[y]?.[x] === 0) {
              missingWalls++;
              if (missingWalls <= 5) {
                issues.push(`Missing right wall for room ${room.id} at (${x}, ${y})`);
              }
            }
          }
        }

        return {
          totalRooms: rooms.length,
          doubleWalls,
          missingWalls,
          issues
        };
      });

      console.log(`\n[${i * 5}s] Rooms: ${wallData.totalRooms}, Double Walls: ${wallData.doubleWalls}, Missing Walls: ${wallData.missingWalls}`);
      if (wallData.issues && wallData.issues.length > 0) {
        console.log('Sample issues:');
        wallData.issues.slice(0, 3).forEach((issue: string) => console.log(`  - ${issue}`));
      }

      await page.screenshot({
        path: `test-results/wall-visual-${i}.png`,
        fullPage: false
      });
    }

    console.log('\n=== INSPECTION COMPLETE ===\n');
  });
});
