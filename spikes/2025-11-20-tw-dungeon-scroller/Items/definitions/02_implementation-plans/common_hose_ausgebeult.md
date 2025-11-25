# Implementation Plan: Ausgebeulte Stoffhose

## Item-Referenz

- **Beschreibung:** `01_descriptions/common_hose_ausgebeult.md`
- **Finale JSON:** `03_final-items/common_hose_ausgebeult.json`

---

## JSON-Definition

```json
{
  "id": "equipment_hose_ausgebeult",
  "name": "Ausgebeulte Stoffhose",
  "description": "Eine braune Stoffhose, die an den Knien stark ausgebeult ist. Der Bund muss mit einem Strick zusammengehalten werden. Praktisch für weite Schritte, weniger praktisch für den Kampf. Hat überraschend tiefe Taschen.",
  "type": "equipment",
  "rarity": "common",
  "slot": "hose",
  "iconPath": "/Assets/Items/Icons/equipment_hose_ausgebeult.png",
  "spritePath": "/Assets/Items/Sprites/equipment_hose_ausgebeult.png",
  "stackable": false,
  "maxStack": 1,
  "value": 3,
  "effects": [
    {
      "type": "max_hp",
      "value": 5
    }
  ],
  "droppable": true,
  "tradeable": true,
  "questItem": false
}
```

---

## Effekt-Implementierung

### max_hp Effekt

Der `max_hp` Effekt erhöht die maximalen Lebenspunkte des Spielers.

**Integration in `ItemEffectHandler.ts`:**

```typescript
case 'max_hp':
  this.applyMaxHpBoost(effect, context);
  break;

private static applyMaxHpBoost(effect: ItemEffect, context: GameContext): void {
  context.player.maxHp += effect.value;
  context.player.hp = Math.min(context.player.hp + effect.value, context.player.maxHp);
}
```

---

## Asset-Anforderungen

| Asset | Größe | Pfad | Status |
|-------|-------|------|--------|
| Icon | 32x32 px | `/Assets/Items/Icons/equipment_hose_ausgebeult.png` | [ ] Ausstehend |
| Sprite | 16x16 px | `/Assets/Items/Sprites/equipment_hose_ausgebeult.png` | [ ] Ausstehend |

**Icon-Beschreibung:**
- Braune Stoffhose
- Deutlich ausgebeulte Knie
- Strick als Gürtel
- Tiefe Taschen sichtbar
- Common-Rahmen (grau)

---

## Balance-Überlegungen

| Stat | Wert | Begründung |
|------|------|------------|
| +5 Max HP | +5% | Hose = sekundäres Rüstungsteil |
| Verkaufswert | 3 Gold | Niedrig wegen schlechtem Zustand |

**Vergleich mit anderen Hosen:**
- Common: +5 HP (dieser)
- Rare: ~+10 HP oder +5 HP + XP-Boost
- Epic: ~+15 HP + Spezialeffekt

---

## Checkliste

- [ ] JSON-Definition in `03_final-items/` erstellen
- [ ] Icon-Asset erstellen (32x32)
- [ ] Sprite-Asset erstellen (16x16)
- [ ] Equipment-System für Hosen-Slot implementieren
- [ ] In-Game testen
