# SHOP-13: Kauf-System implementieren

**Feature:** Shop-Räume
**Priorität:** Hoch
**Geschätzte Dauer:** 2 Stunden
**Vorgänger:** SHOP-12 (Interaktion), SHOP-05 (Player-Interface)
**Nachfolger:** SHOP-14, SHOP-15

---

## Ziel

Das komplette Kauf-System implementieren: Tastendruck erkennen, Bestätigungsdialog anzeigen, Item/Perk auf Spieler anwenden und aus Shop entfernen.

---

## Zu erstellende Dateien

1. `lib/shop/ShopPurchase.ts` - Kauf-Logik
2. `components/ShopConfirmModal.tsx` - Bestätigungs-UI

---

## Teil 1: Kauf-Logik

**Pfad:** `lib/shop/ShopPurchase.ts`

### Implementation

```typescript
import { Player, BonusStats, DEFAULT_BONUS_STATS } from '../constants';
import { Item, ItemEffectType } from './Item';
import { Perk, PerkType } from './Perk';
import { ShopInventory, purchaseItem, purchasePerk } from './ShopInventory';

/**
 * Berechnet alle Bonus-Stats aus Items und Perks.
 */
export function calculateBonusStats(
  items: Item[],
  perks: Perk[]
): BonusStats {
  const stats: BonusStats = { ...DEFAULT_BONUS_STATS };

  // Items verarbeiten
  for (const item of items) {
    switch (item.definition.effectType) {
      case ItemEffectType.DAMAGE_FLAT:
        stats.damageFlat += item.effectValue;
        break;
      case ItemEffectType.DAMAGE_REDUCTION:
        stats.damageReduction += item.effectValue;
        break;
      case ItemEffectType.HP_FLAT:
        stats.maxHpBonus += item.effectValue;
        break;
      case ItemEffectType.BLOCK_CHANCE:
        stats.blockChance += item.effectValue;
        break;
      case ItemEffectType.SPEED:
        stats.speedMultiplier += item.effectValue / 100;
        break;
      case ItemEffectType.ALL_STATS:
        // Erhöht alles um X%
        stats.damagePercent += item.effectValue;
        stats.maxHpBonus += item.effectValue;
        break;
    }
  }

  // Perks verarbeiten
  for (const perk of perks) {
    switch (perk.definition.type) {
      case PerkType.HP_FLAT:
        stats.maxHpBonus += perk.effectValue;
        break;
      case PerkType.HP_PERCENT:
        // Prozentual wird später angewendet
        stats.maxHpBonus += perk.effectValue; // Vereinfacht
        break;
      case PerkType.DAMAGE_FLAT:
        stats.damageFlat += perk.effectValue;
        break;
      case PerkType.DAMAGE_PERCENT:
        stats.damagePercent += perk.effectValue;
        break;
      case PerkType.REGENERATION:
        stats.regeneration += perk.effectValue;
        break;
      case PerkType.CRITICAL:
        stats.criticalChance += perk.effectValue;
        break;
      case PerkType.TIME_BONUS:
        stats.timeBonus += perk.effectValue;
        break;
      case PerkType.EXTRA_LIFE:
        stats.extraLives += perk.effectValue;
        break;
      case PerkType.ELO_BOOST:
        stats.eloBonus += perk.effectValue;
        break;
    }
  }

  // Caps anwenden
  stats.blockChance = Math.min(stats.blockChance, 75);  // Max 75%
  stats.criticalChance = Math.min(stats.criticalChance, 50);  // Max 50%
  stats.damageReduction = Math.min(stats.damageReduction, 50);  // Max 50%

  return stats;
}

/**
 * Wendet ein Item auf den Spieler an.
 */
export function applyItemToPlayer(player: Player, item: Item): Player {
  const newItems = [...player.equippedItems, item];
  const newStats = calculateBonusStats(newItems, player.activePerks);

  // HP-Bonus sofort anwenden
  const hpIncrease = newStats.maxHpBonus - player.bonusStats.maxHpBonus;

  return {
    ...player,
    equippedItems: newItems,
    bonusStats: newStats,
    maxHp: player.maxHp + hpIncrease,
    hp: player.hp + hpIncrease  // Bonus-HP sofort erhalten
  };
}

/**
 * Wendet einen Perk auf den Spieler an.
 */
export function applyPerkToPlayer(player: Player, perk: Perk): Player {
  const newPerks = [...player.activePerks, perk];
  const newStats = calculateBonusStats(player.equippedItems, newPerks);

  // HP-Bonus sofort anwenden
  const hpIncrease = newStats.maxHpBonus - player.bonusStats.maxHpBonus;

  return {
    ...player,
    activePerks: newPerks,
    bonusStats: newStats,
    maxHp: player.maxHp + hpIncrease,
    hp: player.hp + hpIncrease
  };
}

/**
 * Führt einen Item-Kauf durch.
 * @returns Neuer Player und ob Kauf erfolgreich war
 */
export function executeItemPurchase(
  player: Player,
  inventory: ShopInventory,
  itemIndex: number
): { player: Player; success: boolean } {
  const item = purchaseItem(inventory, itemIndex);

  if (!item) {
    return { player, success: false };
  }

  const newPlayer = applyItemToPlayer(player, item);
  return { player: newPlayer, success: true };
}

/**
 * Führt einen Perk-Kauf durch.
 */
export function executePerkPurchase(
  player: Player,
  inventory: ShopInventory,
  perkIndex: number
): { player: Player; success: boolean } {
  const perk = purchasePerk(inventory, perkIndex);

  if (!perk) {
    return { player, success: false };
  }

  const newPlayer = applyPerkToPlayer(player, perk);
  return { player: newPlayer, success: true };
}
```

