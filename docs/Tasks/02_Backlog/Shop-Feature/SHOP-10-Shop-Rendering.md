# SHOP-10: Shop-Raum rendern

**Feature:** Shop-Räume
**Priorität:** Mittel
**Geschätzte Dauer:** 2-3 Stunden
**Vorgänger:** SHOP-07 (Layout), SHOP-11 (Assets)
**Nachfolger:** SHOP-12

---

## Ziel

Den Shop-Raum visuell darstellen: Schild, Tresen und die schwebenden Waren mit Seltenheits-Auren. Die Waren bewegen sich mit einer sanften Auf-/Ab-Animation.

---

## Zu erstellende Datei

**Pfad:** `lib/rendering/ShopRenderer.ts`

---

## Implementierung

### 1. Imports

```typescript
import { Room, TILE_SIZE } from '../constants';
import { getShopLayout, ShopLayout, calculateFloatingY } from '../shop/ShopLayout';
import { ShopInventory } from '../shop/ShopInventory';
import { Item, getItemEffectDescription } from '../shop/Item';
import { Perk, getPerkEffectDescription } from '../shop/Perk';
import { Rarity, getRarityColor, getRarityGlow, RARITY_CONFIG } from '../shop/Rarity';
import {
  FLOATING_ITEM_AMPLITUDE,
  FLOATING_ITEM_SPEED,
  LEGENDARY_PULSE_SPEED
} from '../constants';
```

### 2. Shop-Schild rendern

```typescript
/**
 * Rendert das Shop-Schild.
 */
export function renderShopSign(
  ctx: CanvasRenderingContext2D,
  layout: ShopLayout,
  camera: { x: number; y: number },
  signImage?: HTMLImageElement  // Optional: Schild-Sprite
): void {
  const screenX = layout.signPosition.x * TILE_SIZE - camera.x;
  const screenY = layout.signPosition.y * TILE_SIZE - camera.y;

  if (signImage) {
    // Sprite verwenden
    ctx.drawImage(signImage, screenX - TILE_SIZE, screenY, TILE_SIZE * 2, TILE_SIZE);
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
```

### 3. Tresen rendern

```typescript
/**
 * Rendert die Shop-Tresen.
 */
export function renderCounters(
  ctx: CanvasRenderingContext2D,
  layout: ShopLayout,
  camera: { x: number; y: number },
  counterImage?: HTMLImageElement  // Optional: Tresen-Sprite
): void {
  const allCounterTiles = [...layout.leftCounterTiles, ...layout.rightCounterTiles];

  for (const tile of allCounterTiles) {
    const screenX = tile.x * TILE_SIZE - camera.x;
    const screenY = tile.y * TILE_SIZE - camera.y;

    if (counterImage) {
      ctx.drawImage(counterImage, screenX, screenY, TILE_SIZE, TILE_SIZE);
    } else {
      // Fallback: Einfacher Tresen
      ctx.save();

      // Tresen-Oberfläche
      ctx.fillStyle = '#654321';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Kante
      ctx.fillStyle = '#4A3219';
      ctx.fillRect(screenX, screenY + TILE_SIZE - 10, TILE_SIZE, 10);

      ctx.restore();
    }
  }
}
```

### 4. Seltenheits-Aura rendern

```typescript
/**
 * Rendert den Glow-Effekt für eine Seltenheit.
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
  gradient.addColorStop(0, `${config.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
  gradient.addColorStop(1, `${config.color}00`);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
```

### 5. Schwebende Items rendern

```typescript
/**
 * Rendert die schwebenden Items über dem linken Tresen.
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
      FLOATING_ITEM_AMPLITUDE * TILE_SIZE,
      FLOATING_ITEM_SPEED
    );

    const screenX = basePos.x - camera.x;
    const screenY = floatingY - camera.y;

    // Glow zuerst (dahinter)
    renderRarityGlow(ctx, screenX, screenY, item.rarity, time);

    // Item-Sprite
    const sprite = itemSprites?.get(item.definition.spriteKey);
    if (sprite) {
      ctx.drawImage(sprite, screenX - 16, screenY - 16, 32, 32);
    } else {
      // Fallback: Farbiges Quadrat
      ctx.save();
      ctx.fillStyle = getRarityColor(item.rarity);
      ctx.fillRect(screenX - 12, screenY - 12, 24, 24);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(screenX - 12, screenY - 12, 24, 24);
      ctx.restore();
    }
  }
}
```

### 6. Schwebende Perks rendern

```typescript
/**
 * Rendert die schwebenden Perks über dem rechten Tresen.
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
      FLOATING_ITEM_AMPLITUDE * TILE_SIZE,
      FLOATING_ITEM_SPEED
    );

    const screenX = basePos.x - camera.x;
    const screenY = floatingY - camera.y;

    // Glow zuerst
    renderRarityGlow(ctx, screenX, screenY, perk.rarity, time);

    // Perk-Icon
    const icon = perkIcons?.get(perk.definition.iconKey);
    if (icon) {
      ctx.drawImage(icon, screenX - 16, screenY - 16, 32, 32);
    } else {
      // Fallback: Farbiger Kreis
      ctx.save();
      ctx.fillStyle = getRarityColor(perk.rarity);
      ctx.beginPath();
      ctx.arc(screenX, screenY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.stroke();
      ctx.restore();
    }
  }
}
```

### 7. Kompletter Shop rendern

```typescript
/**
 * Rendert den kompletten Shop-Raum.
 */
export function renderShopRoom(
  ctx: CanvasRenderingContext2D,
  room: Room,
  time: number,
  camera: { x: number; y: number },
  assets?: {
    signImage?: HTMLImageElement;
    counterImage?: HTMLImageElement;
    itemSprites?: Map<string, HTMLImageElement>;
    perkIcons?: Map<string, HTMLImageElement>;
  }
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
```

---

## Integration in GameRenderer

In `lib/rendering/GameRenderer.ts`:

```typescript
import { renderShopRoom } from './ShopRenderer';

// In der Haupt-Render-Funktion:
function render(ctx, gameState, time) {
  // ... normale Tile-Rendering ...

  // Shop-Räume rendern
  for (const room of gameState.rooms) {
    if (room.type === 'shop' && room.visible) {
      renderShopRoom(ctx, room, time, camera, shopAssets);
    }
  }

  // ... Spieler, Gegner, etc. ...
}
```

---

## Abnahmekriterien

- [ ] Datei `lib/rendering/ShopRenderer.ts` existiert
- [ ] Shop-Schild wird gerendert
- [ ] Beide Tresen werden gerendert
- [ ] Items schweben mit Animation
- [ ] Perks schweben mit Animation
- [ ] Seltenheits-Auren werden angezeigt
- [ ] Legendary-Items pulsieren
- [ ] Gekaufte Items/Perks verschwinden
- [ ] Fallback-Rendering ohne Sprites funktioniert
- [ ] Keine TypeScript-Fehler
