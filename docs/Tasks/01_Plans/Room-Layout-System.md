# Room Layout System - Feature Beschreibung

**Status**: Planung
**Priorität**: Hoch
**Erstellt**: 2026-01-22

## Übersicht

Ersetzung des aktuellen BSP-basierten Dungeon-Generators durch ein vorgeneriertes Raum-Layout-System. Statt prozedural generierter Räume verschiedener Größen werden handgefertigte Raum-Layouts aus einem Pool zufällig ausgewählt und zu einem zusammenhängenden Dungeon kombiniert.

## Motivation

- **Mehr Kontrolle**: Handgefertigte Raum-Layouts ermöglichen interessanteres Level-Design
- **Vorhersehbare Qualität**: Jeder Raum ist spielbar und visuell ansprechend
- **Community Content**: Spieler/Entwickler können eigene Layouts erstellen
- **Wiederspielbarkeit**: Große Pools von Layouts sorgen für abwechslungsreiche Dungeons
- **Lernkurve**: Bestimmte Raum-Typen können gezielt für bestimmte Schwierigkeitsgrade designed werden

## Hauptkomponenten

### 1. Raum-Layout-Datenstruktur

Ein Raum-Layout ist eine vordefinierte Anordnung von Tiles mit:

- **Feste Größe**: Jedes Layout hat eine definierte Breite und Höhe (z.B. 8x8, 10x6, 12x12)
- **Tile-Grid**: 2D-Array mit Tile-Typen (Boden, Wand, Tür-Anker)
- **Türpositionen**: Definierte Positionen für Türen (Norden, Süden, Osten, Westen)
- **Raum-Typ**: Empty, Treasure, Combat, Shop
- **Metadaten**:
  - Name/ID des Layouts
  - Ersteller
  - Schwierigkeitsgrad (falls relevant)
  - Tags/Kategorien
  - Erstellungsdatum

### 2. Layout-Pool-System

Ein zentrales System zum Verwalten aller verfügbaren Raum-Layouts:

- **Persistierung**: Layouts werden in der Datenbank gespeichert (neue Tabelle `room_layouts`)
- **Kategorisierung**: Layouts können nach Typ, Größe, Schwierigkeit gefiltert werden
- **Starter-Layouts**: Initiales Seed mit 10-20 handgefertigten Layouts beim ersten Start
- **Dynamisches Laden**: Layouts werden zur Laufzeit aus der DB geladen
- **Validierung**: System prüft ob Layout valide ist (Türen verbindbar, begehbar, etc.)

### 3. Neue Dungeon-Generierung

Ersetzt das bisherige BSP-System komplett:

**Generierungs-Algorithmus**:
1. **Layout-Auswahl**: Wähle zufälliges Layout aus Pool für ersten Raum (Startpunkt)
2. **Raum-Platzierung**: Platziere Raum auf Grid an Startposition
3. **Tür-Expansion**:
   - Für jede verfügbare Tür des platzierten Raums
   - Wähle zufälliges Layout mit passender Tür-Position
   - Platziere neues Layout angrenzend
   - Verbinde Türen
4. **Iteration**: Wiederhole Schritt 3 bis Ziel-Raumanzahl erreicht (z.B. 15-25 Räume)
5. **Typ-Zuweisung**: Weise Raum-Typen zu (70% Empty, 20% Treasure, 10% Combat, 10% Shop)

**Besonderheiten**:
- Überlappungs-Prüfung: Neue Räume dürfen nicht mit existierenden kollidieren
- Tür-Kompatibilität: Layout mit Ost-Tür kann nur an West-Tür eines anderen Raums andocken
- Backup-Strategie: Wenn keine passenden Layouts verfügbar, wähle andere Tür oder beende Generation
- Garantierte Konnektivität: Alle platzierten Räume sind erreichbar (durch Tür-basierte Expansion)

### 4. Room Layout Editor

Ein eigenständiger Editor zum Erstellen und Bearbeiten von Raum-Layouts.

