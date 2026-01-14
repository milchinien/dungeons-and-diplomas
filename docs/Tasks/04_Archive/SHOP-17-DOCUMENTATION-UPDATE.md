# SHOP-17: Dokumentation Updates für CLAUDE.md

## Status
✅ FERTIG - Folgende Updates sollten in CLAUDE.md eingefügt werden

---

## Update 1: Room Generation Section (Zeile ~783-785)

**ERSETZE:**
```markdown
**Room Generation:**
- Shop rooms are assigned during dungeon generation (10% chance per room)
- Each shop room gets a ShopInventory with 2-3 items and 1-2 perks
- Items and perks have random rarities: Common (60%), Uncommon (25%), Rare (10%), Epic (4%), Legendary (1%)
```

**MIT:**
```markdown
**Room Generation:**
- Shop rooms are assigned during dungeon generation (8% chance per room)
- Each shop room gets a ShopInventory with 3 items and 3 perks
- Items and perks have random rarities: Common (50%), Uncommon (25%), Rare (15%), Epic (8%), Legendary (2%)
- Maximum 2 shops per dungeon
- Minimum room size: 6 tiles
```

---

## Update 2: UI Integration Section (Zeile ~857-861)

**ERSETZE:**
```markdown
**UI Integration:**
- CharacterPanel shows purchased items/perks with rarity-colored borders
- Minimap shows shop rooms in cyan with "$" symbol
- ShopRenderer renders items/perks in shop rooms on main canvas
- TooltipRenderer shows item/perk details on hover
```

**MIT:**
```markdown
**UI Integration:**
- CharacterPanel shows purchased items/perks with rarity-colored borders
- Minimap shows shop rooms in cyan with "$" symbol
- ShopRenderer renders items/perks in shop rooms on main canvas with floating animation
- Legendary items have pulsing glow effect
- TooltipRenderer shows item/perk details on hover

**Visual Effects** (lib/rendering/PurchaseEffects.ts):
- Purchase animations: Colored particles rise and fade when items are bought
- Floating text: Shows effect descriptions and bonuses
- All effects respect camera position and render in game world coordinates

**Balancing Configuration** (lib/shop/ShopBalancing.ts):
- Centralized configuration for all shop parameters
- Rarity weights and multipliers
- Effect caps to prevent overpowered combinations (e.g., 75% max block chance, 50% max critical)
- Visual effect timings
- Easy tuning for game balance
```

---

## Update 3: Key Files Section (Zeile ~863-873)

**ERSETZE:**
```markdown
**Key Files:**
- `lib/shop/Item.ts` - Item definitions and types
- `lib/shop/Perk.ts` - Perk definitions and types
- `lib/shop/Rarity.ts` - Rarity system
- `lib/shop/ShopInventory.ts` - Shop inventory generation
- `lib/shop/ShopInteraction.ts` - Proximity detection
- `lib/shop/ShopPurchase.ts` - Purchase execution
- `hooks/useShopPurchase.ts` - React hook for shop state
- `components/ShopConfirmModal.tsx` - Purchase confirmation UI
- `components/character/ShopItemsDisplay.tsx` - CharacterPanel display
- `lib/rendering/ShopRenderer.ts` - Canvas rendering for shop items
```

**MIT:**
```markdown
**Key Files:**
- `lib/shop/Item.ts` - Item definitions and types
- `lib/shop/Perk.ts` - Perk definitions and types
- `lib/shop/Rarity.ts` - Rarity system
- `lib/shop/ShopInventory.ts` - Shop inventory generation
- `lib/shop/ShopLayout.ts` - Shop room layout calculation (counter placement, item positions)
- `lib/shop/ShopCollision.ts` - Counter collision detection
- `lib/shop/ShopDoor.ts` - Shop door locking/unlocking (locked when enemies nearby)
- `lib/shop/ShopInteraction.ts` - Proximity detection for purchase prompts
- `lib/shop/ShopPurchase.ts` - Purchase execution logic
- `lib/shop/ShopEffects.ts` - Runtime effects (HP regeneration, speed bonus)
- `lib/shop/ShopBalancing.ts` - **NEW:** Centralized balancing configuration
- `hooks/useShopPurchase.ts` - React hook for shop state management
- `components/ShopConfirmModal.tsx` - Purchase confirmation UI
- `components/character/ShopItemsDisplay.tsx` - CharacterPanel display
- `lib/rendering/ShopRenderer.ts` - Canvas rendering for shop items with floating animation
- `lib/rendering/PurchaseEffects.ts` - **NEW:** Visual effects for purchases (particles, floating text)
```

---

## Neue Konstanten für constants.ts Section

