/**
 * Shop rendering system.
 * Renders shop sign, counters, and floating items/perks with rarity glow effects.
 */

import type { Room } from '../constants';
import { TILE_SOURCE_SIZE } from '../spriteConfig';
import {
  FLOATING_ITEM_AMPLITUDE,
  FLOATING_ITEM_SPEED,
  LEGENDARY_PULSE_SPEED
} from '../constants';
import { getShopLayout, calculateFloatingY, type ShopLayout } from '../shop/ShopLayout';
import type { ShopInventory } from '../shop/ShopInventory';
import { Rarity, getRarityColor, RARITY_CONFIG } from '../shop/Rarity';

/**
 * Renders the shop sign.
 */
export function renderShopSign(
  ctx: CanvasRenderingContext2D,
  layout: ShopLayout,
  camera: { x: number; y: number },
  signImage?: HTMLImageElement
): void {
  const screenX = layout.signPosition.x * TILE_SOURCE_SIZE - camera.x;
  const screenY = layout.signPosition.y * TILE_SOURCE_SIZE - camera.y;

  if (signImage && signImage.complete && signImage.naturalWidth > 0) {
    // Sprite verwenden
    ctx.drawImage(signImage, screenX - TILE_SOURCE_SIZE, screenY, TILE_SOURCE_SIZE * 2, TILE_SOURCE_SIZE);
  } else {
    // Fallback: Text-basiertes Schild
    ctx.save();

    // Schild-Hintergrund
    ctx.fillStyle = '#8B4513';  // Holzbraun
    ctx.fillRect(screenX - 60, screenY, 120, 40);

    // Rahmen
    ctx.strokeStyle = '#5D3A1A';
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX - 60, screenY, 120, 40);

    // Text
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SHOP', screenX, screenY + 20);

    ctx.restore();
  }
}

/**
 * Renders the shop counters.
 */
export function renderCounters(
  ctx: CanvasRenderingContext2D,
  layout: ShopLayout,
  camera: { x: number; y: number },
  counterImage?: HTMLImageElement
): void {
  const allCounterTiles = [...layout.leftCounterTiles, ...layout.rightCounterTiles];

  for (const tile of allCounterTiles) {
    const screenX = tile.x * TILE_SOURCE_SIZE - camera.x;
    const screenY = tile.y * TILE_SOURCE_SIZE - camera.y;

    if (counterImage && counterImage.complete && counterImage.naturalWidth > 0) {
      ctx.drawImage(counterImage, screenX, screenY, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE);
    } else {
      // Fallback: Einfacher Tresen
      ctx.save();

      // Tresen-Oberfläche
      ctx.fillStyle = '#654321';
      ctx.fillRect(screenX, screenY, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE);

      // Kante
      ctx.fillStyle = '#4A3219';
      ctx.fillRect(screenX, screenY + TILE_SOURCE_SIZE - 10, TILE_SOURCE_SIZE, 10);

      // Holzmaserung (Details)
      ctx.strokeStyle = '#5D3A1A';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(screenX + 5, screenY + 15);
      ctx.lineTo(screenX + TILE_SOURCE_SIZE - 5, screenY + 15);
      ctx.moveTo(screenX + 10, screenY + 35);
      ctx.lineTo(screenX + TILE_SOURCE_SIZE - 10, screenY + 35);
      ctx.stroke();

      ctx.restore();
    }
  }
}

/**
 * Renders the glow effect for a rarity.
 */