**Zugang**:
- Über Cheat-Mode (z.B. Tastenkombination Ctrl+Shift+E im laufenden Spiel)
- Über separaten Link/Route (z.B. `/editor` oder `/room-editor`)
- Über Hauptmenü-Button (nur für Entwickler/Admins sichtbar)

**Editor-UI-Komponenten**:

**a) Layout-Manager-Ansicht**:
- Liste aller existierenden Layouts (Thumbnail-Grid)
- **"+" Button**: Erstellt neues leeres Layout und öffnet Editor
- Such-/Filteroptionen (nach Typ, Größe, Ersteller)
- Lösch-Button pro Layout (mit Bestätigung)
- Export/Import-Funktionen (JSON-Format)

**b) Editor-Canvas**:
- Grid-basiertes Zeichnen (ähnlich wie Paint)
- Zoom-Funktion (rein/raus für präzises Arbeiten)
- Toolbar mit verfügbaren Tile-Typen:
  - Boden (verschiedene Varianten)
  - Wände (verschiedene Varianten)
  - Tür-Anker (Norden, Süden, Osten, Westen)
  - Spezial-Tiles (Treasure-Boden, Combat-Boden, Shop-Boden)
- **Zeichnen-Modi**:
  - Einzelner Tile
  - Rechteck-Füllung
  - Linie
  - Paint-Bucket (Flood-Fill)
  - Radiergummi
- Rückgängig/Wiederherstellen (Undo/Redo)
- Grid-Linien ein/ausblenden

**c) Layout-Einstellungen**:
- **Grid-Größe**: Breite und Höhe (Min: 5x5, Max: 15x15)
- **Raum-Name**: Freitext (z.B. "Goblin Thronsaal", "Enger Korridor")
- **Raum-Typ**: Dropdown (Empty, Treasure, Combat, Shop, oder "Any")
- **Türpositionen**: Checkboxen für Norden, Süden, Osten, Westen
- **Tags**: Freitext-Tags (z.B. "boss", "corridor", "arena")
- **Schwierigkeitsgrad**: Slider (1-10) oder Dropdown (Easy, Medium, Hard)

**d) Validierung & Preview**:
- **Live-Validierung**:
  - Mindestens eine Tür muss definiert sein
  - Raum muss begehbaren Boden haben
  - Türen müssen an Raum-Rändern platziert sein
  - Keine isolierten Bereiche (alle Böden müssen erreichbar sein)
- **Preview-Modus**:
  - Raum in 3D/Isometric wie im Spiel darstellen
  - Mit Player-Sprite zum Testen der Begehbarkeit
  - Tür-Positionen visuell hervorheben

**e) Speichern & Veröffentlichen**:
- **Speichern**: Layout wird in DB gespeichert und ist sofort verfügbar
- **Metadaten**: Ersteller (aktueller User), Erstellungsdatum werden automatisch gespeichert
- **Feedback**: Bestätigung "Layout gespeichert und zum Pool hinzugefügt"
- **Zurück zur Übersicht**: Nach Speichern zurück zur Layout-Manager-Ansicht

### 5. Integration ins bestehende Spiel

**Änderungen an bestehenden Systemen**:

**a) Dungeon-Generierung**:
- Kompletter Ersatz von `lib/dungeon/generation.ts`
- Neue Funktion `generateDungeonFromLayouts()` statt `generateDungeon()`
- Bestehende `Room`-Interface bleibt größtenteils kompatibel
- `roomMap` wird weiterhin generiert (zur Navigation/Kollision)

**b) Rendering**:
- `GameRenderer` muss unverändert bleiben (arbeitet bereits mit Tile-Grid)
- Fog-of-War funktioniert weiterhin
- Minimap funktioniert weiterhin
- Keine visuellen Änderungen nötig

**c) Enemy-Spawning**:
- Weiterhin ein Goblin pro Raum (außer Start-Raum)
- Spawn-Position: Zufälliger begehbarer Boden innerhalb des Raums
- Enemy AI bleibt unverändert

**d) Player-Start**:
- Player startet im ersten generierten Raum (Mitte des Raums)
- Startpunkt muss begehbarer Boden sein

