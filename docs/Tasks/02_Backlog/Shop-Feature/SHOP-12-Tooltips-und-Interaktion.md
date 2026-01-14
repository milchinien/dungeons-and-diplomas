# SHOP-12: Tooltips und Interaktions-Erkennung

**Feature:** Shop-Räume
**Priorität:** Mittel
**Geschätzte Dauer:** 1-2 Stunden
**Vorgänger:** SHOP-07, SHOP-10
**Nachfolger:** SHOP-13

---

## Ziel

Ein System erstellen, das erkennt wenn der Spieler nahe einer Ware steht und einen Tooltip mit Details anzeigt. Der Spieler soll sehen können, welches Item/Perk er kaufen würde.

---

## Zu erstellende Dateien

1. `lib/shop/ShopInteraction.ts` - Interaktions-Erkennung
2. `lib/rendering/TooltipRenderer.ts` - Tooltip-Darstellung

---

## Teil 1: Interaktions-Erkennung

**Pfad:** `lib/shop/ShopInteraction.ts`

### Implementation

```typescript
import { Room, TILE_SIZE } from '../constants';
import { ShopInventory } from './ShopInventory';
import { ShopLayout, getShopLayout } from './ShopLayout';
import { Item, getItemEffectDescription } from './Item';
import { Perk, getPerkEffectDescription } from './Perk';

/** Maximale Distanz für Interaktion (in Pixeln) */
const INTERACTION_DISTANCE = TILE_SIZE * 1.5;

export interface InteractionTarget {
  type: 'item' | 'perk';
  index: number;
  item?: Item;
  perk?: Perk;
  worldX: number;
  worldY: number;
}

/**
 * Berechnet die Distanz zwischen zwei Punkten.
 */
function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Findet das nächste Item, das der Spieler erreichen kann.
 */
export function getNearbyItem(
  playerX: number,
  playerY: number,
  inventory: ShopInventory,
  layout: ShopLayout
): { item: Item; index: number; x: number; y: number } | null {
  let closest: { item: Item; index: number; x: number; y: number; dist: number } | null = null;

  for (let i = 0; i < inventory.items.length; i++) {
    const item = inventory.items[i];
    if (item === null) continue;

    const pos = layout.itemPositions[i];
    const dist = distance(playerX, playerY, pos.x, pos.y);

    if (dist <= INTERACTION_DISTANCE) {
      if (!closest || dist < closest.dist) {
        closest = { item, index: i, x: pos.x, y: pos.y, dist };
      }
    }
  }

  return closest ? { item: closest.item, index: closest.index, x: closest.x, y: closest.y } : null;
}

/**
 * Findet den nächsten Perk, den der Spieler erreichen kann.
 */
export function getNearbyPerk(
  playerX: number,
  playerY: number,
  inventory: ShopInventory,
  layout: ShopLayout
): { perk: Perk; index: number; x: number; y: number } | null {
  let closest: { perk: Perk; index: number; x: number; y: number; dist: number } | null = null;

  for (let i = 0; i < inventory.perks.length; i++) {
    const perk = inventory.perks[i];
    if (perk === null) continue;

    const pos = layout.perkPositions[i];
    const dist = distance(playerX, playerY, pos.x, pos.y);

    if (dist <= INTERACTION_DISTANCE) {
      if (!closest || dist < closest.dist) {
        closest = { perk, index: i, x: pos.x, y: pos.y, dist };
      }
    }
  }

  return closest ? { perk: closest.perk, index: closest.index, x: closest.x, y: closest.y } : null;
}

/**
 * Findet das nächste interagierbare Objekt (Item oder Perk).
 */
export function getInteractionTarget(
  playerX: number,
  playerY: number,
  room: Room
): InteractionTarget | null {
  if (room.type !== 'shop' || !room.shopInventory) {
    return null;
  }

  const layout = getShopLayout(room);
  const inventory = room.shopInventory;

  // Prüfe Items
  const nearbyItem = getNearbyItem(playerX, playerY, inventory, layout);
  if (nearbyItem) {
    return {
      type: 'item',
      index: nearbyItem.index,
      item: nearbyItem.item,
      worldX: nearbyItem.x,
      worldY: nearbyItem.y
    };
  }

  // Prüfe Perks
  const nearbyPerk = getNearbyPerk(playerX, playerY, inventory, layout);
  if (nearbyPerk) {
    return {
      type: 'perk',
      index: nearbyPerk.index,
      perk: nearbyPerk.perk,
      worldX: nearbyPerk.x,
      worldY: nearbyPerk.y
    };
  }

  return null;
}
```

