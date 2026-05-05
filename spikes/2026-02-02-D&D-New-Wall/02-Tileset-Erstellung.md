# Tileset-Erstellung: Schritt-für-Schritt

**Datum:** 2026-02-04
**Datei:** 02-Tileset-Erstellung.md

---

## Voraussetzungen

### Software
- **Bildbearbeitungs-Software:**
  - GIMP (kostenlos, empfohlen)
  - Photoshop
  - Aseprite (für Pixel Art)

### Dateien
- `Tileset.png` (aktuell)
- `Tileset_old.png` (Quelle)

---

## Phase 1: Backup erstellen

### Schritt 1.1: Aktuelles Tileset sichern
```bash
# Im Verzeichnis: public/Assets/Castle-Dungeon2_Tiles/
cp Tileset.png Tileset_backup_2026-02-04.png
```

**Warum?** Falls etwas schief geht, können wir zurück zum Original.

### Schritt 1.2: Arbeitskopie erstellen
```bash
cp Tileset.png Tileset_work.png
```

**Diese Datei** bearbeiten wir. Erst am Ende überschreiben wir `Tileset.png`.

---

## Phase 2: Koordinaten identifizieren

### Schritt 2.1: GIMP öffnen
1. GIMP starten
2. `Tileset_old.png` öffnen
3. **Ansicht → Gitter anzeigen** (View → Show Grid)
4. **Bild → Gitter konfigurieren** (Image → Configure Grid)
   - Breite: 64 px
   - Höhe: 64 px
   - Stil: Solid Line
   - Farbe: Rot/Gelb (gut sichtbar)

### Schritt 2.2: Jedes Tile identifizieren

**Hilfswerkzeug:** Rechteck-Auswahl-Tool
1. Aktiviere "Festgelegte Größe" (64×64)
2. Klicke auf ein Tile → Koordinaten anzeigen lassen
3. Position notieren (in Tiles, nicht Pixel!)

**Beispiel:**
- Pixel-Position: (128, 192)
- Tile-Position: (128/64, 192/64) = **(2, 3)**

### Schritt 2.3: Wand-Typen finden

**Visuelle Merkmale der Wand-Typen:**

#### HORIZONTAL (═══)
- Wand verläuft von links nach rechts
- Oben und unten ist frei
- Sieht aus wie ein horizontaler Balken

#### VERTICAL (║)
- Wand verläuft von oben nach unten
- Links und rechts ist frei
- Sieht aus wie ein vertikaler Balken

#### CORNER_TL (╔)
- Wand nach rechts UND nach unten
- Oben und links ist frei
- Ecke oben-links

#### CORNER_TR (╗)
- Wand nach links UND nach unten
- Oben und rechts ist frei
- Ecke oben-rechts

#### CORNER_BL (╚)
- Wand nach rechts UND nach oben
- Unten und links ist frei
- Ecke unten-links

#### CORNER_BR (╝)
- Wand nach links UND nach oben
- Unten und rechts ist frei
- Ecke unten-rechts

#### T_UP (╩)
- Wand links, rechts, unten
- Oben ist frei
- T-Stück öffnet nach oben

#### T_DOWN (╦)
- Wand links, rechts, oben
- Unten ist frei
- T-Stück öffnet nach unten

#### T_LEFT (╣)
- Wand oben, unten, rechts
- Links ist frei
- T-Stück öffnet nach links

#### T_RIGHT (╠)
- Wand oben, unten, links
- Rechts ist frei
- T-Stück öffnet nach rechts

#### CROSS (╬)
- Wand in alle 4 Richtungen
- Kreuzung

### Schritt 2.4: Türen finden

**Horizontal-Tür:**
- Tür geht von links nach rechts
- Zwei Varianten: offen und geschlossen

**Vertikal-Tür:**
- Tür geht von oben nach unten
- Zwei Varianten: offen und geschlossen

**Tipp:** Türen sind meist blau/braun gefärbt im Tileset.

### Schritt 2.5: Koordinaten-Tabelle ausfüllen

Die Tabelle in **04-Tile-Koordinaten-Update.md** ausfüllen!

---

## Phase 3: Tiles kopieren

### Schritt 3.1: Beide Tilesets öffnen
1. GIMP öffnen
2. `Tileset_old.png` öffnen (Quelle)
3. `Tileset_work.png` öffnen (Ziel)
4. Beide Fenster nebeneinander anordnen

### Schritt 3.2: Einzelnes Tile kopieren

**Für JEDES Tile:**
1. **In Tileset_old.png:**
   - Rechteck-Auswahl (64×64)
   - Position: (tile_x * 64, tile_y * 64)
   - Bearbeiten → Kopieren (Ctrl+C)

2. **In Tileset_work.png:**
   - Ebene auswählen
   - Bearbeiten → Einfügen als → Neue Ebene
   - Ebene auf korrekte Position verschieben
   - Ebene mit Hintergrund vereinen

3. **Wiederholen** für alle Wand-Typen und Türen

### Schritt 3.3: Alternative Methode (für viele Tiles)

