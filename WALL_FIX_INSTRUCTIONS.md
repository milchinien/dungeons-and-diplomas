# Doppelte Wände Fix - Anleitung

## Problem
Doppelte Wände zwischen Räumen im generierten Dungeon.

## Lösung implementiert

### 1. Code-Änderungen
- ✅ `lib/dungeon/layoutGeneration.ts` - `removeDoubleWalls()` Funktion hinzugefügt
- ✅ `lib/dungeon/layoutGeneration.ts` - `placeRoomInDungeon()` überspringt Wände auf geteilten Seiten
- ✅ Test erstellt: `tests/dungeon-double-walls.test.ts` (alle Tests bestehen)

### 2. Getestete Ergebnisse
```
✅ SUCCESS: No double walls found!
All rooms are properly connected with single walls.
```

## Schritte zum Testen

### Schritt 1: Datenbank zurücksetzen (wichtig!)
```bash
# Lösche die alte Datenbank
rm data/game.db

# Beim nächsten Start wird die DB neu erstellt mit korrigierten Layouts
```

### Schritt 2: Node Modules Cache leeren
```bash
# Falls vorhanden
rm -rf .next
npm run build
```

### Schritt 3: Dev-Server neu starten
```bash
npm run dev
```

### Schritt 4: Im Spiel testen
1. Öffne http://localhost:3000
2. Logge dich ein
3. Generiere ein neues Dungeon
4. Prüfe die Wände zwischen Räumen

### Schritt 5: Unit Test ausführen (optional)
```bash
npx tsx tests/dungeon-double-walls.test.ts
```

Sollte ausgeben:
```
✅ SUCCESS: No double walls found!
```

## Was wurde gefixt?

### Vorher
```
[RAUM 1]
[WAND  ] <- Wand von Raum 1
[WAND  ] <- Wand von Raum 2 (DOPPELT!)
[RAUM 2]
```

### Nachher
```
[RAUM 1]
[WAND  ] <- Geteilte Wand
[RAUM 2]
```

## Technische Details

Die `removeDoubleWalls()` Funktion:
1. Scannt das gesamte Dungeon-Grid
2. Findet Wand-Wand Muster
3. Prüft ob Boden auf beiden Seiten existiert
4. Entfernt die zweite Wand

Dies passiert NACH dem Platzieren aller Räume, aber VOR der Typ-Zuweisung.