**e) Shop/Treasure-Räume**:
- Shop-Inventar wird weiterhin zufällig generiert
- Items werden auf begehbaren Boden-Tiles platziert
- Treasure-Rooms erhalten goldene Boden-Tiles

## Datenbank-Schema

### Neue Tabelle: `room_layouts`

```sql
CREATE TABLE room_layouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  tile_grid TEXT NOT NULL,           -- JSON: 2D array of tile types
  door_positions TEXT NOT NULL,      -- JSON: { north: bool, south: bool, east: bool, west: bool }
  room_type TEXT,                    -- 'empty' | 'treasure' | 'combat' | 'shop' | 'any'
  difficulty INTEGER DEFAULT 5,      -- 1-10
  tags TEXT,                         -- JSON: string[]
  created_by INTEGER,                -- FOREIGN KEY to users.id
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
)
```

### API-Endpunkte

```
GET  /api/room-layouts              # Alle Layouts abrufen (mit Filter-Optionen)
POST /api/room-layouts              # Neues Layout erstellen
GET  /api/room-layouts/:id          # Einzelnes Layout abrufen
PUT  /api/room-layouts/:id          # Layout aktualisieren
DELETE /api/room-layouts/:id        # Layout löschen
GET  /api/room-layouts/random       # Zufälliges Layout aus Pool abrufen (für Generation)
```

## User-Flow

### Workflow: Neues Layout erstellen

1. User geht auf `/editor` oder drückt Cheat-Key im Spiel
2. Layout-Manager-Ansicht wird angezeigt mit allen existierenden Layouts
3. User klickt auf **"+"** Button
4. Neues leeres Layout wird erstellt (Standard: 8x8, alle Wände)
5. Editor-Canvas öffnet sich mit leerem Grid
6. User wählt Tile-Typ aus Toolbar (z.B. Boden)
7. User zeichnet auf Canvas (Malen, Rechteck, etc.)
8. User setzt Türpositionen (Checkboxen)
9. User gibt Metadaten ein (Name, Typ, etc.)
10. System validiert Layout automatisch (Live-Feedback)
11. User klickt "Speichern"
12. Layout wird in DB gespeichert
13. Bestätigung: "Layout 'Goblin Thronsaal' gespeichert!"
14. Layout ist sofort im Pool verfügbar für nächste Dungeon-Generation
15. User kehrt zurück zur Layout-Manager-Ansicht

### Workflow: Layout bearbeiten

1. User öffnet Layout-Manager
2. User klickt auf existierendes Layout (Thumbnail)
3. Editor öffnet sich mit geladenem Layout
4. User bearbeitet Layout (Tiles, Türen, Metadaten)
5. User klickt "Speichern"
6. Layout wird aktualisiert in DB
7. Änderungen sind sofort verfügbar

### Workflow: Layout im Spiel testen

1. User speichert Layout im Editor
2. User startet neues Spiel (oder Cheat-Key für Dungeon-Reload)
3. Dungeon wird generiert mit Layouts aus Pool (inkl. neuem Layout)
4. User spielt durch Dungeon und testet neues Layout
5. Falls Anpassungen nötig: Zurück zum Editor, Layout bearbeiten, erneut testen

## Starter-Layouts

Beim ersten Start des Systems werden 15-20 handgefertigte Layouts automatisch geseed:

- **5x Korridore**: Lange schmale Räume (10x5, 12x4)
- **5x Standard-Räume**: Quadratische/rechteckige Räume (8x8, 10x8)
- **3x Große Hallen**: Geräumige Räume (12x12, 15x10)
- **3x Enge Räume**: Kleine verwinkelte Räume (6x6, 7x5)
- **2x Spezial-Räume**: Boss-Arena, Labyrinth-Raum

Jedes Layout hat:
- Alle 4 Türpositionen verfügbar (maximale Flexibilität)
- Valide Tile-Anordnung (begehbar, keine isolierten Bereiche)
- Verschiedene Tile-Varianten für visuelles Interesse

## Technische Anforderungen

### Frontend (Editor)

