# Dungeons & Diplomas - Dungeon Crawler Spielbeschreibung

## Spielkonzept

Ein rundenbasiertes Dungeon-Crawler-Spiel, bei dem der Spieler durch prozedural generierte Etagen navigiert, Gegner mit Mathe-Aufgaben bekämpft, Schätze sammelt und sich in Shops verbessern kann.

## Spielablauf - Übersicht

1. **Start**: Spieler beginnt am Eingang einer Etage
2. **Navigation**: Bewegung entlang der Karte mit A (links) und D (rechts)
3. **Räume erkunden**: Verschiedene Raum-Typen mit unterschiedlichen Herausforderungen
4. **Kampf**: Gegner mit Mathe-Aufgaben besiegen
5. **Pfadwahl**: Entscheidung zwischen verschiedenen Routen (oben/unten)
6. **Shop**: Items kaufen zwischen Etagen
7. **Nächste Etage**: Neue generierte Karte
8. **Finaler Shop**: Am Ende aller Etagen

## Karten-System

### Karten-Ansicht (Karte.png)
Die Karte zeigt einen visuellen Pfad durch die Etage mit verschiedenen Raum-Symbolen.

**Navigation:**
- **A-Taste**: Nach links bewegen
- **D-Taste**: Nach rechts bewegen
- Der Spieler bewegt sich entlang des Pfades

**Pfad-Struktur:**
1. Linearer Startbereich
2. Verzweigung in oberen und unteren Pfad
3. Zusammenführung im Shop
4. Ausgang zur nächsten Etage

**Pfad-Entscheidung:**
- Nach dem ersten Gegner-Raum kann sich der Spieler per Klick zwischen oberem und unterem Pfad entscheiden
- Oberer Pfad: Führt zu einem zweiten Gegner-Raum und dann zum Schatzraum
- Unterer Pfad: Führt zu einem zweiten Gegner-Raum und dann zum Boss-Raum

## Raum-Typen

### 1. Eingang / Nächste Etage
- **Symbol**: Tür-Icon (braun)
- **Funktion**: Startpunkt der Etage
- **Beschreibung**: Hier beginnt der Spieler seine Reise durch die Etage

### 2. Gegner-Raum
- **Symbol**: Schwert-Icon (grau mit rotem Schwert)
- **Funktion**: Kampf gegen normale Gegner
- **Trigger**: Automatischer Übergang in den Combat-Raum beim Betreten
- **Belohnung**: Erfahrung, mögliche Item-Drops

### 3. Boss-Raum
- **Symbol**: Monster-Icon (grau mit rotem Monster)
- **Farbe**: Rot umrandet
- **Funktion**: Kampf gegen einen starken Boss-Gegner
- **Schwierigkeit**: Höher als normale Gegner-Räume
- **Belohnung**: Bessere Items und mehr Belohnungen
- **Position**: Im unteren Pfad nach der Verzweigung

### 4. Schatzraum
- **Symbol**: Schatztruhe (gelb)
- **Farbe**: Gelb umrandet
- **Funktion**: Loot sammeln
- **Belohnung**: Items, Gold, Ausrüstung
- **Position**: Im oberen Pfad nach der Verzweigung

### 5. Shop
- **Symbol**: Münz-Icon (blau)
- **Funktion**: Items kaufen mit gesammeltem Gold
- **Position**: Nach Zusammenführung der Pfade, vor dem Ausgang
- **Features**: Item-Kauf, Ausrüstungs-Upgrade (später)

### 6. Ausgang
- **Symbol**: Graph/Treppe-Icon (braun)
- **Funktion**: Übergang zur nächsten Etage
- **Beschreibung**: Am Ende jeder Etage, führt zu einer neuen generierten Karte

## Combat-System

### Combat-Raum (Combat-Raum.png)

**Visuelle Darstellung:**
- **Oberer Bereich**: Dungeon-Szene mit Spieler-Charakter (links) und Gegner (rechts)
  - Umgebung: Steinmauern, Fackeln an den Wänden, Holzzaun
  - Spieler: Strichmännchen-Charakter mit Werkzeug/Waffe
  - Gegner: Goblin (grün) oder andere Monster-Typen

- **Unterer Bereich**: Combat-UI
  - Links: Spieler-Portrait und HP-Balken
    - Label: "ICH"
    - HP-Anzeige: "100 / 100" (grüner Balken)
  - Rechts: Gegner-Portrait und HP-Balken
    - Label: Gegner-Name (z.B. "GOBLIN")
    - HP-Anzeige: "20 / 100" (rot/weiß Balken)

**Kampfmechanik:**
1. Spieler betritt einen Gegner- oder Boss-Raum
2. Combat-Raum wird geladen mit Spieler und Gegner
3. Mathe-Aufgabe wird angezeigt
4. Spieler muss die Aufgabe lösen
5. Bei richtiger Antwort: Schaden am Gegner
6. Bei falscher Antwort: Schaden am Spieler (optional)
7. Kampf läuft rundenbasiert, bis einer auf 0 HP fällt
8. Bei Sieg: Zurück zur Karte, weiterer Fortschritt möglich
9. Bei Niederlage: Game Over (Details noch zu definieren)

**Mathe-Aufgaben:**
- Leichte Aufgaben bei normalen Gegnern
- Schwerere Aufgaben bei Boss-Gegnern
- Aufgabenschwierigkeit könnte mit Etagen-Level steigen

## Etagen-System

**Ablauf pro Etage:**
1. Start am Eingang
2. Bewegung durch lineare und verzweigte Pfade
3. Kämpfe in Gegner-Räumen
4. Pfad-Entscheidung (oben: Schatz, unten: Boss)
5. Shop-Besuch
6. Übergang zur nächsten Etage

**Prozeduale Generierung:**
- Jede neue Etage hat eine andere, generierte Karte
- Unterschiedliche Anordnung von Schatzräumen, Boss-Räumen und Gegner-Räumen
- Schwierigkeit steigt mit jeder Etage

**Finales Ziel:**
- Mehrere Etagen durchqueren
- Am Ende aller Etagen: Finaler Shop oder Endgegner (zu definieren)

## UI-Elemente

### Karten-UI
- Visuelle Darstellung des Pfades
- Raum-Symbole mit Icons
- Spieler-Position (grüner Charakter)
- Legende mit Raum-Typen (rechts im Bild)
- Hintergrund: Dungeon-Atmosphäre mit Nebel

### Combat-UI
- Oberer Bereich: Szenische Darstellung
- Unterer Bereich: Stat-Anzeigen
  - Charakter-Portraits (kreisförmig)
  - HP-Balken (farbcodiert: grün = gesund, rot = verletzt)
  - Namen/Labels
  - Numerische HP-Werte (aktuell / maximum)

### Shop-UI (später zu implementieren)
- Item-Auswahl
- Gold-Anzeige
- Kauf/Verkauf-Optionen