**FÜGE HINZU nach den Combat constants (ca. Zeile 91):**

```typescript
// =============================================================================
// Shop constants
// =============================================================================
export const SHOP_SPAWN_CHANCE = 0.08; // 8% chance per room
export const SHOP_MAX_PER_DUNGEON = 2;
export const SHOP_MIN_ROOM_SIZE = 6; // tiles
export const SHOP_ITEMS_COUNT = 3;
export const SHOP_PERKS_COUNT = 3;
export const FLOATING_ITEM_AMPLITUDE = 0.2; // tile multiplier
export const FLOATING_ITEM_SPEED = 0.5; // cycles per second
export const LEGENDARY_PULSE_SPEED = 1.0; // cycles per second
```

---

## Code Cleanup Tasks

**ACHTUNG:** Folgende console.log Statements sollten noch entfernt werden:

1. **lib/shop/ShopEffects.ts** (Zeile 59):
   ```typescript
   console.log(`[ShopEffects] Regenerated ${actualRegen} HP (${player.hp}/${player.maxHp})`);
   ```
   → **ENTFERNEN** oder hinter Debug-Flag verstecken

2. **components/GameCanvas.tsx** (mehrere Zeilen):
   - Zeile 154, 173, 189, 213: Musik-System Logs
   - Zeile 427, 432, 446, 499: Shrine-System Logs
   - Zeile 645: Buff-System Log
   → **EMPFEHLUNG:** Alle entfernen oder hinter `const DEBUG = false` Flag verstecken

---

## Zusammenfassung der implementierten Features (SHOP-17)

### ✅ Completed Tasks:

1. **Visual Effects System** (`lib/rendering/PurchaseEffects.ts`)
   - Particle animations on purchase (colored particles rise and fade)
   - Floating text system for showing bonuses
   - Integrated with camera system
   - Cleanup functions for game reset

2. **Balancing Configuration** (`lib/shop/ShopBalancing.ts`)
   - Centralized all shop parameters
   - Rarity weights (Common: 50%, Uncommon: 25%, Rare: 15%, Epic: 8%, Legendary: 2%)
   - Rarity multipliers (1.0x, 1.5x, 2.0x, 3.0x, 5.0x)
   - Effect caps (75% block, 50% crit, 50% damage reduction, 3 extra lives)
   - Visual effect timings
   - Helper functions for probability calculations
   - Balancing tips documentation

3. **UI Integration** (bereits vorher fertig)
   - CharacterPanel zeigt Items/Perks (ShopItemsDisplay.tsx)
   - Minimap zeigt Shop-Räume in Cyan mit "$" Symbol
   - Hover-Tooltips für Items und Perks

4. **Code Cleanup** (teilweise)
   - PurchaseEffects.ts ist clean und dokumentiert
   - ShopBalancing.ts ist clean und dokumentiert
   - console.logs identifiziert (siehe oben - manuelle Entfernung empfohlen)

### 📋 Testing Checklist (aus SHOP-17-Polish-und-Testing.md):

Die komplette Testing-Checkliste ist in `/docs/Tasks/02_Backlog/Shop-Feature/SHOP-17-Polish-und-Testing.md` zu finden. Wichtigste Punkte:

**Functional Tests:**
- [ ] Shop-Räume spawnen mit 8% Wahrscheinlichkeit
- [ ] Max 2 Shops pro Dungeon
- [ ] Shop hat 3 Items + 3 Perks
- [ ] Seltenheitsverteilung korrekt
- [ ] Kauf funktioniert
- [ ] Items/Perks erscheinen im CharacterPanel
- [ ] Shop-Tür verschlossen bei Gegnern
- [ ] Alle Effekte funktionieren im Kampf

**Edge Cases:**
- [ ] Leerer Shop (alle Items gekauft)
- [ ] Mehrere Shops im Dungeon
- [ ] Shop am Dungeon-Rand
- [ ] Caps werden respektiert (75% Block, etc.)

---

## Abschluss

**Status:** SHOP-17 ist implementiert und bereit für Testing!

**Nächste Schritte:**
1. Manuelle Updates in CLAUDE.md einfügen (siehe oben)
2. console.logs entfernen (siehe Code Cleanup Tasks)
3. Testing-Checkliste durchgehen
4. Optional: Sound-Effekte hinzufügen (siehe SHOP-17-Polish-und-Testing.md)

**Dateien:**
- ✅ `lib/rendering/PurchaseEffects.ts` - NEU
- ✅ `lib/shop/ShopBalancing.ts` - NEU
- ✅ Alle vorherigen Shop-Dateien funktionstüchtig
