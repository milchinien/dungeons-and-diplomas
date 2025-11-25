# Implementation Plan: Holzbrett mit Griff

## Item-Referenz

- **Beschreibung:** `01_descriptions/common_schild_brett.md`
- **Finale JSON:** `03_final-items/common_schild_brett.json`

---

## JSON-Definition

```json
{
  "id": "equipment_schild_brett",
  "name": "Holzbrett mit Griff",
  "description": "Ein Stück Holz aus einer alten Scheunentür, an das jemand einen Lederriemen genagelt hat. Es gibt ein paar Risse im Holz und das Wappen darauf ist längst abgeblättert. Aber es hält Schläge ab - zumindest ein paar.",
  "type": "equipment",
  "rarity": "common",
  "slot": "schild",
  "iconPath": "/Assets/Items/Icons/equipment_schild_brett.png",
  "spritePath": "/Assets/Items/Sprites/equipment_schild_brett.png",
  "stackable": false,
  "maxStack": 1,
  "value": 4,
  "effects": [
    {
      "type": "damage_reduction",
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

### damage_reduction Effekt

Der `damage_reduction` Effekt reduziert den erhaltenen Schaden bei falschen Antworten.

**Basis-Schaden vom Gegner:** 15 (DAMAGE_WRONG in constants.ts)
**Mit Item:** 14

**Integration in `DamageCalculator.ts` oder `CombatEngine.ts`:**

```typescript
function calculateEnemyDamage(playerElo: number, enemyLevel: number, equipment: PlayerEquipment): number {
  let baseDamage = DAMAGE_WRONG; // 15

  // Equipment-Reduktion abziehen
  const damageReduction = getEquipmentStat(equipment, 'damage_reduction');
  baseDamage = Math.max(1, baseDamage - damageReduction); // Minimum 1 Schaden

  // ELO-basierte Berechnung...
  return Math.round(baseDamage);
}
```

---

## Asset-Anforderungen

| Asset | Größe | Pfad | Status |
|-------|-------|------|--------|
| Icon | 32x32 px | `/Assets/Items/Icons/equipment_schild_brett.png` | [ ] Ausstehend |
| Sprite | 16x16 px | `/Assets/Items/Sprites/equipment_schild_brett.png` | [ ] Ausstehend |

**Icon-Beschreibung:**
- Rechteckiges Holzbrett
- Sichtbare Risse und Astlöcher
- Lederriemen als Griff
- Abgeblättertes/verblasstes Wappen
- Common-Rahmen (grau)

---

## Balance-Überlegungen

| Stat | Wert | Begründung |
|------|------|------------|
| -1 Schaden erhalten | ~7% Reduktion | Basis-Schaden ist 15, also ~7% weniger |
| Verkaufswert | 4 Gold | Niedrig wegen improvisiertem Material |

**Vergleich mit anderen Schilden:**
- Common: -1 Schaden (dieser)
- Rare: ~-2-3 Schaden
- Epic: ~-5 Schaden + Spezialeffekt

---

## Checkliste

- [ ] JSON-Definition in `03_final-items/` erstellen
- [ ] Icon-Asset erstellen (32x32)
- [ ] Sprite-Asset erstellen (16x16)
- [ ] damage_reduction in DamageCalculator integrieren
- [ ] Equipment-System für Schild-Slot implementieren
- [ ] In-Game testen
