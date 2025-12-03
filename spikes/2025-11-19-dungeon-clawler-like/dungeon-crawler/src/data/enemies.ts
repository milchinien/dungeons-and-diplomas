import { Enemy } from '../types/game';

export function generateEnemy(floorLevel: number, isBoss: boolean = false): Enemy {
  if (isBoss) {
    return generateBoss(floorLevel);
  }

  const enemyTypes = ['Goblin', 'Skeleton', 'Rat', 'Spider'];
  const enemyName = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

  const baseHp = 40;
  const baseDamage = 5;

  return {
    id: `enemy-${Date.now()}`,
    name: enemyName,
    maxHp: baseHp + floorLevel * 10,
    currentHp: baseHp + floorLevel * 10,
    damage: baseDamage + floorLevel * 2,
    isBoss: false,
  };
}

function generateBoss(floorLevel: number): Enemy {
  const bossTypes = ['Goblin King', 'Dark Wizard', 'Stone Golem', 'Dragon'];
  const bossName = bossTypes[Math.floor(Math.random() * bossTypes.length)];

  const baseHp = 100;
  const baseDamage = 10;

  return {
    id: `boss-${Date.now()}`,
    name: bossName,
    maxHp: baseHp + floorLevel * 20,
    currentHp: baseHp + floorLevel * 20,
    damage: baseDamage + floorLevel * 5,
    isBoss: true,
  };
}