---

## Teil 2: Bestätigungs-Modal

**Pfad:** `components/ShopConfirmModal.tsx`

### Implementation

```tsx
import React from 'react';
import { Item, getItemEffectDescription } from '../lib/shop/Item';
import { Perk, getPerkEffectDescription } from '../lib/shop/Perk';
import { RARITY_CONFIG } from '../lib/shop/Rarity';

interface ShopConfirmModalProps {
  item?: Item;
  perk?: Perk;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ShopConfirmModal({
  item,
  perk,
  onConfirm,
  onCancel
}: ShopConfirmModalProps) {
  const target = item || perk;
  if (!target) return null;

  const isItem = !!item;
  const name = isItem ? item!.definition.name : perk!.definition.name;
  const description = isItem ? item!.definition.description : perk!.definition.description;
  const effectText = isItem ? getItemEffectDescription(item!) : getPerkEffectDescription(perk!);
  const rarity = target.rarity;
  const config = RARITY_CONFIG[rarity];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div
        className="bg-gray-900 rounded-lg p-6 max-w-sm w-full mx-4"
        style={{ borderColor: config.color, borderWidth: '2px' }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <h2
            className="text-xl font-bold"
            style={{ color: config.color }}
          >
            {name}
          </h2>
          <p
            className="text-sm"
            style={{ color: config.color }}
          >
            {config.name}
          </p>
        </div>

        {/* Beschreibung */}
        <p className="text-gray-300 text-center mb-4">
          {description}
        </p>

        {/* Effekt */}
        <div
          className="text-center text-lg font-bold mb-6 py-2 rounded"
          style={{
            backgroundColor: `${config.color}20`,
            color: config.color
          }}
        >
          {effectText}
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600
                       text-white rounded transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 rounded transition-colors font-bold"
            style={{
              backgroundColor: config.color,
              color: '#000'
            }}
          >
            Erwerben
          </button>
        </div>

        {/* Tastatur-Hinweis */}
        <p className="text-gray-500 text-xs text-center mt-4">
          [Enter] Bestätigen · [Esc] Abbrechen
        </p>
      </div>
    </div>
  );
}
```

---

## Teil 3: Integration in Game-State

In `hooks/useGameState.ts` oder entsprechender Datei:

```typescript
import { executeItemPurchase, executePerkPurchase } from '../lib/shop/ShopPurchase';
import { getInteractionTarget, InteractionTarget } from '../lib/shop/ShopInteraction';

// State erweitern
const [purchaseTarget, setPurchaseTarget] = useState<InteractionTarget | null>(null);
const [showPurchaseModal, setShowPurchaseModal] = useState(false);

// Tastatur-Handler
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    // "E" für Interaktion
    if (e.key === 'e' || e.key === 'E') {
      if (!showPurchaseModal) {
        const target = getInteractionTarget(player.x, player.y, currentRoom);
        if (target) {
          setPurchaseTarget(target);
          setShowPurchaseModal(true);
        }
      }
    }

    // Enter für Bestätigung
    if (e.key === 'Enter' && showPurchaseModal && purchaseTarget) {
      handlePurchaseConfirm();
    }

    // Escape für Abbruch
    if (e.key === 'Escape' && showPurchaseModal) {
      setShowPurchaseModal(false);
      setPurchaseTarget(null);
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [player, currentRoom, showPurchaseModal, purchaseTarget]);

// Kauf-Bestätigung
function handlePurchaseConfirm() {
  if (!purchaseTarget || !currentRoom.shopInventory) return;

  let result;
  if (purchaseTarget.type === 'item') {
    result = executeItemPurchase(player, currentRoom.shopInventory, purchaseTarget.index);
  } else {
    result = executePerkPurchase(player, currentRoom.shopInventory, purchaseTarget.index);
  }

  if (result.success) {
    setPlayer(result.player);
    // Optional: Sound abspielen, Animation zeigen
  }

  setShowPurchaseModal(false);
  setPurchaseTarget(null);
}
```

---

## Testfälle

1. **E drücken nahe Item** → Modal öffnet sich
2. **Enter im Modal** → Kauf wird ausgeführt
3. **Escape im Modal** → Modal schließt sich
4. **Nach Kauf** → Item verschwunden, Spieler hat Bonus
5. **Nochmal kaufen** → Nicht möglich (null)

---

## Abnahmekriterien

- [ ] `lib/shop/ShopPurchase.ts` existiert
- [ ] `components/ShopConfirmModal.tsx` existiert
- [ ] `calculateBonusStats()` berechnet alle Boni korrekt
- [ ] `applyItemToPlayer()` und `applyPerkToPlayer()` funktionieren
- [ ] Modal zeigt korrekte Informationen
- [ ] Tastatur-Steuerung funktioniert (E, Enter, Escape)
- [ ] Gekaufte Items verschwinden aus Shop
- [ ] Spieler erhält Boni sofort
- [ ] HP-Boni erhöhen auch aktuelle HP
- [ ] Keine TypeScript-Fehler
