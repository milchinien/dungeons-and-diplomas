# Implementation Plan: Abgelaufene Lederstiefel

## Item-Referenz

- **Beschreibung:** `01_descriptions/common_schuhe_abgelaufen.md`
- **Finale JSON:** `03_final-items/common_schuhe_abgelaufen.json`

---

## JSON-Definition

```json
{
  "id": "equipment_schuhe_abgelaufen",
  "name": "Abgelaufene Lederstiefel",
  "description": "Ein Paar Stiefel, deren Sohlen schon ziemlich dünn sind. Man spürt jeden spitzen Stein. Die Schnürsenkel wurden bereits mehrfach geknotet, weil sie immer wieder reißen. Halten die Füße trocken - solange es nicht regnet.",
  "type": "equipment",
  "rarity": "common",
  "slot": "schuhe",
  "iconPath": "/Assets/Items/Icons/equipment_schuhe_abgelaufen.png",
  "spritePath": "/Assets/Items/Sprites/equipment_schuhe_abgelaufen.png",
  "stackable": false,
  "maxStack": 1,
  "value": 3,
  "effects": [
    {
      "type": "time_boost",
      "value": 0.5
    }
  ],
  "droppable": true,
  "tradeable": true,
  "questItem": false
}
```

---

## Effekt-Implementierung

### time_boost Effekt

Der `time_boost` Effekt gibt dem Spieler mehr Zeit zum Beantworten von Quiz-Fragen.

**Basis-Zeit:** 10 Sekunden (COMBAT_TIME_LIMIT in constants.ts)
**Mit Item:** 10.5 Sekunden

**Integration in `useCombat.ts` oder `CombatEngine.ts`:**

```typescript
function getQuestionTimeLimit(equipment: PlayerEquipment): number {
  let baseTime = COMBAT_TIME_LIMIT; // 10 seconds

  // Equipment-Bonus addieren
  const timeBoost = getEquipmentStat(equipment, 'time_boost');
  baseTime += timeBoost;

  return baseTime;
}

// In askQuestion() oder beim Timer-Start:
const timeLimit = getQuestionTimeLimit(playerEquipment);
setTimeRemaining(timeLimit);
```

**Timer-Anpassung in CombatModal:**

```typescript
// Statt fester 10 Sekunden
const [timeRemaining, setTimeRemaining] = useState(getQuestionTimeLimit(equipment));

useEffect(() => {
  const timer = setInterval(() => {
    setTimeRemaining(prev => {
      if (prev <= 0) {
        handleTimeout();
        return 0;
      }
      return prev - 0.1; // 100ms Intervalle für smooth countdown
    });
  }, 100);
  return () => clearInterval(timer);
}, [currentQuestion]);
```

---

## Asset-Anforderungen

| Asset | Größe | Pfad | Status |
|-------|-------|------|--------|
| Icon | 32x32 px | `/Assets/Items/Icons/equipment_schuhe_abgelaufen.png` | [ ] Ausstehend |
| Sprite | 16x16 px | `/Assets/Items/Sprites/equipment_schuhe_abgelaufen.png` | [ ] Ausstehend |

**Icon-Beschreibung:**
- Braune Lederstiefel
- Dünne, abgelaufene Sohlen
- Mehrfach geknotete Schnürsenkel
- Abgenutzte Optik
- Common-Rahmen (grau)

---

## Balance-Überlegungen

| Stat | Wert | Begründung |
|------|------|------------|
| +0.5s Lösungszeit | +5% | Basis-Zeit ist 10s, also 5% mehr |
| Verkaufswert | 3 Gold | Niedrig wegen schlechtem Zustand |

**Vergleich mit anderen Schuhen:**
- Common: +0.5s Zeit (dieser)
- Rare: ~+1s Zeit
- Epic: ~+2s Zeit + Spezialeffekt

**Wichtig:** Zeit-Boni sind sehr wertvoll! 0.5 Sekunden klingen wenig, aber bei schwierigen Fragen kann das den Unterschied machen.

---

## Checkliste

- [ ] JSON-Definition in `03_final-items/` erstellen
- [ ] Icon-Asset erstellen (32x32)
- [ ] Sprite-Asset erstellen (16x16)
- [ ] time_boost in useCombat/CombatEngine integrieren
- [ ] Timer-Logik für Dezimalwerte anpassen
- [ ] Equipment-System für Schuhe-Slot implementieren
- [ ] In-Game testen