---

## Teil 2: Tooltip-Rendering

**Pfad:** `lib/rendering/TooltipRenderer.ts`

### Implementation

```typescript
import { Item, getItemEffectDescription } from '../shop/Item';
import { Perk, getPerkEffectDescription } from '../shop/Perk';
import { Rarity, RARITY_CONFIG } from '../shop/Rarity';

export interface TooltipData {
  title: string;
  description: string;
  effectText: string;
  rarity: Rarity;
}

/**
 * Erstellt Tooltip-Daten für ein Item.
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
 * Erstellt Tooltip-Daten für einen Perk.
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
 * Rendert einen Tooltip an einer Position.
 */
export function renderTooltip(
  ctx: CanvasRenderingContext2D,
  tooltip: TooltipData,
  screenX: number,
  screenY: number
): void {
  ctx.save();

  const padding = 10;
  const lineHeight = 20;
  const width = 180;
  const height = 90;

  // Position anpassen (über dem Item, zentriert)
  const tooltipX = screenX - width / 2;
  const tooltipY = screenY - height - 30;

  // Hintergrund
  ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
  ctx.beginPath();
  ctx.roundRect(tooltipX, tooltipY, width, height, 8);
  ctx.fill();

  // Rahmen in Seltenheits-Farbe
  ctx.strokeStyle = RARITY_CONFIG[tooltip.rarity].color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Titel (in Seltenheits-Farbe)
  ctx.fillStyle = RARITY_CONFIG[tooltip.rarity].color;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(tooltip.title, tooltipX + width / 2, tooltipY + padding + 12);

  // Seltenheits-Label
  ctx.fillStyle = RARITY_CONFIG[tooltip.rarity].color;
  ctx.font = '10px Arial';
  ctx.fillText(
    RARITY_CONFIG[tooltip.rarity].name,
    tooltipX + width / 2,
    tooltipY + padding + 26
  );

  // Beschreibung
  ctx.fillStyle = '#CCCCCC';
  ctx.font = '11px Arial';
  ctx.fillText(tooltip.description, tooltipX + width / 2, tooltipY + padding + 46);

  // Effekt (hervorgehoben)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 13px Arial';
  ctx.fillText(tooltip.effectText, tooltipX + width / 2, tooltipY + padding + 66);

  // Interaktions-Hinweis
  ctx.fillStyle = '#888888';
  ctx.font = '10px Arial';
  ctx.fillText('[E] Kaufen', tooltipX + width / 2, tooltipY + height - 5);

  ctx.restore();
}

/**
 * Rendert den Interaktions-Hinweis ohne volles Tooltip.
 */
export function renderInteractionHint(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  text: string = '[E] Interagieren'
): void {
  ctx.save();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';

  const textWidth = ctx.measureText(text).width;
  ctx.fillRect(screenX - textWidth / 2 - 5, screenY - 20, textWidth + 10, 20);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(text, screenX, screenY - 6);

  ctx.restore();
}
```

---

## Integration in Game-Loop

```typescript
// In der Render-Funktion:
function render(ctx, gameState, time) {
  // ... normales Rendering ...

  // Interaktions-Ziel prüfen
  const target = getInteractionTarget(
    gameState.player.x,
    gameState.player.y,
    gameState.currentRoom
  );

  if (target) {
    const tooltip = target.type === 'item'
      ? createItemTooltip(target.item!)
      : createPerkTooltip(target.perk!);

    renderTooltip(
      ctx,
      tooltip,
      target.worldX - camera.x,
      target.worldY - camera.y
    );
  }
}
```

---

## Testfälle

1. **Spieler weit weg** → Kein Tooltip
2. **Spieler nahe Item** → Item-Tooltip erscheint
3. **Spieler nahe Perk** → Perk-Tooltip erscheint
4. **Gekauftes Item** → Kein Tooltip mehr
5. **Verschiedene Seltenheiten** → Korrekte Farben

---

## Abnahmekriterien

- [ ] `lib/shop/ShopInteraction.ts` existiert
- [ ] `lib/rendering/TooltipRenderer.ts` existiert
- [ ] `getInteractionTarget()` erkennt nahe Waren
- [ ] Tooltips zeigen Name, Beschreibung, Effekt
- [ ] Seltenheits-Farbe wird verwendet
- [ ] "[E] Kaufen" Hinweis wird angezeigt
- [ ] Keine TypeScript-Fehler
