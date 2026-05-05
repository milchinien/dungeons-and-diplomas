/**
 * Test for double walls in dungeon generation
 * Run with: npx tsx tests/dungeon-double-walls.test.ts
 */

import { generateDungeonFromLayouts } from '../lib/dungeon/layoutGeneration';
import { TILE } from '../lib/constants';
import { seedRoomLayouts, getRoomLayouts } from '../lib/db/roomLayouts';
import { getLayoutPool } from '../lib/roomlayouts/LayoutPool';

// Initialize database and seed layouts
seedRoomLayouts();

// Load layouts into pool
const pool = getLayoutPool();
const layouts = getRoomLayouts();
pool.setLayouts(layouts);

console.log('Testing dungeon generation for double walls...\n');
console.log(`Layout pool has ${pool.getCount()} layouts`);

// Generate a test dungeon
const { dungeon, rooms } = generateDungeonFromLayouts(15, 12345);

console.log(`Generated dungeon with ${rooms.length} rooms`);

// Find double walls
const doubleWalls: Array<{ x: number; y: number; direction: string; rooms: string }> = [];

// Check horizontal double walls (stacked vertically)
for (let y = 0; y < dungeon.length - 1; y++) {
  for (let x = 0; x < dungeon[0].length; x++) {
    const current = dungeon[y][x];
    const below = dungeon[y + 1][x];

    // If both tiles are walls (2), we have a potential double wall
    if (current === TILE.WALL && below === TILE.WALL) {
      // Check if they're between different rooms by looking at adjacent floor tiles
      let hasRoomAbove = false;
      let hasRoomBelow = false;

      // Check above
      if (y > 0 && dungeon[y - 1][x] === TILE.FLOOR) {
        hasRoomAbove = true;
      }

      // Check below
      if (y + 2 < dungeon.length && dungeon[y + 2][x] === TILE.FLOOR) {
        hasRoomBelow = true;
      }

      if (hasRoomAbove && hasRoomBelow) {
        doubleWalls.push({
          x,
          y,
          direction: 'horizontal',
          rooms: `Between (${x},${y - 1}) and (${x},${y + 2})`
        });
      }
    }
  }
}

// Check vertical double walls (side by side)
for (let y = 0; y < dungeon.length; y++) {
  for (let x = 0; x < dungeon[0].length - 1; x++) {
    const current = dungeon[y][x];
    const right = dungeon[y][x + 1];

    // If both tiles are walls (2), we have a potential double wall
    if (current === TILE.WALL && right === TILE.WALL) {
      // Check if they're between different rooms by looking at adjacent floor tiles
      let hasRoomLeft = false;
      let hasRoomRight = false;

      // Check left
      if (x > 0 && dungeon[y][x - 1] === TILE.FLOOR) {
        hasRoomLeft = true;
      }

      // Check right
      if (x + 2 < dungeon[0].length && dungeon[y][x + 2] === TILE.FLOOR) {
        hasRoomRight = true;
      }

      if (hasRoomLeft && hasRoomRight) {
        doubleWalls.push({
          x,
          y,
          direction: 'vertical',
          rooms: `Between (${x - 1},${y}) and (${x + 2},${y})`
        });
      }
    }
  }
}

console.log(`\nFound ${doubleWalls.length} double walls between rooms`);

if (doubleWalls.length > 0) {
  console.log('\n❌ FAILED: Double walls detected!\n');
  console.log('First 10 double walls:');
  doubleWalls.slice(0, 10).forEach((wall, idx) => {
    console.log(`  ${idx + 1}. ${wall.direction} at (${wall.x}, ${wall.y}) - ${wall.rooms}`);
  });

  // Save dungeon to file for debugging
  const fs = require('fs');
  const debugOutput = {
    rooms,
    doubleWalls: doubleWalls.slice(0, 20),
    dungeonSample: dungeon.slice(40, 60).map(row => row.slice(40, 60))
  };
  fs.writeFileSync('test-results/double-walls-debug.json', JSON.stringify(debugOutput, null, 2));
  console.log('\nDebug data saved to test-results/double-walls-debug.json');

  process.exit(1);
} else {
  console.log('\n✅ SUCCESS: No double walls found!');
  console.log('All rooms are properly connected with single walls.');
  process.exit(0);
}
