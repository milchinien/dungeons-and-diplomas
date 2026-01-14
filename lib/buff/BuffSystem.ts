/**
 * Buff System
 *
 * Handles buff application, selection, and player buff state updates.
 */
import type { Buff, BuffType, PlayerBuffs } from '../constants';
import { BUFF_POOL, INITIAL_PLAYER_BUFFS } from '../constants';
import type { Player } from '../enemy';

// Cheat system: God Mode flag
let godModeEnabled = false;

/**
 * Enable or disable God Mode (invincibility)
 */
export function setGodMode(enabled: boolean): void {
  godModeEnabled = enabled;
  console.log(`[BuffSystem] God Mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
}

/**
 * Check if God Mode is enabled
 */
export function isGodModeEnabled(): boolean {
  return godModeEnabled;
}

/**
 * Select random buffs from the pool
 * @param count Number of buffs to select (default 2)
 * @returns Array of randomly selected buffs
 */
export function selectRandomBuffs(count: number = 2): Buff[] {
  const shuffled = [...BUFF_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, BUFF_POOL.length));
}

/**
 * Apply a buff to the player
 * @param player The player to apply the buff to
 * @param buff The buff to apply
 */
export function applyBuff(player: Player, buff: Buff): void {
  // Initialize buffs if not present
  if (!player.buffs) {
    player.buffs = { ...INITIAL_PLAYER_BUFFS };
  }

  // Track the buff
  player.buffs.activeBuffs.push(buff.type);

  switch (buff.type) {
    case 'hp_boost':
      if (buff.value) {
        player.buffs.maxHpBonus += buff.value;
        player.maxHp += buff.value;
        player.hp += buff.value;
      }
      break;

    case 'shield':
      player.buffs.hasShield = true;
      if (buff.maxShield) {
        player.buffs.maxShield += buff.maxShield;
        player.buffs.currentShield = player.buffs.maxShield;
      }
      if (buff.regenRate) {
        player.buffs.shieldRegenRate = buff.regenRate;
      }
      break;

    case 'time_bonus':
      if (buff.value) {
        player.buffs.timeBonus += buff.value;
      }
      break;

    case 'damage_boost':
      if (buff.value) {
        player.buffs.damageBoost += buff.value;
      }
      break;

    case 'damage_reduction':
      if (buff.value) {
        player.buffs.damageReduction += buff.value;
      }
      break;

    case 'regen':
      if (buff.hpPerTick) {
        player.buffs.regenRate += buff.hpPerTick;
      }
      // Stack reduces interval: 3s -> 2.25s -> 1.69s -> etc. (min 1s)
      const regenCount = player.buffs.activeBuffs.filter(b => b === 'regen').length;
      if (regenCount > 1) {
        player.buffs.regenInterval = Math.max(1, 3 * Math.pow(0.75, regenCount - 1));
      }
      break;
  }

  console.log(`[BuffSystem] Applied buff: ${buff.name}`, player.buffs);
}

/**
 * Apply damage to player, respecting shield and God Mode
 * @param player The player taking damage
 * @param damage The amount of damage
 * @returns The actual HP damage taken (after shield absorption)
 */
export function applyDamageToPlayer(player: Player, damage: number): number {
  // God Mode: No damage taken
  if (godModeEnabled) {
    console.log(`[BuffSystem] God Mode active - ${damage} damage blocked!`);
    return 0;
  }

  if (!player.buffs?.hasShield || player.buffs.currentShield <= 0) {
    // No shield - full damage to HP
    player.hp = Math.max(0, player.hp - damage);
    return damage;
  }

  // Shield absorbs damage first
  const shieldDamage = Math.min(player.buffs.currentShield, damage);
  player.buffs.currentShield -= shieldDamage;
  const remainingDamage = damage - shieldDamage;

  if (remainingDamage > 0) {
    player.hp = Math.max(0, player.hp - remainingDamage);
  }

  console.log(`[BuffSystem] Damage: ${damage}, Shield absorbed: ${shieldDamage}, HP damage: ${remainingDamage}`);
  return remainingDamage;
}

/**
 * Update shield regeneration
 * @param player The player
 * @param deltaTime Time since last update in seconds
 */
export function updateShieldRegen(player: Player, deltaTime: number): void {
  if (!player.buffs?.hasShield) return;
  if (player.buffs.currentShield >= player.buffs.maxShield) return;

  player.buffs.currentShield = Math.min(
    player.buffs.maxShield,
    player.buffs.currentShield + (player.buffs.shieldRegenRate * deltaTime)
  );
}

// Timer for HP regeneration (tracks time since last tick)
let regenTimer = 0;

/**
 * Update HP regeneration
 * @param player The player
 * @param deltaTime Time since last update in seconds
 */
export function updateHpRegen(player: Player, deltaTime: number): void {
  if (!player.buffs || player.buffs.regenRate <= 0) return;
  if (player.hp >= player.maxHp) {
    regenTimer = 0;
    return;
  }

  regenTimer += deltaTime;

  if (regenTimer >= player.buffs.regenInterval) {
    player.hp = Math.min(player.maxHp, player.hp + player.buffs.regenRate);
    regenTimer = 0;
    console.log(`[BuffSystem] HP regen tick: +${player.buffs.regenRate} HP (${player.hp}/${player.maxHp})`);
  }
}

/**
 * Reset regeneration timer (call on new dungeon/game restart)
 */
export function resetRegenTimer(): void {
  regenTimer = 0;
}

/**
 * Get total time bonus from buffs
 * @param player The player
 * @returns Additional seconds for quiz answers
 */
export function getTimeBonus(player: Player): number {
  return player.buffs?.timeBonus ?? 0;
}

/**
 * Get total damage boost from buffs
 * @param player The player
 * @returns Additional damage on correct answer
 */
export function getDamageBoost(player: Player): number {
  return player.buffs?.damageBoost ?? 0;
}

/**
 * Get total damage reduction from buffs
 * @param player The player
 * @returns Damage reduction on wrong answer (clamped so min damage is 5)
 */
export function getDamageReduction(player: Player): number {
  return player.buffs?.damageReduction ?? 0;
}

/**
 * Reset player buffs (for new game/dungeon)
 * @param player The player
 * @param resetMaxHp Whether to reset maxHp to base value
 */
export function resetPlayerBuffs(player: Player, resetMaxHp: boolean = true): void {
  const baseMaxHp = resetMaxHp ? (player.maxHp - (player.buffs?.maxHpBonus ?? 0)) : player.maxHp;

  player.buffs = { ...INITIAL_PLAYER_BUFFS };
  player.maxHp = baseMaxHp;

  resetRegenTimer();
  console.log('[BuffSystem] Player buffs reset');
}
