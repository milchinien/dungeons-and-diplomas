# Manuelle Test-Anleitung für Dungeon-Generierung Fixes

## Vorbereitung
1. Starte den Dev-Server: `npm run dev`
2. Öffne http://localhost:3000 im Browser
3. Logge dich ein (beliebiger Benutzername)

## Test 1: Wände sind sauber (keine Doppel-Wände)

**Ziel**: Verifizieren, dass keine doppelten Wände zwischen Räumen existieren

**Schritte**:
1. Bewege dich durch den Dungeon
2. Achte auf Wände zwischen Räumen
3. Prüfe, ob Wände immer nur 1 Tile dick sind

**Erwartetes Ergebnis**:
- ✅ Alle Wände sind genau 1 Tile dick
- ✅ Keine sichtbaren "Doppel-Wände" zwischen Räumen
- ✅ Raumübergänge sehen clean aus

**Bei Fehler**:
- Screenshot machen
- Position notieren (X/Y Koordinaten wenn möglich)

## Test 2: Shop-Räume haben Shop-Inhalt

**Ziel**: Verifizieren, dass alle Shop-Räume Items und Perks anzeigen

**Schritte**:
1. Finde einen Shop-Raum (türkis auf der Minimap)
2. Betrete den Shop-Raum
3. Prüfe, ob:
   - Links: Items (Schwert, Helm, etc.) schweben
   - Rechts: Perks (runde Icons) schweben
   - Oben: Shop-Schild sichtbar ist
   - Theken (Counters) sichtbar sind

**Erwartetes Ergebnis**:
- ✅ Shop-Räume zeigen 1-2 Items
- ✅ Shop-Räume zeigen 1-2 Perks
- ✅ Alle Items/Perks schweben animiert
- ✅ Kein leerer Shop ohne Inventar

**Bei Fehler**:
- Screenshot vom Shop-Raum
- Prüfe Browser-Console auf Fehler
- Notiere Raumgröße (klein/groß)

## Test 3: Türen sind korrekt orientiert

**Ziel**: Verifizieren, dass Türen nicht falsch gedreht sind

**Schritte**:
1. Bewege dich durch mehrere Räume
2. Achte auf Türen zwischen Räumen
3. Prüfe, ob Türen zur Wand-Orientierung passen:
   - Horizontale Wand → Vertikale Tür
   - Vertikale Wand → Horizontale Tür

**Erwartetes Ergebnis**:
- ✅ Alle Türen sind korrekt orientiert
- ✅ Türen führen nicht "ins Nichts"
- ✅ Türen verbinden immer zwei Räume

**Bei Fehler**:
- Screenshot der falschen Tür
- Position notieren

## Test 4: Mehrere Dungeon-Generierungen

**Ziel**: Konsistenz über mehrere Runs prüfen

**Schritte**:
1. Drücke F5 um die Seite neu zu laden
2. Logge dich ein
3. Prüfe erneut Wände, Shops und Türen
4. Wiederhole 3-5 Mal

**Erwartetes Ergebnis**:
- ✅ Fehler treten NICHT zufällig auf
- ✅ Jeder Dungeon hat saubere Wände
- ✅ Jeder Shop hat Inventar
- ✅ Konsistentes Verhalten

## Test 5: Browser-Console prüfen

**Ziel**: Keine Fehler in der Konsole

**Schritte**:
1. Öffne Browser DevTools (F12)
2. Wechsle zum "Console" Tab
3. Suche nach Fehlern (rot)
4. Prüfe Logs:
   - `[layoutGeneration] Removed X double walls`
   - `[layoutGeneration] Assigned room types: X shops created`

**Erwartetes Ergebnis**:
- ✅ Keine roten Fehler in Console
- ✅ Logs zeigen "Removed double walls" (sollte > 0 sein)
- ✅ Logs zeigen dass Shops erstellt wurden

## Checklist für Kompletten Test

- [ ] Wände sind überall sauber (keine Doppel-Wände)
- [ ] Mindestens 1 Shop gefunden und geprüft
- [ ] Shop hat Items und Perks
- [ ] Türen sind korrekt orientiert
- [ ] Keine Türen ins Nichts
- [ ] 3+ Dungeon-Reloads getestet
- [ ] Konsistente Ergebnisse
- [ ] Browser-Console ohne Fehler
- [ ] Shop-Logs in Console vorhanden

## Bei Problemen

**Wenn ein Fehler auftritt**:
1. Screenshot machen
2. Browser-Console kopieren
3. Position/Koordinaten notieren
4. Issue in GitHub erstellen mit:
   - Screenshot
   - Console-Logs
   - Schritte zur Reproduktion
   - Browser/OS Info

## Automatisierte Tests

**Unit-Tests laufen lassen**:
```bash
npx vitest run tests/unit/dungeon-generation-fixes.test.ts
```

**Erwartetes Ergebnis**:
```
✓ tests/unit/dungeon-generation-fixes.test.ts (12 tests) 12ms
  Test Files  1 passed (1)
       Tests  12 passed (12)
```
