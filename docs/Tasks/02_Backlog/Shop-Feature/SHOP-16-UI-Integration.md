# SHOP-16: UI-Integration (CharacterPanel & Minimap)

**Feature:** Shop-Räume
**Priorität:** Niedrig
**Geschätzte Dauer:** 1-2 Stunden
**Vorgänger:** SHOP-13
**Nachfolger:** SHOP-17

---

## Ziel

Die UI-Elemente erweitern: Ausgerüstete Items und aktive Perks im CharacterPanel anzeigen, Shop-Räume auf der Minimap farblich markieren.

---

## Teil 1: CharacterPanel erweitern

**Pfad:** `components/CharacterPanel.tsx`

### Bestehende Struktur erweitern

```tsx
import React from 'react';
import { Player } from '../lib/constants';
import { Item } from '../lib/shop/Item';
import { Perk } from '../lib/shop/Perk';
import { RARITY_CONFIG } from '../lib/shop/Rarity';

interface CharacterPanelProps {
  player: Player;
  username: string;
  // ... bestehende Props ...
}

export function CharacterPanel({ player, username }: CharacterPanelProps) {
  return (
    <div className="absolute top-4 left-4 bg-gray-900/90 rounded-lg p-4 min-w-64">
      {/* Bestehende Inhalte: Name, HP, ELO etc. */}
      {/* ... */}

      {/* NEU: Ausgerüstete Items */}
      {player.equippedItems.length > 0 && (
        <div className="mt-4 border-t border-gray-700 pt-3">
          <h3 className="text-sm text-gray-400 mb-2">Ausrüstung</h3>
          <div className="flex gap-2 flex-wrap">
            {player.equippedItems.map((item, index) => (
              <ItemSlot key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* NEU: Aktive Perks */}
      {player.activePerks.length > 0 && (
        <div className="mt-3 border-t border-gray-700 pt-3">
          <h3 className="text-sm text-gray-400 mb-2">Perks</h3>
          <div className="flex gap-2 flex-wrap">
            {player.activePerks.map((perk, index) => (
              <PerkSlot key={perk.id} perk={perk} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Item-Slot Komponente

```tsx
interface ItemSlotProps {
  item: Item;
}

function ItemSlot({ item }: ItemSlotProps) {
  const config = RARITY_CONFIG[item.rarity];
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Item-Icon */}
      <div
        className="w-8 h-8 rounded border-2 flex items-center justify-center
                   bg-gray-800 cursor-pointer transition-transform hover:scale-110"
        style={{ borderColor: config.color }}
      >
        {/* Icon oder Fallback */}
        <span className="text-xs">{item.definition.name.charAt(0)}</span>
      </div>

      {/* Tooltip bei Hover */}
      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                     bg-gray-900 rounded p-2 min-w-32 z-50 border"
          style={{ borderColor: config.color }}
        >
          <p className="text-sm font-bold" style={{ color: config.color }}>
            {item.definition.name}
          </p>
          <p className="text-xs text-gray-400">{config.name}</p>
          <p className="text-xs text-white mt-1">
            {item.definition.description}
          </p>
        </div>
      )}
    </div>
  );
}
```

### Perk-Slot Komponente

```tsx
interface PerkSlotProps {
  perk: Perk;
}

function PerkSlot({ perk }: PerkSlotProps) {
  const config = RARITY_CONFIG[perk.rarity];
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Perk-Icon (rund) */}
      <div
        className="w-6 h-6 rounded-full border-2 flex items-center justify-center
                   bg-gray-800 cursor-pointer transition-transform hover:scale-110"
        style={{ borderColor: config.color }}
      >
        <span className="text-xs">{perk.definition.name.charAt(0)}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                     bg-gray-900 rounded p-2 min-w-32 z-50 border"
          style={{ borderColor: config.color }}
        >
          <p className="text-sm font-bold" style={{ color: config.color }}>
            {perk.definition.name}
          </p>
          <p className="text-xs text-gray-400">{config.name}</p>
          <p className="text-xs text-white mt-1">
            {perk.definition.description}
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## Teil 2: Minimap erweitern

**Pfad:** `lib/rendering/MinimapRenderer.ts`

### Shop-Farbe definieren

```typescript
// Farben für Raumtypen
const ROOM_COLORS = {
  empty: '#666666',     // Grau
  treasure: '#FFD700',  // Gold
  combat: '#FF4444',    // Rot
  shop: '#00CED1'       // Türkis/Cyan (NEU)
};
```