export function renderRarityGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rarity: Rarity,
  time: number,
  size: number = 40
): void {
  const config = RARITY_CONFIG[rarity];
  if (config.glowIntensity === 0) return;  // Common hat keinen Glow

  ctx.save();

  // Pulsieren für Legendary
  let alpha = config.glowIntensity * 0.6;
  if (rarity === Rarity.LEGENDARY) {
    alpha = 0.4 + Math.sin(time * LEGENDARY_PULSE_SPEED * Math.PI * 2) * 0.3;
  }

  // Glow als radialer Gradient
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
  const alphaHex = Math.floor(alpha * 255).toString(16).padStart(2, '0');
  gradient.addColorStop(0, `${config.color}${alphaHex}`);
  gradient.addColorStop(1, `${config.color}00`);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Renders the floating items above the left counter.
 */
export function renderFloatingItems(
  ctx: CanvasRenderingContext2D,
  inventory: ShopInventory,
  layout: ShopLayout,
  time: number,
  camera: { x: number; y: number },
  itemSprites?: Map<string, HTMLImageElement>
): void {
  for (let i = 0; i < inventory.items.length; i++) {
    const item = inventory.items[i];
    if (item === null) continue;  // Bereits gekauft

    const basePos = layout.itemPositions[i];
    const floatingY = calculateFloatingY(
      time,
      basePos.y,
      FLOATING_ITEM_AMPLITUDE * TILE_SOURCE_SIZE,
      FLOATING_ITEM_SPEED
    );

    const screenX = basePos.x - camera.x;
    const screenY = floatingY - camera.y;

    // Glow zuerst (dahinter)
    renderRarityGlow(ctx, screenX, screenY, item.rarity, time);

    // Item-Sprite
    const sprite = itemSprites?.get(item.definition.spriteKey);
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      ctx.drawImage(sprite, screenX - 16, screenY - 16, 32, 32);
    } else {
      // Fallback: Farbiges Icon mit Symbol
      ctx.save();

      // Hintergrund-Kreis
      ctx.fillStyle = getRarityColor(item.rarity);
      ctx.beginPath();
      ctx.arc(screenX, screenY, 14, 0, Math.PI * 2);
      ctx.fill();

      // Rand
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Symbol je nach Item-Typ
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const symbols: Record<string, string> = {
        'item_sword': '⚔',
        'item_chestplate': '🛡',
        'item_helmet': '⛑',
        'item_shield': '🔰',
        'item_boots': '👢',
        'item_amulet': '💎'
      };
      ctx.fillText(symbols[item.definition.spriteKey] || '?', screenX, screenY);

      ctx.restore();
    }
  }
}

/**
 * Renders the floating perks above the right counter.
 */
export function renderFloatingPerks(
  ctx: CanvasRenderingContext2D,
  inventory: ShopInventory,
  layout: ShopLayout,
  time: number,
  camera: { x: number; y: number },
  perkIcons?: Map<string, HTMLImageElement>
): void {
  for (let i = 0; i < inventory.perks.length; i++) {
    const perk = inventory.perks[i];
    if (perk === null) continue;  // Bereits gekauft

    const basePos = layout.perkPositions[i];
    const floatingY = calculateFloatingY(
      time,
      basePos.y,
      FLOATING_ITEM_AMPLITUDE * TILE_SOURCE_SIZE,
      FLOATING_ITEM_SPEED
    );

    const screenX = basePos.x - camera.x;
    const screenY = floatingY - camera.y;

    // Glow zuerst
    renderRarityGlow(ctx, screenX, screenY, perk.rarity, time);

    // Perk-Icon
    const icon = perkIcons?.get(perk.definition.iconKey);
    if (icon && icon.complete && icon.naturalWidth > 0) {
      ctx.drawImage(icon, screenX - 16, screenY - 16, 32, 32);
    } else {
      // Fallback: Farbiger Kreis mit Symbol
      ctx.save();

      // Hintergrund-Kreis
      ctx.fillStyle = getRarityColor(perk.rarity);
      ctx.beginPath();
      ctx.arc(screenX, screenY, 14, 0, Math.PI * 2);
      ctx.fill();

      // Rand
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Symbol je nach Perk-Typ
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const symbols: Record<string, string> = {
        'perk_hp_flat': '❤',
        'perk_hp_percent': '❤%',
        'perk_damage_flat': '⚔',
        'perk_damage_percent': '⚔%',
        'perk_regeneration': '💚',
        'perk_critical': '⚡',
        'perk_time_bonus': '⏱',
        'perk_extra_life': '✨',
        'perk_elo_boost': '📈'
      };
      ctx.fillText(symbols[perk.definition.iconKey] || '?', screenX, screenY);

      ctx.restore();
    }
  }
}

/**
 * Shop assets interface for optional sprite loading
 */
export interface ShopAssets {
  signImage?: HTMLImageElement;
  counterImage?: HTMLImageElement;
  itemSprites?: Map<string, HTMLImageElement>;
  perkIcons?: Map<string, HTMLImageElement>;
}

/**
 * Renders the complete shop room.
 */
export function renderShopRoom(
  ctx: CanvasRenderingContext2D,
  room: Room,
  time: number,
  camera: { x: number; y: number },
  assets?: ShopAssets
): void {
  if (room.type !== 'shop' || !room.shopInventory) return;

  const layout = getShopLayout(room);

  // 1. Schild rendern
  renderShopSign(ctx, layout, camera, assets?.signImage);

  // 2. Tresen rendern
  renderCounters(ctx, layout, camera, assets?.counterImage);

  // 3. Schwebende Items
  renderFloatingItems(
    ctx,
    room.shopInventory,
    layout,
    time,
    camera,
    assets?.itemSprites
  );

  // 4. Schwebende Perks
  renderFloatingPerks(
    ctx,
    room.shopInventory,
    layout,
    time,
    camera,
    assets?.perkIcons
  );
}
