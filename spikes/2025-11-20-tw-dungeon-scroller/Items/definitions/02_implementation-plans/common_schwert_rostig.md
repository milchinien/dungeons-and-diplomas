# Implementation Plan: Rostiges Kurzschwert

## Item-Referenz

- **Beschreibung:** `01_descriptions/common_schwert_rostig.md`
- **Finale JSON:** `03_final-items/common_schwert_rostig.json`

---

## JSON-Definition

```json
{
  "id": "equipment_schwert_rostig",
  "name": "Rostiges Kurzschwert",
  "description": "Ein Kurzschwert, das bessere Tage gesehen hat. Der Rost hat sich bereits in die Klinge gefressen und der Griff ist mit altem Stoff umwickelt. Schneidet noch, irgendwie.",
  "type": "equipment",
  "rarity": "common",
  "slot": "schwert",
  "iconPath": "/Assets/Items/Icons/equipment_schwert_rostig.png",
  "spritePath": "/Assets/Items/Sprites/equipment_schwert_rostig.png",
  "stackable": false,
  "maxStack": 1,
  "value": 6,
  "effects": [
    {
      "type": "damage_boost",
      "value": 1
    }
  ],
  "droppable": true,
  "tradeable": true,
  "questItem": false
}
```

---

## Effekt-Implementierung

### damage_boost Effekt

Der `damage_boost` Effekt erhöht den Schaden bei richtigen Antworten.

**Basis-Schaden:** 10 (DAMAGE_CORRECT in constants.ts)
**Mit Item:** 11

**Integration in `DamageCalculator.ts` oder `CombatEngine.ts`:**

```typescript
function calculatePlayerDamage(playerElo: number, enemyLevel: number, equipment: PlayerEquipment): number {
  let baseDamage = DAMAGE_CORRECT; // 10

  // Equipment-Bonus addieren
  const damageBoost = getEquipmentStat(equipment, 'damage_boost');
  baseDamage += damageBoost;

  // ELO-basierte Berechnung...
  return Math.round(baseDamage + (playerElo - enemyLevel) * 2);
}

function getEquipmentStat(equipment: PlayerEquipment, statType: string): number {
  let total = 0;
  Object.values(equipment).forEach(item => {
    if (item) {
      const def = ItemRegistry.getInstance().getItem(item.definitionId);
      def?.effects?.forEach(effect => {
        if (effect.type === statType) {
          total += effect.value;
        }
      });
    }
  });
  return total;
}
```

---

## Asset-Anforderungen

| Asset | Größe | Pfad | Status |
|-------|-------|------|--------|
| Icon | 32x32 px | `/Assets/Items/Icons/equipment_schwert_rostig.png` | [ ] Ausstehend |
| Sprite | 16x16 px | `/Assets/Items/Sprites/equipment_schwert_rostig.png` | [ ] Ausstehend |

**Icon-Beschreibung:**
- Kurzes Schwert mit rostiger Klinge
- Orange/braune Rostflecken
- Stoffumwickelter Griff
- Common-Rahmen (grau)

---

## Balance-Überlegungen

| Stat | Wert | Begründung |
|------|------|------------|
| +1 Schaden | +10% | Basis-Schaden ist 10, also 10% Erhöhung |
| Verkaufswert | 6 Gold | Standard für Common-Waffe |

**Vergleich mit anderen Schwertern:**
- Common: +1 Schaden (dieser)
- Rare: ~+2-3 Schaden
- Epic: ~+5 Schaden + Spezialeffekt

---

## Checkliste

- [ ] JSON-Definition in `03_final-items/` erstellen
- [ ] Icon-Asset erstellen (32x32)
- [ ] Sprite-Asset erstellen (16x16)
- [ ] damage_boost in DamageCalculator integrieren
- [ ] Equipment-System für Schwert-Slot implementieren
- [ ] In-Game testen
