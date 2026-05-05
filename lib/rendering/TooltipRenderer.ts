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
 * Design matches screenshot: prominent rarity, clear sections, gold effect text.
 */
export function renderTooltip(
  ctx: CanvasRenderingContext2D,
  tooltip: TooltipData,
  screenX: number,
  screenY: number
): void {
  ctx.save();

  const padding = 14;
  const width = 260;
  const titleHeight = 26;
  const rarityHeight = 20;
  const descHeight = 22;
  const effectHeight = 24;
  const instructionHeight = 18;
  const height = padding * 3 + titleHeight + rarityHeight + descHeight + effectHeight + instructionHeight;

  // Position adjustment (to the right and above the item)
  let tooltipX = screenX + 50;
  let tooltipY = screenY - height / 2;

  // Keep tooltip on screen
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

  if (tooltipX + width > canvasWidth - 10) {
    tooltipX = screenX - width - 50; // Place to the left instead
  }
  if (tooltipY < 10) tooltipY = 10;
  if (tooltipY + height > canvasHeight - 10) {
    tooltipY = canvasHeight - height - 10;
  }
  if (tooltipX < 10) tooltipX = 10;

  // Shadow for depth
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(tooltipX + 5, tooltipY + 5, width, height, 8);
  ctx.fill();

  // Background with slight transparency
  ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
  ctx.beginPath();
  ctx.roundRect(tooltipX, tooltipY, width, height, 8);
  ctx.fill();

  // Border in rarity color (thicker for prominence)
  const rarityColor = RARITY_CONFIG[tooltip.rarity].color;
  ctx.strokeStyle = rarityColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner glow effect
  ctx.strokeStyle = rarityColor + '40'; // 25% opacity
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(tooltipX + 3, tooltipY + 3, width - 6, height - 6, 6);
  ctx.stroke();

  // Title section background
  ctx.fillStyle = rarityColor + '20'; // 12.5% opacity
  ctx.fillRect(tooltipX + 3, tooltipY + 3, width - 6, titleHeight + rarityHeight + padding);

  // Current Y position for text
  let currentY = tooltipY + padding + 16;

  // Title (white, bold, left-aligned)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(tooltip.title, tooltipX + padding, currentY);
  currentY += titleHeight;

  // Rarity label (rarity color, bold, centered)
  ctx.fillStyle = rarityColor;
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(RARITY_CONFIG[tooltip.rarity].name, tooltipX + width / 2, currentY);
  currentY += rarityHeight + padding;

  // Description (gray, smaller, left-aligned)
  ctx.fillStyle = '#CCCCCC';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(tooltip.description, tooltipX + padding, currentY);
  currentY += descHeight;

  // Effect (gold/yellow, bold, left-aligned)
  ctx.fillStyle = '#FFD700'; // Gold color for effect
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(tooltip.effectText, tooltipX + padding, currentY);
  currentY += effectHeight;

  // Interaction hint (light gray, italic, left-aligned)
  ctx.fillStyle = '#AAAAAA';
  ctx.font = 'italic 12px sans-serif';
  ctx.fillText('(E) Kaufen', tooltipX + padding, currentY);

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
