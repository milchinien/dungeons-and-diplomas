# Implementation Plan: Geflickte Ledertunika

## Item-Referenz

- **Beschreibung:** `01_descriptions/common_brustplatte_geflickt.md`
- **Finale JSON:** `03_final-items/common_brustplatte_geflickt.json`

---

## JSON-Definition

```json
{
  "id": "equipment_brustplatte_geflickt",
  "name": "Geflickte Ledertunika",
  "description": "Eine abgetragene Ledertunika mit diversen Flicken. Jeder Flicken erzählt eine Geschichte - meistens davon, wie der Vorbesitzer getroffen wurde. Die Nähte halten noch, wenn man nicht zu wild kämpft.",
  "type": "equipment",
  "rarity": "common",
  "slot": "brustplatte",
  "iconPath": "/Assets/Items/Icons/equipment_brustplatte_geflickt.png",
  "spritePath": "/Assets/Items/Sprites/equipment_brustplatte_geflickt.png",
  "stackable": false,
  "maxStack": 1,
  "value": 8,
  "effects": [
    {
      "type": "max_hp",
      "value": 10
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
| Icon | 32x32 px | `/Assets/Items/Icons/equipment_brustplatte_geflickt.png` | [ ] Ausstehend |
| Sprite | 16x16 px | `/Assets/Items/Sprites/equipment_brustplatte_geflickt.png` | [ ] Ausstehend |

**Icon-Beschreibung:**
- Braune Ledertunika
- Sichtbare Flicken in verschiedenen Brauntönen
- Grobe Nähte
- Common-Rahmen (grau)

---

## Balance-Überlegungen

| Stat | Wert | Begründung |
|------|------|------------|
| +10 Max HP | +10% | Brustplatte = Hauptrüstungsteil, gibt mehr HP |
| Verkaufswert | 8 Gold | Etwas höher wegen Slot-Wichtigkeit |

**Vergleich mit anderen Brustplatten:**
- Common: +10 HP (dieser)
- Rare: ~+20 HP
- Epic: ~+35 HP + Spezialeffekt

---

## Checkliste

- [ ] JSON-Definition in `03_final-items/` erstellen
- [ ] Icon-Asset erstellen (32x32)
- [ ] Sprite-Asset erstellen (16x16)
- [ ] Equipment-System für Brustplatten-Slot implementieren
- [ ] In-Game testen
