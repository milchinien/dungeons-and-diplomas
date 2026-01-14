# SHOP-17: Integration Patches & Fixes

**Datum:** 2026-01-14
**Status:** 🔧 Manuelle Integration erforderlich

---

## Problem

Die neuen Shop-Features (PurchaseEffects.ts, ShopBalancing.ts) sind erstellt, aber noch nicht vollständig integriert. Ein Auto-Formatter verhindert direkte File-Edits.

---

## PATCH 1: GameRenderer.ts - PurchaseEffects Integration

**Datei:** `lib/rendering/GameRenderer.ts`

### Import hinzufügen (ca. Zeile 16)

**NACH:**
```typescript
import { renderTooltip, createItemTooltip, createPerkTooltip } from './TooltipRenderer';
```

**EINFÜGEN:**
```typescript
import { renderPurchaseAnimations, renderFloatingTexts } from './PurchaseEffects';
```

### Render-Calls hinzufügen (ca. Zeile 343-347)

**ERSETZE:**
```typescript
    ctx.restore();

    // Render shop tooltips in screen space (after ctx.restore)
    this.renderShopTooltip(ctx, { x: camX, y: camY });
  }
}
```

**MIT:**
```typescript
    ctx.restore();

    // Render purchase effects in screen space (after ctx.restore)
    renderPurchaseAnimations(ctx, performance.now(), { x: camX, y: camY });
    renderFloatingTexts(ctx, performance.now(), { x: camX, y: camY });

    // Render shop tooltips in screen space (after ctx.restore)
    this.renderShopTooltip(ctx, { x: camX, y: camY });
  }
}
```

---

## PATCH 2: useShopPurchase.ts - PurchaseEffects Trigger

**Datei:** `hooks/useShopPurchase.ts`

### Import hinzufügen (ca. Zeile 22)

**NACH:**
```typescript
import {
  type PlayerShopData,
  createPlayerShopData,
  executeItemPurchase,
  executePerkPurchase
} from '@/lib/shop/ShopPurchase';
```

**EINFÜGEN:**
```typescript
import { startPurchaseAnimation, showFloatingText } from '@/lib/rendering/PurchaseEffects';
import { RARITY_CONFIG } from '@/lib/shop/Rarity';
```

### Animation bei Item-Kauf auslösen (ca. Zeile 156-164)

**ERSETZE:**
```typescript
    if (purchaseTarget.type === 'item') {
      const result = executeItemPurchase(shopData, inventory, purchaseTarget.index);
      if (result.success) {
        setShopData(result.shopData);
        if (result.hpIncrease > 0) {
          onHpChange(result.hpIncrease);
        }
        console.log('[useShopPurchase] Item purchased:', result.item?.definition.name);
      }
    }
```

**MIT:**
```typescript
    if (purchaseTarget.type === 'item') {
      const result = executeItemPurchase(shopData, inventory, purchaseTarget.index);
      if (result.success && result.item) {
        setShopData(result.shopData);
        if (result.hpIncrease > 0) {
          onHpChange(result.hpIncrease);
        }

        // Trigger purchase animation
        const rarityConfig = RARITY_CONFIG[result.item.rarity];
        startPurchaseAnimation(
          purchaseTarget.worldX,
          purchaseTarget.worldY,
          rarityConfig.color
        );

        // Show floating text
        showFloatingText(
          result.item.definition.name,
          purchaseTarget.worldX,
          purchaseTarget.worldY,
          rarityConfig.color
        );
      }
    }
```

### Animation bei Perk-Kauf auslösen (ca. Zeile 165-174)

**ERSETZE:**
```typescript
    } else {
      const result = executePerkPurchase(shopData, inventory, purchaseTarget.index);
      if (result.success) {
        setShopData(result.shopData);
        if (result.hpIncrease > 0) {
          onHpChange(result.hpIncrease);
        }
        console.log('[useShopPurchase] Perk purchased:', result.perk?.definition.name);
      }
    }
```

**MIT:**
```typescript
    } else {
      const result = executePerkPurchase(shopData, inventory, purchaseTarget.index);
      if (result.success && result.perk) {
        setShopData(result.shopData);
        if (result.hpIncrease > 0) {
          onHpChange(result.hpIncrease);
        }

        // Trigger purchase animation
        const rarityConfig = RARITY_CONFIG[result.perk.rarity];
        startPurchaseAnimation(
          purchaseTarget.worldX,
          purchaseTarget.worldY,
          rarityConfig.color
        );

        // Show floating text
        showFloatingText(
          result.perk.definition.name,
          purchaseTarget.worldX,
          purchaseTarget.worldY,
          rarityConfig.color
        );
      }
    }
```

---

## PATCH 3: ShopInteraction.ts - World Coordinates

