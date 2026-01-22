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
 * Note: Renders in world coordinates. Camera transform is applied by GameRenderer.
 */
export function renderShopSign(
  ctx: CanvasRenderingContext2D,
  layout: ShopLayout,
  signImage?: HTMLImageElement
): void {
  const screenX = layout.signPosition.x * TILE_SOURCE_SIZE;
  const screenY = layout.signPosition.y * TILE_SOURCE_SIZE;

  if (signImage && signImage.complete && signImage.naturalWidth > 0) {
    // Sprite verwenden
    ctx.drawImage(signImage, screenX - TILE_SOURCE_SIZE, screenY, TILE_SOURCE_SIZE * 2, TILE_SOURCE_SIZE);
  } else {
    // Fallback: Verbessertes Text-basiertes Schild
    ctx.save();

    const signWidth = 140;
    const signHeight = 50;
    const signX = screenX - signWidth / 2;
    const signY = screenY - 10;

    // Schild-Schatten (Tiefe)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(signX + 4, signY + 4, signWidth, signHeight);

    // Schild-Hintergrund (dunkles Holz)
    ctx.fillStyle = '#654321';
    ctx.fillRect(signX, signY, signWidth, signHeight);

    // Holzmaserung (vertikale Linien)
    ctx.strokeStyle = 'rgba(61, 33, 16, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const x = signX + 20 + i * 30;
      ctx.beginPath();
      ctx.moveTo(x, signY + 5);
      ctx.lineTo(x, signY + signHeight - 5);
      ctx.stroke();
    }

    // Dekorativer Rahmen (doppelt)
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 3;
    ctx.strokeRect(signX + 3, signY + 3, signWidth - 6, signHeight - 6);

    ctx.strokeStyle = '#4A2511';
    ctx.lineWidth = 2;
    ctx.strokeRect(signX, signY, signWidth, signHeight);

    // Metallbeschläge an den Ecken
    const cornerSize = 8;
    ctx.fillStyle = '#8B8B8B';
    // Oben links
    ctx.fillRect(signX + 5, signY + 5, cornerSize, cornerSize);
    // Oben rechts
    ctx.fillRect(signX + signWidth - 5 - cornerSize, signY + 5, cornerSize, cornerSize);
    // Unten links
    ctx.fillRect(signX + 5, signY + signHeight - 5 - cornerSize, cornerSize, cornerSize);
    // Unten rechts
    ctx.fillRect(signX + signWidth - 5 - cornerSize, signY + signHeight - 5 - cornerSize, cornerSize, cornerSize);

    // Text mit Goldschimmer
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 32px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text-Schatten für Tiefe
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillText('SHOP', screenX, signY + signHeight / 2);

    // Highlight auf Text
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#FFED4E';
    ctx.font = 'bold 32px serif';
    ctx.fillText('SHOP', screenX - 1, signY + signHeight / 2 - 1);

    ctx.restore();
  }
}

/**
 * Renders the shop counters.
 * Note: Renders in world coordinates. Camera transform is applied by GameRenderer.
 */