- **React-Komponente**: `RoomLayoutEditor.tsx` (Hauptkomponente)
- **Sub-Komponenten**:
  - `LayoutManager.tsx` (Übersicht mit Thumbnails)
  - `LayoutCanvas.tsx` (Zeichen-Canvas)
  - `LayoutToolbar.tsx` (Tile-Auswahl, Tools)
  - `LayoutSettings.tsx` (Metadaten-Formular)
  - `LayoutPreview.tsx` (3D-Preview)
- **State Management**: React Context oder Zustand für Editor-State
- **Canvas-Rendering**: HTML5 Canvas mit Tile-Set-Rendering
- **Undo/Redo**: Command-Pattern für History-Management

### Backend (Generation & Persistence)

- **Neue Datei**: `lib/dungeon/layoutGeneration.ts` (neue Generierungs-Logik)
- **Neue Datei**: `lib/dungeon/LayoutPool.ts` (Pool-Management)
- **Neue Datei**: `lib/db/roomLayouts.ts` (DB-Operationen)
- **API-Routes**: `app/api/room-layouts/` (CRUD-Operationen)
- **Validierung**: Server-seitige Validierung aller Layouts
- **Seeding**: `lib/data/seed-room-layouts.json` (Starter-Layouts)

### Migration

- Bestehende Dungeon-Generierung bleibt zunächst erhalten (Feature-Toggle)
- Neue Generierung kann über ENV-Variable aktiviert werden (`USE_LAYOUT_SYSTEM=true`)
- Nach erfolgreichen Tests: Kompletter Ersatz des alten Systems

## Vorteile

✅ **Spieldesign**: Handgefertigte Räume sind interessanter als prozedurale
✅ **Performance**: Keine komplexe BSP-Berechnung zur Laufzeit
✅ **Skalierbarkeit**: Unendlich viele Layouts können hinzugefügt werden
✅ **Modding**: Community kann eigene Layouts erstellen
✅ **Qualitätskontrolle**: Jedes Layout wird manuell erstellt und getestet
✅ **Abwechslung**: Große Pools sorgen für hohe Wiederspielbarkeit

## Herausforderungen

⚠️ **Initiale Arbeit**: Erstellen von Starter-Layouts ist zeitaufwendig
⚠️ **Validierung**: Sicherstellen dass alle Layouts spielbar sind
⚠️ **Generierungs-Logik**: Räume müssen intelligent verbunden werden (keine Sackgassen)
⚠️ **Editor-UX**: Intuitive Bedienung ist entscheidend für Akzeptanz
⚠️ **Kompatibilität**: Bestehende Systeme (Kollision, Fog, Minimap) dürfen nicht brechen

## Nächste Schritte

1. **Prototyping**: Erstelle einfachen Proof-of-Concept für Layout-basierte Generation
2. **Datenbank-Design**: Definiere endgültiges Schema für `room_layouts`
3. **Editor-Mockups**: Wireframes für UI-Design erstellen
4. **Starter-Layouts**: 15-20 Layouts manuell designen (auf Papier/Excel)
5. **Implementierung**: Schrittweise Umsetzung beginnend mit DB und Generation
6. **Editor-Entwicklung**: Nachdem Generation funktioniert, Editor bauen
7. **Testing**: Umfangreiche Tests mit verschiedenen Layout-Kombinationen
8. **Polishing**: UX-Verbesserungen basierend auf Feedback

## Offene Fragen

- Soll es eine maximale Pool-Größe geben oder unbegrenzt?
- Sollen Layouts von anderen Usern bearbeitbar sein (Collaborative Editing)?
- Soll es ein Rating-System für Layouts geben (Community-Voting)?
- Sollen Layouts exportierbar sein (JSON-Dateien zum Teilen)?
- Wie gehen wir mit "schlechten" Layouts um (automatische Validierung vs. manuelle Moderation)?
- Sollen bestimmte Layouts nur bei bestimmten Schwierigkeitsgraden spawnen?

---

**Erstellt von**: Tim/Michi/Tobias
**Review-Status**: Pending
**Implementierungs-Priorität**: Nach Shop-System