**Skript in GIMP (Python-Fu):**
```python
# Dieses Skript kann in GIMP ausgeführt werden
# Filter → Python-Fu → Console

# Beispiel: Tile (2, 3) aus Quelle nach (5, 7) in Ziel kopieren
source_x = 2 * 64
source_y = 3 * 64
target_x = 5 * 64
target_y = 7 * 64

# Copy-Paste Logik hier...
```

**Hinweis:** Manuelles Kopieren ist für ~20 Tiles machbar, bei mehr lohnt sich ein Skript.

---

## Phase 4: Überprüfung

### Schritt 4.1: Visuelle Kontrolle
- Alle Tiles korrekt positioniert?
- Keine Artefakte (Pixel-Fehler)?
- Kanten sauber?

### Schritt 4.2: Grid-Alignment prüfen
- Jedes Tile exakt 64×64?
- Keine Überlappungen?
- Keine Lücken?

### Schritt 4.3: Transparenz prüfen
- Hat das Tileset einen Alpha-Kanal?
- Sind Leerstellen transparent oder schwarz?

**Tipp:** Im Spiel sollten Leerstellen transparent sein!

---

## Phase 5: Export

### Schritt 5.1: Export-Einstellungen (GIMP)
1. Datei → Exportieren als...
2. Dateiname: `Tileset_new.png`
3. Format: PNG
4. Optionen:
   - **Kompression:** 9 (max)
   - **Interlacing:** Keine
   - **Metadaten speichern:** NEIN (reduziert Dateigröße)
   - **Alpha-Kanal:** JA (falls Transparenz benötigt)

### Schritt 5.2: Dateigröße prüfen
```bash
ls -lh Tileset_new.png
```

**Erwartete Größe:** ~50-200 KB (je nach Komplexität)

Falls zu groß (>1 MB):
- Kompression erhöhen
- Unnötige Metadaten entfernen
- Farbraum prüfen (RGB vs. Indexed)

---

## Phase 6: Integration

### Schritt 6.1: Backup des aktuellen Tilesets (nochmal!)
```bash
cd public/Assets/Castle-Dungeon2_Tiles/
cp Tileset.png Tileset_before_wall_update.png
```

### Schritt 6.2: Neues Tileset aktivieren
```bash
cp Tileset_new.png Tileset.png
```

### Schritt 6.3: Code-Änderungen (siehe Dokument 04)
**WICHTIG:** Koordinaten in `lib/spriteConfig.ts` anpassen!

### Schritt 6.4: Erste Überprüfung
```bash
npm run dev
```

1. Spiel öffnen
2. Neuen Dungeon generieren
3. Visuell prüfen:
   - Werden Wände korrekt angezeigt?
   - Sind Türen sichtbar?
   - Gibt es schwarze Quadrate (= falsche Koordinaten)?

---

## Phase 7: Rollback-Plan

### Falls etwas schief geht:

**Schritt 7.1: Tileset zurücksetzen**
```bash
cd public/Assets/Castle-Dungeon2_Tiles/
cp Tileset_backup_2026-02-04.png Tileset.png
```

**Schritt 7.2: Code zurücksetzen**
```bash
git checkout lib/spriteConfig.ts
```

**Schritt 7.3: Browser-Cache leeren**
- Ctrl+Shift+R (Hard Reload)
- Oder: Inkognito-Fenster öffnen

---

## Häufige Probleme

### Problem 1: Schwarze Quadrate im Spiel
**Ursache:** Koordinaten zeigen auf leere Bereiche im Tileset

**Lösung:**
1. Koordinaten in `lib/spriteConfig.ts` prüfen
2. Tile im Tileset visuell finden
3. Koordinaten korrigieren

### Problem 2: Falsche Wand-Typen
**Ursache:** Horizontal/Vertikal vertauscht

**Lösung:**
1. Siehe Dokument `06-Wand-Bug-Fix.md`
2. `lib/tiletheme/WallTypeDetector.ts` prüfen

### Problem 3: Türen werden nicht angezeigt
**Ursache:** Tür-Koordinaten falsch

**Lösung:**
1. `TILESET_COORDS.DOOR_*` in `spriteConfig.ts` prüfen
2. Alle 4 Tür-Typen müssen korrekt sein

### Problem 4: Tileset wird im Browser nicht aktualisiert
**Ursache:** Browser-Cache

**Lösung:**
1. Hard Reload (Ctrl+Shift+R)
2. Cache leeren
3. Inkognito-Modus
4. `npm run dev` neu starten

---

## Checkliste

- [ ] Backup erstellt (`Tileset_backup_2026-02-04.png`)
- [ ] Arbeitskopie erstellt (`Tileset_work.png`)
- [ ] GIMP Grid konfiguriert (64×64)
- [ ] Alle Wand-Typen identifiziert (siehe Tabelle in Dokument 04)
- [ ] Alle Tür-Typen identifiziert
- [ ] Tiles in Arbeitskopie kopiert
- [ ] Visuell überprüft (keine Artefakte)
- [ ] Exportiert als PNG mit Kompression
- [ ] Dateigröße geprüft (<1 MB)
- [ ] Integration vorbereitet
- [ ] Rollback-Plan bereit

---

**Nächstes Dokument:** `03-Code-Mapping.md`