**Datei:** `lib/shop/ShopInteraction.ts`

**PROBLEM:** InteractionTarget hat nur Index und Type, aber keine World-Koordinaten für die Animation.

### Type erweitern (ca. Zeile 10-14)

**ERSETZE:**
```typescript
export interface InteractionTarget {
  type: 'item' | 'perk';
  index: number;
}
```

**MIT:**
```typescript
export interface InteractionTarget {
  type: 'item' | 'perk';
  index: number;
  worldX: number;  // World position for effects
  worldY: number;  // World position for effects
}
```

### getInteractionTarget updaten (ca. Zeile 25-55)

**SUCHE die Funktion `getInteractionTarget` und UPDATE die return statements:**

**ALT:**
```typescript
return { type: 'item', index: i };
```

**NEU:**
```typescript
return { type: 'item', index: i, worldX: pos.x, worldY: pos.y };
```

**ALT:**
```typescript
return { type: 'perk', index: i };
```

**NEU:**
```typescript
return { type: 'perk', index: i, worldX: pos.x, worldY: pos.y };
```

---

## PATCH 4: console.logs entfernen

### lib/shop/ShopEffects.ts (Zeile 59)

**ENTFERNE:**
```typescript
    if (actualRegen > 0) {
      console.log(`[ShopEffects] Regenerated ${actualRegen} HP (${player.hp}/${player.maxHp})`);
    }
```

### hooks/useShopPurchase.ts (Zeilen 163, 172)

**ENTFERNE beide console.log Statements:**
```typescript
console.log('[useShopPurchase] Item purchased:', result.item?.definition.name);
console.log('[useShopPurchase] Perk purchased:', result.perk?.definition.name);
```

**HINWEIS:** Diese werden durch die neuen floating texts ersetzt!

---

## PATCH 5: shop/index.ts - ShopBalancing Export

**Datei:** `lib/shop/index.ts`

**NACH der letzten Zeile einfügen:**
```typescript

// Shop balancing configuration
export {
  SHOP_SPAWN_CONFIG,
  SHOP_INVENTORY_CONFIG,
  RARITY_WEIGHTS,
  RARITY_MULTIPLIERS,
  EFFECT_CAPS,
  VISUAL_EFFECTS_CONFIG,
  SHOP_DOOR_CONFIG,
  COMBAT_EFFECT_CONFIG,
  applyEffectCap,
  getTotalRarityWeight,
  getRarityProbability
} from './ShopBalancing';
```

---

## Validierung nach Patches

Nach Anwendung aller Patches, folgende Checks durchführen:

### 1. TypeScript Compilation
```bash
npm run build
```
**Erwarte:** Keine TypeScript-Fehler

### 2. Visual Test
1. Spiel starten
2. Shop-Raum betreten
3. Item/Perk kaufen
4. **Erwarte:**
   - Farbige Partikel steigen auf
   - Item/Perk Name erscheint als floating text
   - Keine console errors

### 3. Integration Test
```typescript
// In Browser Console nach Kauf:
// Sollte keine console.logs mehr zeigen außer kritische Errors
```

---

## Reihenfolge der Patches

**WICHTIG:** Patches in dieser Reihenfolge anwenden:

1. ✅ **PATCH 3** (ShopInteraction.ts) - Adds worldX/worldY to InteractionTarget
2. ✅ **PATCH 2** (useShopPurchase.ts) - Uses worldX/worldY from InteractionTarget
3. ✅ **PATCH 1** (GameRenderer.ts) - Renders the effects
4. ✅ **PATCH 4** (console.logs) - Cleanup
5. ✅ **PATCH 5** (shop/index.ts) - Export balancing config

---

## Alternative: Auto-Apply Script

Falls gewünscht, kann ein Shell-Script erstellt werden:

```bash
#!/bin/bash
# apply-shop-patches.sh

echo "Applying SHOP-17 Integration Patches..."

# Patch 3: ShopInteraction.ts
# ... (sed commands)

# Patch 2: useShopPurchase.ts
# ... (sed commands)

# Patch 1: GameRenderer.ts
# ... (sed commands)

echo "Patches applied! Run 'npm run build' to verify."
```

---

## Status

- ✅ PurchaseEffects.ts erstellt
- ✅ ShopBalancing.ts erstellt
- ⚠️ **Integration Patches noch anzuwenden** (siehe oben)
- ⚠️ **Testing nach Patches erforderlich**

---

## Hilfe

Bei Problemen:
1. Stelle sicher, dass alle Imports korrekt sind
2. Prüfe TypeScript Errors: `npm run build`
3. Prüfe Browser Console auf Runtime Errors
4. Vergleiche mit diesem Dokument

**Geschätzte Zeit für Patches:** 15-20 Minuten
