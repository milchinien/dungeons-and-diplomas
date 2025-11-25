# Implementation Plan: Verbeulter Topfhelm

## Item-Referenz

- **Beschreibung:** `01_descriptions/common_helm_topf.md`
- **Finale JSON:** `03_final-items/common_helm_topf.json`

---

## JSON-Definition

```json
{
  "id": "equipment_helm_topf",
  "name": "Verbeulter Topfhelm",
  "description": "Ein alter Kochtopf, der notdürftig als Helm umfunktioniert wurde. Die Henkel wurden abgesägt, aber man sieht noch die Stellen. Riecht leicht nach Eintopf.",
  "type": "equipment",
  "rarity": "common",
  "slot": "helm",
  "iconPath": "/Assets/Items/Icons/equipment_helm_topf.png",
  "spritePath": "/Assets/Items/Sprites/equipment_helm_topf.png",
  "stackable": false,
  "maxStack": 1,
  "value": 5,
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
  // Optional: Auch aktuelle HP um den Wert erhöhen
  context.player.hp = Math.min(context.player.hp + effect.value, context.player.maxHp);
}
```

**Bei Ablegen des Items:**

```typescript
private static removeMaxHpBoost(effect: ItemEffect, context: GameContext): void {
  context.player.maxHp -= effect.value;
  // HP auf neues Maximum begrenzen
  context.player.hp = Math.min(context.player.hp, context.player.maxHp);
}
```

---

## Asset-Anforderungen

| Asset | Größe | Pfad | Status |
|-------|-------|------|--------|
| Icon | 32x32 px | `/Assets/Items/Icons/equipment_helm_topf.png` | [ ] Ausstehend |
| Sprite | 16x16 px | `/Assets/Items/Sprites/equipment_helm_topf.png` | [ ] Ausstehend |

**Icon-Beschreibung:**
- Grauer/brauner Kochtopf
- Sichtbare abgesägte Henkel-Stellen
- Beulen und Kratzer
- Common-Rahmen (grau)

---

## Balance-Überlegungen

| Stat | Wert | Begründung |
|------|------|------------|
| +5 Max HP | +5% | Basis-HP ist 100, also 5% Erhöhung |
| Verkaufswert | 5 Gold | Niedriger Wert für Common |

**Vergleich mit anderen Helmen:**
- Common: +5 HP (dieser)
- Rare: ~+10 HP
- Epic: ~+20 HP + Spezialeffekt

---

## Checkliste

- [ ] JSON-Definition in `03_final-items/` erstellen
- [ ] Icon-Asset erstellen (32x32)
- [ ] Sprite-Asset erstellen (16x16)
- [ ] max_hp Effekt in ItemEffectHandler implementieren
- [ ] Equipment-System für Helm-Slot implementieren
- [ ] In-Game testen