### Rendering anpassen

```typescript
/**
 * Rendert einen Raum auf der Minimap.
 */
function renderRoom(
  ctx: CanvasRenderingContext2D,
  room: Room,
  scale: number,
  offsetX: number,
  offsetY: number
): void {
  if (!room.visible) return;

  // Farbe basierend auf Raumtyp
  const color = ROOM_COLORS[room.type] || ROOM_COLORS.empty;
  ctx.fillStyle = color;

  // Raum zeichnen
  ctx.fillRect(
    room.x * scale + offsetX,
    room.y * scale + offsetY,
    room.width * scale,
    room.height * scale
  );

  // NEU: Spezielles Icon für Shop
  if (room.type === 'shop') {
    renderShopIcon(ctx, room, scale, offsetX, offsetY);
  }
}

/**
 * Rendert ein Shop-Symbol auf der Minimap.
 */
function renderShopIcon(
  ctx: CanvasRenderingContext2D,
  room: Room,
  scale: number,
  offsetX: number,
  offsetY: number
): void {
  const centerX = (room.x + room.width / 2) * scale + offsetX;
  const centerY = (room.y + room.height / 2) * scale + offsetY;

  // Kleines Münz-Symbol oder "S"
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.max(8, scale * 2)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', centerX, centerY);
  ctx.restore();
}
```

### Legende aktualisieren (optional)

```typescript
/**
 * Rendert die Minimap-Legende.
 */
function renderLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): void {
  const items = [
    { color: ROOM_COLORS.empty, label: 'Leer' },
    { color: ROOM_COLORS.treasure, label: 'Schatz' },
    { color: ROOM_COLORS.combat, label: 'Kampf' },
    { color: ROOM_COLORS.shop, label: 'Shop' }  // NEU
  ];

  ctx.save();
  ctx.font = '10px Arial';

  items.forEach((item, index) => {
    const itemY = y + index * 15;

    // Farbbox
    ctx.fillStyle = item.color;
    ctx.fillRect(x, itemY, 10, 10);

    // Label
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(item.label, x + 15, itemY + 8);
  });

  ctx.restore();
}
```

---

## Teil 3: Bonus-Stats Anzeige (optional)

Eine Übersicht aller aktiven Boni anzeigen:

```tsx
function BonusStatsDisplay({ bonusStats }: { bonusStats: BonusStats }) {
  const activeStats = [];

  if (bonusStats.damageFlat > 0) {
    activeStats.push(`+${bonusStats.damageFlat} Schaden`);
  }
  if (bonusStats.damagePercent > 0) {
    activeStats.push(`+${bonusStats.damagePercent}% Schaden`);
  }
  if (bonusStats.damageReduction > 0) {
    activeStats.push(`-${bonusStats.damageReduction}% erl. Schaden`);
  }
  if (bonusStats.blockChance > 0) {
    activeStats.push(`${bonusStats.blockChance}% Block`);
  }
  if (bonusStats.criticalChance > 0) {
    activeStats.push(`${bonusStats.criticalChance}% Krit`);
  }
  if (bonusStats.timeBonus > 0) {
    activeStats.push(`+${bonusStats.timeBonus}s Zeit`);
  }
  if (bonusStats.extraLives > 0) {
    activeStats.push(`${bonusStats.extraLives} Extra Leben`);
  }
  if (bonusStats.regeneration > 0) {
    activeStats.push(`${bonusStats.regeneration} HP/5s`);
  }

  if (activeStats.length === 0) return null;

  return (
    <div className="mt-2 text-xs text-gray-400">
      {activeStats.join(' · ')}
    </div>
  );
}
```

---

## Testfälle

1. **Keine Items/Perks** → Bereiche werden nicht angezeigt
2. **Items gekauft** → Erscheinen im CharacterPanel
3. **Perks gekauft** → Erscheinen im CharacterPanel
4. **Hover über Item** → Tooltip erscheint
5. **Minimap** → Shop-Räume sind türkis mit "$"
6. **Legende** → Zeigt alle Raumtypen

---

## Abnahmekriterien

- [ ] CharacterPanel zeigt ausgerüstete Items
- [ ] CharacterPanel zeigt aktive Perks
- [ ] Hover-Tooltips funktionieren
- [ ] Minimap zeigt Shops in Türkis
- [ ] Shop-Symbol auf Minimap sichtbar
- [ ] UI ist responsiv und überlappt nicht
- [ ] Keine TypeScript-Fehler
