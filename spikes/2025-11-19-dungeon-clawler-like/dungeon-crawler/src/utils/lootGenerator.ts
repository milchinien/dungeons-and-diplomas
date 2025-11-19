import { Item } from '../types/game';
import { shopItems } from '../data/items';

/**
 * Generate random loot after combat
 * @param floorLevel - Current floor level
 * @param isBoss - Whether the enemy was a boss
 * @returns Object with gold and items
 */
export function generateLoot(floorLevel: number, isBoss: boolean): { gold: number; items: Item[] } {
  const baseGold = 10;
  const gold = baseGold + floorLevel * 5 + (isBoss ? 20 : 0);

  const items: Item[] = [];

  // Item drop chance
  const dropChance = isBoss ? 0.8 : 0.2; // 80% for boss, 20% for normal enemies
  const randomRoll = Math.random();

  if (randomRoll < dropChance) {
    // Pick a random item from shop items
    const randomItem = shopItems[Math.floor(Math.random() * shopItems.length)];
    items.push(randomItem);
  }

  // Boss has chance for additional item
  if (isBoss && Math.random() < 0.5) {
    const randomItem = shopItems[Math.floor(Math.random() * shopItems.length)];
    items.push(randomItem);
  }

  return { gold, items };
}
