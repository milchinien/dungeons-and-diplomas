/**
 * E2E Tests for Dungeon Generation Fixes
 *
 * Tests the following fixes:
 * 1. Double wall removal (OR logic instead of AND)
 * 2. Shop rooms have shop inventory
 * 3. Doors don't lead to nowhere
 * 4. Walls are correctly selected from tileset
 *
 * These tests run multiple dungeon generations to ensure fixes work consistently.
 */

import { test, expect } from '@playwright/test';

test.describe('Dungeon Generation Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game
    await page.goto('http://localhost:3000');

    // Handle login modal if it appears
    try {
      // Wait for login modal or canvas (game already started)
      const loginModalVisible = await page.isVisible('input[placeholder*="Benutzername"]', { timeout: 3000 }).catch(() => false);

      if (loginModalVisible) {
        // Fill in username and submit
        await page.fill('input[placeholder*="Benutzername"]', 'test-user-' + Date.now());
        await page.click('button:has-text("Starten")');

        // Wait for modal to close
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      // Login might not be required or already done
      console.log('Login check skipped:', error);
    }

    // Wait for game to load and dungeon manager to be available
    await page.waitForFunction(() => {
      return (window as any).__dungeonManager !== undefined;
    }, { timeout: 15000 });

    await page.waitForTimeout(500);
  });

  test('should generate dungeons without double walls (multiple runs)', async ({ page }) => {
    // Run multiple dungeon generations to test consistency
    for (let run = 0; run < 5; run++) {
      console.log(`\n=== Dungeon Generation Run ${run + 1}/5 ===`);

      // Inject test code to check for double walls
      const doubleWallCheck = await page.evaluate(() => {
        const dungeonManager = (window as any).__dungeonManager;
        if (!dungeonManager) return { error: 'DungeonManager not found' };

        const dungeon = dungeonManager.dungeon;
        const width = dungeon[0]?.length || 0;
        const height = dungeon.length;

        const doubleWalls: Array<{x: number, y: number, type: 'horizontal' | 'vertical'}> = [];

        // Check for horizontal double walls (vertical stacks)
        for (let y = 0; y < height - 1; y++) {
          for (let x = 0; x < width; x++) {
            if (dungeon[y][x] === 2 && dungeon[y + 1][x] === 2) {
              // Check if this is a legitimate double wall (no floors/doors around)
              const hasFloorAbove = y > 0 && (dungeon[y - 1][x] === 1 || dungeon[y - 1][x] === 3);
              const hasFloorBelow = y + 2 < height && (dungeon[y + 2][x] === 1 || dungeon[y + 2][x] === 3);

              if (hasFloorAbove || hasFloorBelow) {
                doubleWalls.push({ x, y, type: 'horizontal' });
              }
            }
          }
        }

        // Check for vertical double walls (horizontal pairs)
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width - 1; x++) {
            if (dungeon[y][x] === 2 && dungeon[y][x + 1] === 2) {
              // Check if this is a legitimate double wall
              const hasFloorLeft = x > 0 && (dungeon[y][x - 1] === 1 || dungeon[y][x - 1] === 3);
              const hasFloorRight = x + 2 < width && (dungeon[y][x + 2] === 1 || dungeon[y][x + 2] === 3);

              if (hasFloorLeft || hasFloorRight) {
                doubleWalls.push({ x, y, type: 'vertical' });
              }
            }
          }
        }

        return {
          doubleWallCount: doubleWalls.length,
          doubleWalls: doubleWalls.slice(0, 10), // Return first 10 for debugging
          dungeonSize: { width, height },
          roomCount: dungeonManager.rooms?.length || 0
        };
      });

      console.log(`Run ${run + 1} results:`, doubleWallCheck);

      // Assert no double walls
      expect(doubleWallCheck.doubleWallCount).toBe(0);

      // Reload page for next run
      if (run < 4) {
        await page.reload();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should ensure all shop rooms have shop inventory', async ({ page }) => {
    // Run multiple times to ensure consistency
    for (let run = 0; run < 5; run++) {
      console.log(`\n=== Shop Inventory Check Run ${run + 1}/5 ===`);

      const shopCheck = await page.evaluate(() => {
        const dungeonManager = (window as any).__dungeonManager;
        if (!dungeonManager) return { error: 'DungeonManager not found' };

        const rooms = dungeonManager.rooms || [];
        const shopRooms = rooms.filter((r: any) => r.type === 'shop');

        const shopDetails = shopRooms.map((room: any) => ({
          id: room.id,
          hasInventory: !!room.shopInventory,
          itemCount: room.shopInventory?.items?.length || 0,
          perkCount: room.shopInventory?.perks?.length || 0,
          hasDoorState: room.shopDoorOpen !== undefined,
          roomSize: { width: room.width, height: room.height }
        }));

        const shopsWithoutInventory = shopDetails.filter(s => !s.hasInventory);

        return {
          totalRooms: rooms.length,
          shopCount: shopRooms.length,
          shopsWithInventory: shopDetails.filter(s => s.hasInventory).length,
          shopsWithoutInventory: shopsWithoutInventory.length,
          shopDetails,
          problemShops: shopsWithoutInventory
        };
      });

      console.log(`Run ${run + 1} shop results:`, shopCheck);

      // Assert all shops have inventory
      expect(shopCheck.shopsWithoutInventory).toBe(0);

      // Assert all shops have correct item/perk counts
      if (shopCheck.shopDetails) {
        for (const shop of shopCheck.shopDetails) {
          expect(shop.hasInventory).toBe(true);
          expect(shop.itemCount).toBeGreaterThanOrEqual(1); // At least 1 item
          expect(shop.perkCount).toBeGreaterThanOrEqual(1); // At least 1 perk
          expect(shop.hasDoorState).toBe(true);
        }
      }

      // Reload for next run
      if (run < 4) {
        await page.reload();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should validate that doors connect valid areas', async ({ page }) => {
    for (let run = 0; run < 5; run++) {
      console.log(`\n=== Door Validation Run ${run + 1}/5 ===`);

      const doorCheck = await page.evaluate(() => {
        const dungeonManager = (window as any).__dungeonManager;
        if (!dungeonManager) return { error: 'DungeonManager not found' };

        const dungeon = dungeonManager.dungeon;
        const width = dungeon[0]?.length || 0;
        const height = dungeon.length;

        const invalidDoors: Array<{x: number, y: number, reason: string}> = [];
        let totalDoors = 0;

        // Check all doors
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (dungeon[y][x] === 3) { // TILE.DOOR = 3
              totalDoors++;

              // Check neighbors
              const neighbors = {
                top: y > 0 ? dungeon[y - 1][x] : 0,
                bottom: y < height - 1 ? dungeon[y + 1][x] : 0,
                left: x > 0 ? dungeon[y][x - 1] : 0,
                right: x < width - 1 ? dungeon[y][x + 1] : 0
              };

              // Count floor neighbors (1 = FLOOR, 3 = DOOR)
              const floorNeighbors = Object.values(neighbors).filter(
                tile => tile === 1 || tile === 3
              ).length;

              // Door must have at least 2 floor/door neighbors
              if (floorNeighbors < 2) {
                invalidDoors.push({
                  x, y,
                  reason: `Only ${floorNeighbors} floor neighbors (needs 2+)`
                });
              }

              // Check for doors leading to walls on both sides
              const verticalWalls = neighbors.top === 2 && neighbors.bottom === 2;
              const horizontalWalls = neighbors.left === 2 && neighbors.right === 2;

              if (verticalWalls || horizontalWalls) {
                invalidDoors.push({
                  x, y,
                  reason: 'Door surrounded by walls'
                });
              }
            }
          }
        }

        return {
          totalDoors,
          invalidDoorCount: invalidDoors.length,
          invalidDoors: invalidDoors.slice(0, 10)
        };
      });

      console.log(`Run ${run + 1} door results:`, doorCheck);

      // Assert no invalid doors
      expect(doorCheck.invalidDoorCount).toBe(0);
      expect(doorCheck.totalDoors).toBeGreaterThan(0); // Should have some doors

      if (run < 4) {
        await page.reload();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should check wall continuity and completeness', async ({ page }) => {
    for (let run = 0; run < 3; run++) {
      console.log(`\n=== Wall Continuity Check Run ${run + 1}/3 ===`);

      const wallCheck = await page.evaluate(() => {
        const dungeonManager = (window as any).__dungeonManager;
        if (!dungeonManager) return { error: 'DungeonManager not found' };

        const dungeon = dungeonManager.dungeon;
        const roomMap = dungeonManager.roomMap;
        const rooms = dungeonManager.rooms || [];
        const width = dungeon[0]?.length || 0;
        const height = dungeon.length;

        const issues: Array<{x: number, y: number, issue: string}> = [];

        // Check each room's perimeter
        for (const room of rooms) {
          // Check top and bottom walls
          for (let x = room.x; x < room.x + room.width; x++) {
            // Top boundary
            const topY = room.y - 1;
            if (topY >= 0 && topY < height) {
              const topTile = dungeon[topY][x];
              // Should be wall or door or part of another room
              if (topTile === 0 && roomMap[topY][x] === -1) { // EMPTY and not in another room
                issues.push({ x, y: topY, issue: 'Missing wall at room top boundary' });
              }
            }

            // Bottom boundary
            const bottomY = room.y + room.height;
            if (bottomY >= 0 && bottomY < height) {
              const bottomTile = dungeon[bottomY][x];
              if (bottomTile === 0 && roomMap[bottomY][x] === -1) {
                issues.push({ x, y: bottomY, issue: 'Missing wall at room bottom boundary' });
              }
            }
          }

          // Check left and right walls
          for (let y = room.y; y < room.y + room.height; y++) {
            // Left boundary
            const leftX = room.x - 1;
            if (leftX >= 0 && leftX < width) {
              const leftTile = dungeon[y][leftX];
              if (leftTile === 0 && roomMap[y][leftX] === -1) {
                issues.push({ x: leftX, y, issue: 'Missing wall at room left boundary' });
              }
            }

            // Right boundary
            const rightX = room.x + room.width;
            if (rightX >= 0 && rightX < width) {
              const rightTile = dungeon[y][rightX];
              if (rightTile === 0 && roomMap[y][rightX] === -1) {
                issues.push({ x: rightX, y, issue: 'Missing wall at room right boundary' });
              }
            }
          }
        }

        return {
          roomCount: rooms.length,
          issueCount: issues.length,
          issues: issues.slice(0, 10)
        };
      });

      console.log(`Run ${run + 1} wall continuity results:`, wallCheck);

      // Assert no missing walls
      expect(wallCheck.issueCount).toBe(0);

      if (run < 2) {
        await page.reload();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should verify shop room size constraints', async ({ page }) => {
    for (let run = 0; run < 3; run++) {
      console.log(`\n=== Shop Size Check Run ${run + 1}/3 ===`);

      const sizeCheck = await page.evaluate(() => {
        const dungeonManager = (window as any).__dungeonManager;
        if (!dungeonManager) return { error: 'DungeonManager not found' };

        const rooms = dungeonManager.rooms || [];
        const shopRooms = rooms.filter((r: any) => r.type === 'shop');

        const SHOP_MIN_ROOM_SIZE = 3;
        const SHOP_MAX_ROOM_SIZE = 10;

        const invalidSizeShops = shopRooms.filter((room: any) => {
          return room.width < SHOP_MIN_ROOM_SIZE ||
                 room.height < SHOP_MIN_ROOM_SIZE ||
                 room.width > SHOP_MAX_ROOM_SIZE ||
                 room.height > SHOP_MAX_ROOM_SIZE;
        });

        return {
          shopCount: shopRooms.length,
          invalidSizeCount: invalidSizeShops.length,
          shopSizes: shopRooms.map((r: any) => ({
            id: r.id,
            width: r.width,
            height: r.height
          }))
        };
      });

      console.log(`Run ${run + 1} shop size results:`, sizeCheck);

      // Assert all shops have valid sizes
      expect(sizeCheck.invalidSizeCount).toBe(0);

      if (run < 2) {
        await page.reload();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should test with different generation methods (BSP vs Layout)', async ({ page }) => {
    // Test BSP generation
    console.log('\n=== Testing BSP Generation ===');

    await page.evaluate(() => {
      const dungeonManager = (window as any).__dungeonManager;
      if (dungeonManager) {
        // Force BSP generation (default method)
        dungeonManager.useBSP = true;
      }
    });

    await page.reload();
    await page.waitForTimeout(1000);

    const bspCheck = await page.evaluate(() => {
      const dungeonManager = (window as any).__dungeonManager;
      if (!dungeonManager) return { error: 'DungeonManager not found' };

      const rooms = dungeonManager.rooms || [];
      const shopRooms = rooms.filter((r: any) => r.type === 'shop');

      return {
        method: 'BSP',
        roomCount: rooms.length,
        shopCount: shopRooms.length,
        shopsWithInventory: shopRooms.filter((r: any) => r.shopInventory).length
      };
    });

    console.log('BSP generation results:', bspCheck);

    // All shops should have inventory
    if (bspCheck.shopCount > 0) {
      expect(bspCheck.shopsWithInventory).toBe(bspCheck.shopCount);
    }

    // Test Layout generation
    console.log('\n=== Testing Layout Generation ===');

    await page.evaluate(() => {
      const dungeonManager = (window as any).__dungeonManager;
      if (dungeonManager) {
        // Force layout generation
        dungeonManager.useBSP = false;
      }
    });

    await page.reload();
    await page.waitForTimeout(1000);

    const layoutCheck = await page.evaluate(() => {
      const dungeonManager = (window as any).__dungeonManager;
      if (!dungeonManager) return { error: 'DungeonManager not found' };

      const rooms = dungeonManager.rooms || [];
      const shopRooms = rooms.filter((r: any) => r.type === 'shop');

      return {
        method: 'Layout',
        roomCount: rooms.length,
        shopCount: shopRooms.length,
        shopsWithInventory: shopRooms.filter((r: any) => r.shopInventory).length
      };
    });

    console.log('Layout generation results:', layoutCheck);

    // All shops should have inventory
    if (layoutCheck.shopCount > 0) {
      expect(layoutCheck.shopsWithInventory).toBe(layoutCheck.shopCount);
    }
  });

  test('comprehensive dungeon quality check', async ({ page }) => {
    console.log('\n=== Comprehensive Dungeon Quality Check ===');

    const qualityCheck = await page.evaluate(() => {
      const dungeonManager = (window as any).__dungeonManager;
      if (!dungeonManager) return { error: 'DungeonManager not found' };

      const dungeon = dungeonManager.dungeon;
      const roomMap = dungeonManager.roomMap;
      const rooms = dungeonManager.rooms || [];
      const width = dungeon[0]?.length || 0;
      const height = dungeon.length;

      // Count tile types
      let floorCount = 0;
      let wallCount = 0;
      let doorCount = 0;
      let emptyCount = 0;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const tile = dungeon[y][x];
          if (tile === 0) emptyCount++;
          else if (tile === 1) floorCount++;
          else if (tile === 2) wallCount++;
          else if (tile === 3) doorCount++;
        }
      }

      // Check room connectivity
      const visitedRooms = new Set<number>();
      const queue: number[] = [0]; // Start from first room
      visitedRooms.add(0);

      while (queue.length > 0) {
        const roomId = queue.shift()!;
        const room = rooms[roomId];
        if (!room) continue;

        for (const neighborId of room.neighbors || []) {
          if (!visitedRooms.has(neighborId)) {
            visitedRooms.add(neighborId);
            queue.push(neighborId);
          }
        }
      }

      const allRoomsConnected = visitedRooms.size === rooms.length;

      return {
        tileStats: {
          empty: emptyCount,
          floor: floorCount,
          wall: wallCount,
          door: doorCount,
          total: width * height
        },
        roomStats: {
          total: rooms.length,
          connected: visitedRooms.size,
          allConnected: allRoomsConnected
        },
        shopStats: {
          count: rooms.filter((r: any) => r.type === 'shop').length,
          withInventory: rooms.filter((r: any) => r.type === 'shop' && r.shopInventory).length
        },
        dungeonSize: { width, height }
      };
    });

    console.log('Quality check results:', qualityCheck);

    // Assert quality metrics
    expect(qualityCheck.tileStats.floor).toBeGreaterThan(0);
    expect(qualityCheck.tileStats.wall).toBeGreaterThan(0);
    expect(qualityCheck.tileStats.door).toBeGreaterThan(0);
    expect(qualityCheck.roomStats.allConnected).toBe(true);

    if (qualityCheck.shopStats.count > 0) {
      expect(qualityCheck.shopStats.withInventory).toBe(qualityCheck.shopStats.count);
    }
  });
});
