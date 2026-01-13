/**
 * Tooltip rendering system for shop items and perks.
 * Displays item details when player is near purchasable goods.
 */

import type { Item } from '../shop/Item';
import { getItemEffectDescription } from '../shop/Item';
import type { Perk } from '../shop/Perk';
import { getPerkEffectDescription } from '../shop/Perk';
import { Rarity, RARITY_CONFIG } from '../shop/Rarity';

export interface TooltipData {
  title: string;
  description: string;
  effectText: string;
  rarity: Rarity;
}

/**
 * Creates tooltip data for an item.
 */
export function createItemTooltip(item: Item): TooltipData {
  return {
    title: item.definition.name,
    description: item.definition.description,
    effectText: getItemEffectDescription(item),
    rarity: item.rarity
  };
}

/**
 * Creates tooltip data for a perk.
 */
export function createPerkTooltip(perk: Perk): TooltipData {
  return {
    title: perk.definition.name,
    description: perk.definition.description,
    effectText: getPerkEffectDescription(perk),
    rarity: perk.rarity
  };
}

/**
 * Renders a tooltip at a position on the canvas.
 */
export function renderTooltip(
  ctx: CanvasRenderingContext2D,
  tooltip: TooltipData,
  screenX: number,
  screenY: number
): void {
  ctx.save();

  const padding = 10;
  const width = 200;
  const height = 100;

  // Position adjustment (above the item, centered)
  let tooltipX = screenX - width / 2;
  let tooltipY = screenY - height - 40;

  // Keep tooltip on screen
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

  if (tooltipX < 10) tooltipX = 10;
  if (tooltipX + width > canvasWidth - 10) tooltipX = canvasWidth - width - 10;
  if (tooltipY < 10) tooltipY = screenY + 40; // Show below if no room above

  // Background with slight transparency
  ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
  ctx.beginPath();
  ctx.roundRect(tooltipX, tooltipY, width, height, 8);
  ctx.fill();

  // Border in rarity color
  ctx.strokeStyle = RARITY_CONFIG[tooltip.rarity].color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Title (in rarity color)
  ctx.fillStyle = RARITY_CONFIG[tooltip.rarity].color;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(tooltip.title, tooltipX + width / 2, tooltipY + padding + 14);

  // Rarity label
  ctx.fillStyle = RARITY_CONFIG[tooltip.rarity].color;
  ctx.font = '10px Arial';
  ctx.fillText(
    RARITY_CONFIG[tooltip.rarity].name,
    tooltipX + width / 2,
    tooltipY + padding + 28
  );

  // Description
  ctx.fillStyle = '#CCCCCC';
  ctx.font = '11px Arial';
  ctx.fillText(tooltip.description, tooltipX + width / 2, tooltipY + padding + 48);

  // Effect (highlighted)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 13px Arial';
  ctx.fillText(tooltip.effectText, tooltipX + width / 2, tooltipY + padding + 68);

  // Interaction hint
  ctx.fillStyle = '#888888';
  ctx.font = '10px Arial';
  ctx.fillText('[E] Kaufen', tooltipX + width / 2, tooltipY + height - 8);

  ctx.restore();
}

/**
 * Renders an interaction hint without the full tooltip.
 */
export function renderInteractionHint(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  text: string = '[E] Interagieren'
): void {
  ctx.save();

  ctx.font = '12px Arial';
  ctx.textAlign = 'center';

  const textWidth = ctx.measureText(text).width;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.beginPath();
  ctx.roundRect(screenX - textWidth / 2 - 8, screenY - 22, textWidth + 16, 24, 4);
  ctx.fill();

  // Text
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(text, screenX, screenY - 6);

  ctx.restore();
}

/**
 * Renders a simple "Shop" label above the shop.
 */
export function renderShopLabel(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  isOpen: boolean
): void {
  ctx.save();

  const text = isOpen ? 'Shop (offen)' : 'Shop (geschlossen)';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';

  const textWidth = ctx.measureText(text).width;

  // Background
  ctx.fillStyle = isOpen ? 'rgba(34, 139, 34, 0.8)' : 'rgba(139, 69, 19, 0.8)';
  ctx.beginPath();
  ctx.roundRect(screenX - textWidth / 2 - 10, screenY - 24, textWidth + 20, 28, 4);
  ctx.fill();

  // Border
  ctx.strokeStyle = isOpen ? '#FFD700' : '#8B4513';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Text
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(text, screenX, screenY - 6);

  ctx.restore();
}