export function renderCounters(
  ctx: CanvasRenderingContext2D,
  layout: ShopLayout,
  counterImage?: HTMLImageElement
): void {
  const allCounterTiles = [...layout.leftCounterTiles, ...layout.rightCounterTiles];

  for (const tile of allCounterTiles) {
    const screenX = tile.x * TILE_SOURCE_SIZE;
    const screenY = tile.y * TILE_SOURCE_SIZE;

    if (counterImage && counterImage.complete && counterImage.naturalWidth > 0) {
      ctx.drawImage(counterImage, screenX, screenY, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE);
    } else {
      // Fallback: Verbesserter Tresen
      ctx.save();

      // Schatten unter dem Tresen
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(screenX + 2, screenY + TILE_SOURCE_SIZE - 8, TILE_SOURCE_SIZE - 4, 6);

      // Tresen-Front (dunkles Holz)
      const gradient = ctx.createLinearGradient(screenX, screenY, screenX, screenY + TILE_SOURCE_SIZE);
      gradient.addColorStop(0, '#8B6F47');  // Heller oben
      gradient.addColorStop(0.6, '#654321'); // Mittlerer Ton
      gradient.addColorStop(1, '#4A2511');   // Dunkler unten
      ctx.fillStyle = gradient;
      ctx.fillRect(screenX, screenY, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE - 8);

      // Tresen-Oberfläche (Holzplatte)
      ctx.fillStyle = '#A0826D';
      ctx.fillRect(screenX, screenY, TILE_SOURCE_SIZE, 12);

      // Glanz auf Oberfläche
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(screenX + 4, screenY + 2, TILE_SOURCE_SIZE - 8, 4);

      // Holzmaserung (horizontale Linien)
      ctx.strokeStyle = 'rgba(61, 33, 16, 0.4)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const y = screenY + 20 + i * 12;
        ctx.beginPath();
        ctx.moveTo(screenX + 4, y);
        ctx.lineTo(screenX + TILE_SOURCE_SIZE - 4, y);
        ctx.stroke();
      }

      // Vertikale Holzbretter
      ctx.strokeStyle = 'rgba(61, 33, 16, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(screenX + TILE_SOURCE_SIZE / 2, screenY + 12);
      ctx.lineTo(screenX + TILE_SOURCE_SIZE / 2, screenY + TILE_SOURCE_SIZE - 8);
      ctx.stroke();

      // Rahmen
      ctx.strokeStyle = '#3D2110';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX, screenY, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE - 8);

      // Metallbeschläge (dekorativ)
      ctx.fillStyle = '#8B8B8B';
      const boltSize = 4;
      // Ecken
      ctx.fillRect(screenX + 4, screenY + 16, boltSize, boltSize);
      ctx.fillRect(screenX + TILE_SOURCE_SIZE - 8, screenY + 16, boltSize, boltSize);
      ctx.fillRect(screenX + 4, screenY + TILE_SOURCE_SIZE - 20, boltSize, boltSize);
      ctx.fillRect(screenX + TILE_SOURCE_SIZE - 8, screenY + TILE_SOURCE_SIZE - 20, boltSize, boltSize);

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
 * Note: Renders in world coordinates. Camera transform is applied by GameRenderer.
 */
export function renderFloatingItems(
  ctx: CanvasRenderingContext2D,
  inventory: ShopInventory,
  layout: ShopLayout,
  time: number,
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

    const screenX = basePos.x;
    const screenY = floatingY;

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
 * Note: Renders in world coordinates. Camera transform is applied by GameRenderer.
 */
export function renderFloatingPerks(
  ctx: CanvasRenderingContext2D,
  inventory: ShopInventory,
  layout: ShopLayout,
  time: number,
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

    const screenX = basePos.x;
    const screenY = floatingY;

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

// Debug counter for shop rendering
let shopRenderDebugCounter = 0;

/**
 * Renders the complete shop room.
 * Note: Renders in world coordinates. Camera transform is applied by GameRenderer.
 */
export function renderShopRoom(
  ctx: CanvasRenderingContext2D,
  room: Room,
  time: number,
  assets?: ShopAssets
): void {
  if (room.type !== 'shop' || !room.shopInventory) return;

  // Debug log every 120 frames (every 2 seconds)
  shopRenderDebugCounter++;
  if (shopRenderDebugCounter >= 120) {
    shopRenderDebugCounter = 0;
    console.log(`[ShopRenderer] Rendering shop room ${room.id} at (${room.x}, ${room.y}) size ${room.width}x${room.height}`);
    console.log(`[ShopRenderer] Items: ${room.shopInventory.items.length}, Perks: ${room.shopInventory.perks.length}`);
  }

  const layout = getShopLayout(room);

  // 1. Schild rendern
  renderShopSign(ctx, layout, assets?.signImage);

  // 2. Tresen rendern
  renderCounters(ctx, layout, assets?.counterImage);

  // 3. Schwebende Items
  renderFloatingItems(
    ctx,
    room.shopInventory,
    layout,
    time,
    assets?.itemSprites
  );

  // 4. Schwebende Perks
  renderFloatingPerks(
    ctx,
    room.shopInventory,
    layout,
    time,
    assets?.perkIcons
  );
}
