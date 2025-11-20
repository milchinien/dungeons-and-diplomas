# 🎮 Dungeons & Diplomas - Spielanleitung

## Schnellstart

```bash
cd spikes/2025-11-20-mw-tw-dungeon-and-diplomas-test
npm run dev
```

Dann öffne: **http://localhost:5173/**

---

## 🎯 Spielziel

Erkunde prozedural generierte Dungeons, bekämpfe Goblins durch Lösen von Bildungsfragen und überlebe!

---

## 🕹️ Steuerung

### Bewegung
- **W** oder **↑**: Nach oben
- **A** oder **←**: Nach links
- **S** oder **↓**: Nach unten
- **D** oder **→**: Nach rechts

### Im Kampf
- **Mausklick** auf Antworten
- **10 Sekunden** Zeit pro Frage
- Richtige Antwort = Schaden am Gegner
- Falsche Antwort = Schaden an dir

---

## 🗺️ Dungeon-Typen

### Räume
- **Graue Böden**: Leere Räume (70%)
- **Goldene Böden**: Schatzräume (20%)
- **Dunkle Böden**: Kampfräume (10%)

### Fog of War
- Nur besuchte Räume sind sichtbar
- Wände erscheinen wenn angrenzende Räume erkundet sind
- Minimap (oben rechts) zeigt erkundete Bereiche

---

## ⚔️ Combat System

### Kampf-Ablauf
1. Enemy erreicht dich → Combat startet
2. Zufälliges Fach wird gewählt (Chemie/Physik)
3. Multiple-Choice Frage erscheint
4. 10 Sekunden zum Antworten
5. Richtig → Enemy verliert 10 HP
6. Falsch → Du verlierst 15 HP
7. Wiederhole bis Enemy oder du besiegt bist

### Stats
- **Deine HP**: 100
- **Goblin HP**: 30
- **Timer**: 10 Sekunden/Frage

---

## 📊 Minimap

**Oben rechts** - Zeigt die Dungeon-Übersicht:

- **Cyan**: Deine Position
- **Gold**: Schatzräume
- **Rot**: Kampfräume
- **Grau**: Leere Räume
- **Grün**: Türen
- **Schwarz**: Unerforschte Bereiche

---

## 🎲 Gameplay-Tipps

### Strategie
1. **Erkunde systematisch**: Räume nacheinander aufdecken
2. **Meide rote Räume am Anfang**: Wenn möglich Schatzräume zuerst
3. **Lerne die Fragen**: Chemie & Physik Grundwissen hilft
4. **Zeit im Blick**: Keine Antwort = 15 HP Verlust

### Enemies
- **Goblins** patrouillieren in Räumen
- Aggro bei 3 Tiles Entfernung
- Folgen dir bis 6 Tiles Entfernung
- Wechseln zwischen Idle/Wandering/Following States

---

## 🔧 Für Entwickler

### Projekt-Struktur
```
src/
├── components/combat/    # Combat UI
├── components/dungeon/   # Dungeon Rendering
├── components/ui/        # Shared UI
├── lib/                  # Game Logic
├── database/             # Fragen (JSON)
└── styles/               # Theme
```

### Game Constants
Anpassen in `src/lib/constants.ts`:
- `PLAYER_MAX_HP`: Spieler-Lebenspunkte
- `PLAYER_SPEED_TILES`: Bewegungsgeschwindigkeit
- `DUNGEON_WIDTH/HEIGHT`: Dungeon-Größe
- `MIN_/MAX_ROOM_SIZE`: Raumgrößen

### Fragen hinzufügen
Bearbeite `src/database/chemie.json` oder `physik.json`:
```json
{
  "question": "Was ist H2O?",
  "answers": ["Wasser", "Wasserstoffperoxid", "Salzsäure", "Schwefelsäure"],
  "correct": 0
}
```

---

## 🐛 Bekannte Einschränkungen

- Combat-Trigger muss noch finalisiert werden
- Keine Loot/Items im aktuellen Build
- Shops nicht funktional
- Kein Sound

---

## 🚀 Nächste Entwicklungs-Schritte

1. Combat-Trigger bei Enemy-Collision aktivieren
2. Loot-System implementieren (Gold, Items)
3. Inventory funktional machen
4. Shop-Räume aktivieren
5. Sound Effects hinzufügen
6. Partikel-Effekte bei Treffern

---

**Viel Erfolg beim Erkunden!** 🗡️

Bei Fragen: Siehe `ZUSAMMENFASSUNG.md` und `IMPLEMENTATIONSPLAN.md`
