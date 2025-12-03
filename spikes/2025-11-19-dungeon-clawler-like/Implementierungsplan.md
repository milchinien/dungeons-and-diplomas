# Implementierungsplan - Dungeon Crawler Spike (React)

## Projekt-Übersicht

**Typ**: Reiner Spike - komplett neue Anwendung von Null
**Tech Stack**: React + TypeScript (KEINE Game Engine wie Phaser)
**Design-Philosophie**: Pixel-perfekte Umsetzung der Screenshots (Combat-Raum.png, Karte.png)
**Ziel**: Vollständiges, spielbares Dungeon Crawler Spiel mit Mathe-Aufgaben

---

## Phase 0: Projekt-Setup & Grundstruktur

### 0.1 React-Projekt initialisieren
- [ ] Neues React-Projekt mit Vite erstellen (`npm create vite@latest dungeon-crawler -- --template react-ts`)
- [ ] Projekt-Struktur aufsetzen:
  - `components/` - React-Komponenten (map, combat, ui, rooms)
  - `contexts/` - React Context für State Management
  - `hooks/` - Custom React Hooks
  - `types/` - TypeScript Type Definitions
  - `data/` - Game Data (Gegner, Items, etc.)
  - `utils/` - Utility-Funktionen
  - `styles/` - Globale Styles & Theme
  - `assets/` - Bilder, Icons, Fonts

### 0.2 Dependencies installieren
- [ ] Core-Dependencies:
  - `react`, `react-dom`
  - `typescript`
  - `vite`
- [ ] Styling:
  - `styled-components` oder `@emotion/react` (für Component Styling)
  - Optional: `tailwindcss` (für Utility Classes)
- [ ] Animation:
  - `framer-motion` (für smooth Animationen)
- [ ] State Management:
  - `zustand` (leichtgewichtige Alternative zu Redux) ODER React Context

### 0.3 Basis-Konfiguration
- [ ] TypeScript `tsconfig.json` konfigurieren (strict mode)
- [ ] ESLint & Prettier setup
- [ ] Git initialisieren (falls noch nicht geschehen)
- [ ] `.gitignore` anpassen

---

## Phase 1: Design-System & UI-Grundlagen

### 1.1 Design-Tokens & Theme
**Referenz**: Beide Screenshots analysieren für Farben, Spacing, Fonts

- [ ] Farb-Palette extrahieren:
  - Background: #4a4a4a (Grau-Ton aus Screenshots)
  - Stone: #666666 (Steinmauern)
  - Torch Fire: #ff9933 (Fackel-Feuer)
  - Player Green: #00ff00 (Spieler-Farbe)
  - Enemy Green: #33cc66 (Goblin-Grün)
  - HP Green: #00ff00 (Gesundheits-Balken)
  - HP Red: #ff0000 (Schaden-Balken)
  - HP Background: #ffffff (HP-Bar Hintergrund)
  - Gold: #ffcc00 (Schatz-Gold)
  - Shop Blue: #6699cc (Shop-Icon)
  - Boss Red: #cc3333 (Boss-Rot)
  - UI Dark: #2a2a2a (UI-Hintergrund)
  - Border: #1a1a1a (Rahmen)

- [ ] Spacing-System definieren (8px grid: 4, 8, 16, 24, 32, 48, 64)
- [ ] Typography-System:
  - Pixel-Font recherchieren oder ähnliche Monospace-Font
  - Font-Sizes: 12px, 14px, 16px, 20px, 24px
- [ ] Border-Radius, Shadows definieren

### 1.2 Layout-Komponenten
- [ ] `<GameContainer>`: Haupt-Wrapper mit fester Größe (z.B. 1280x720px)
- [ ] `<PixelBorder>`: Wiederverwendbare Komponente für Pixel-Art-Rahmen
- [ ] `<Panel>`: UI-Panel mit Hintergrund und Rahmen

### 1.3 Icon-System
**Wichtig**: Icons müssen visuell zu Screenshots passen

- [ ] Icon-Komponenten erstellen (SVG oder Canvas):
  - `<DoorIcon>` - Eingang (braune Tür)
  - `<SwordIcon>` - Gegner-Raum (rotes Schwert)
  - `<MonsterIcon>` - Boss-Raum (rotes Monster)
  - `<ChestIcon>` - Schatzraum (gelbe Truhe)
  - `<CoinIcon>` - Shop (blaues Münz-Icon)
  - `<StairsIcon>` - Ausgang (Graph/Treppe)
  - `<TorchIcon>` - Fackel für Dungeon-Atmosphäre

---

## Phase 2: Game State Management

### 2.1 Type Definitions
- [ ] Core Types definieren:
  - RoomType Enum: ENTRANCE, COMBAT, BOSS, TREASURE, SHOP, EXIT
  - GameScene Enum: MAP, COMBAT, TREASURE, SHOP
  - Room Interface: id, type, position, connections, cleared
  - Enemy Interface: id, name, maxHp, currentHp, damage, isBoss
  - Player Interface: maxHp, currentHp, gold, inventory
  - Floor Interface: level, rooms, currentRoomId
  - MathQuestion Interface: question, correctAnswer, options (optional)
  - GameState Interface: scene, player, currentFloor, currentEnemy, currentQuestion

### 2.2 Zustand Management Setup
**Option A: Zustand (empfohlen für diesen Spike)**

- [ ] `GameStore` erstellen mit Actions:
  - setScene, movePlayer, enterRoom
  - answerQuestion, damageEnemy, damagePlayer
  - collectLoot, buyItem
  - nextFloor, resetGame

**Option B: React Context**
- [ ] `GameContext` erstellen mit Provider und Custom Hooks

### 2.3 Persistierung (optional)
- [ ] LocalStorage Integration für Spielstand-Speicherung
- [ ] Save/Load Funktionalität

---

## Phase 3: Karten-System (MapScene)

### 3.1 Map-Layout-Komponente
**Referenz**: Karte.png - visuell exakt nachbilden

- [ ] `<MapScene>` Haupt-Komponente:
  - Hintergrund: Grauer Dungeon mit Nebel-Effekt
  - Wolken-Parallax-Effekt (optional)
  - Feste Layout-Struktur für Räume

- [ ] `<RoomNode>` Komponente:
  - Props: room, isActive, isCleared, onClick
  - Rechteckiger Rahmen mit abgerundeten Ecken
  - Icon zentriert (basierend auf RoomType)
  - Visuelle Zustände:
    - Aktiv (Spieler ist hier): Highlight/Glow-Effekt
    - Cleared: Grau/Ausgegraut
    - Locked: Dunkel, nicht klickbar
    - Available: Normal, klickbar bei Verzweigung

- [ ] `<PathLine>` Komponente:
  - Verbindungslinien zwischen Räumen (gestrichelt oder durchgezogen)
  - SVG-Pfade für geschwungene Linien

### 3.2 Player-Position auf Karte
- [ ] `<PlayerMarker>` Komponente:
  - Grüner Kreis mit Gesicht (wie in Karte.png)
  - Position animiert bei Bewegung
  - Framer Motion für smooth Transitions

### 3.3 Map-Navigation
- [ ] Tastatur-Steuerung implementieren (useKeyboardNavigation Hook):
  - A-Taste: moveLeft()
  - D-Taste: moveRight()
  - Event Listener für keydown

- [ ] Bewegungs-Logik:
  - Nur zu verbundenen Räumen bewegen
  - Bei Gegner-/Boss-Raum: Automatisch zu CombatScene wechseln
  - Bei Schatzraum: Zu TreasureScene wechseln
  - Bei Shop: Zu ShopScene wechseln
  - Bei Exit: Nächste Etage generieren

### 3.4 Map-Legende
- [ ] `<MapLegend>` Komponente (rechts unten):
  - Liste aller Raum-Typen mit Icons und Namen
  - Styling wie in Karte.png (halbtransparenter Hintergrund)

### 3.5 Pfad-Verzweigung
- [ ] `<PathChoice>` Overlay:
  - Modal/Overlay wenn Spieler an Verzweigung ankommt
  - "Oben" vs "Unten" Button
  - Nach Auswahl: Pfad wird "locked" (nur gewählter Pfad begehbar)

---

## Phase 4: Combat-System (CombatScene)

### 4.1 Combat-Layout
**Referenz**: Combat-Raum.png - visuell exakt nachbilden

- [ ] `<CombatScene>` Haupt-Komponente:
  - Zweigeteilt: Oberer Dungeon-Bereich + Unterer UI-Bereich

### 4.2 Dungeon-Darstellung (Oberer Bereich)
- [ ] `<DungeonView>` Komponente:
  - Hintergrund: Graue Steinmauern mit Rissen
  - `<WallBlock>` Komponenten für Mauersteine (gestapelt)
  - `<Torch>` Komponenten an Wänden (animiertes Feuer)
  - `<Fence>` Komponente (Holzzaun in der Mitte)

- [ ] `<PlayerCharacter>` Sprite:
  - Links positioniert
  - Strichmännchen mit Waffe/Werkzeug
  - Idle-Animation (leichtes Wippen)
  - Attack-Animation bei richtiger Antwort

- [ ] `<EnemyCharacter>` Sprite:
  - Rechts positioniert
  - Verschiedene Gegner-Typen (Goblin, etc.)
  - Idle-Animation
  - Hurt-Animation bei Schaden
  - Death-Animation bei 0 HP

### 4.3 Combat-UI (Unterer Bereich)
- [ ] `<CombatUI>` Container:
  - Dunkler Hintergrund mit Steinmauer-Textur
  - Zweispaltig: Spieler links, Gegner rechts

- [ ] `<CharacterPanel>` Komponente (wiederverwendbar):
  - Props: name, currentHp, maxHp, portrait, isPlayer
  - Kreisförmiges Portrait (Charakter-Icon)
  - Name-Label ("ICH" für Spieler, Gegner-Name)
  - HP-Bar mit numerischer Anzeige
  - Farbcodierung: Grün (Spieler/gesund), Rot (Gegner/verletzt)

- [ ] `<HPBar>` Komponente:
  - Props: current, max, color
  - Äußerer Rahmen (Border)
  - Innerer farbiger Balken (width: percentage)
  - Text-Overlay: "X / Y"
  - Animierte Übergänge bei HP-Änderung (Framer Motion)

### 4.4 Mathe-Aufgaben System
- [ ] `<MathQuestion>` Komponente:
  - Zentriert angezeigt (Overlay oder unterhalb Combat-UI)
  - Große Schrift für Frage
  - Input-Feld oder Multiple-Choice-Buttons
  - Submit-Button

- [ ] Mathe-Generator (utils/mathGenerator.ts):
  - Difficulty Enum: EASY, MEDIUM, HARD
  - EASY: Addition/Subtraktion (1-20) für normale Gegner
  - MEDIUM: Multiplikation (1-10) für höhere Etagen
  - HARD: Division, größere Zahlen für Boss
  - generateQuestion() Funktion

- [ ] Antwort-Validierung:
  - Bei richtiger Antwort: Schaden an Gegner (z.B. 20 HP)
  - Bei falscher Antwort: Schaden an Spieler (optional, z.B. 10 HP)
  - Neue Frage generieren

### 4.5 Combat-Flow
- [ ] Kampf-Zustände verwalten:
  - CombatState Enum: QUESTION_ACTIVE, PLAYER_ATTACK, ENEMY_ATTACK, VICTORY, DEFEAT

- [ ] Animations-Sequenz:
  1. Frage anzeigen
  2. Spieler antwortet
  3. Bei richtig: Attack-Animation → Schaden → HP-Bar Update
  4. Bei falsch (optional): Enemy-Attack → Schaden → HP-Bar Update
  5. Check: Ist Gegner tot? → Victory
  6. Check: Ist Spieler tot? → Defeat
  7. Neue Frage oder Ende

- [ ] Victory-Screen:
  - "Sieg!" Nachricht
  - Belohnungen anzeigen (Gold, Items)
  - "Weiter" Button → Zurück zur Karte

- [ ] Defeat-Screen:
  - "Niederlage!" Nachricht
  - "Neustart" Button → Game zurücksetzen

---

## Phase 5: Raum-Implementierungen

### 5.1 Boss-Raum
- [ ] Boss-Daten definieren (data/bosses.ts):
  - Goblin King: 150 HP, 15 Damage
  - Dark Wizard: 200 HP, 20 Damage
  - Weitere Boss-Typen

- [ ] Boss-spezifische Features:
  - Höhere HP als normale Gegner
  - Schwierigere Mathe-Aufgaben (HARD difficulty)
  - Bessere Loot-Drops
  - Spezielles Boss-Portrait/Sprite

- [ ] Combat-Scene erweitern für Boss-Fights:
  - Visuell anderer Hintergrund oder Effekte (optional)
  - Boss-Theme (optional, wenn Sound)

### 5.2 Schatzraum (TreasureScene)
- [ ] `<TreasureScene>` Komponente:
  - Dungeon-Hintergrund ähnlich Combat
  - Große Schatztruhe in der Mitte
  - Öffnungs-Animation (Deckel öffnet sich)

- [ ] Loot-System (utils/lootGenerator.ts):
  - generateLoot() Funktion
  - Gold-Berechnung basiert auf Floor-Level
  - Items-Array für spätere Erweiterung

- [ ] Loot-Anzeige:
  - Items visuell darstellen
  - Gold-Menge anzeigen
  - "Einsammeln" Button → Items zum Inventar, Gold zu Player-Gold
  - Zurück zur Karte

### 5.3 Shop (ShopScene)
- [ ] `<ShopScene>` Komponente:
  - Shop-Keeper NPC (optional)
  - Item-Grid zur Anzeige

- [ ] Shop-Items definieren (data/items.ts):
  - Item Interface: id, name, description, price, effect
  - ItemEffect Enum: HEAL, MAX_HP, DAMAGE_BOOST, SHIELD
  - Effekt-Beschreibungen

- [ ] `<ShopItem>` Komponente:
  - Item-Icon, Name, Preis
  - "Kaufen" Button (disabled wenn nicht genug Gold)
  - Kaufen-Logik: Gold abziehen, Item zu Inventar

- [ ] Player-Gold Anzeige oben
- [ ] "Weiter" Button → Nächste Etage oder Karte

---

## Phase 6: Etagen-System & Prozeduale Generierung

### 6.1 Floor-Generator
- [ ] `generateFloor()` Funktion (utils/floorGenerator.ts):
  - Feste Struktur wie in Karte.png:
    1. Entrance
    2. Combat
    3. Combat (vor Verzweigung)
    4a. Combat (oben) → Treasure
    4b. Combat (unten) → Boss
    5. Shop (Zusammenführung)
    6. Exit
  - Später: Variationen, mehr Räume, random Verzweigungen
  - Return: Floor mit level, rooms, currentRoomId

### 6.2 Schwierigkeits-Skalierung
- [ ] Gegner-HP skalieren mit Floor-Level:
  - maxHp = baseHp + (floorLevel * 10)
  - damage = baseDamage + (floorLevel * 2)

- [ ] Mathe-Aufgaben schwieriger machen:
  - Floor 1-2: Addition/Subtraktion (1-20)
  - Floor 3-4: Multiplikation (1-10)
  - Floor 5+: Division, größere Zahlen

- [ ] Bessere Loot-Drops bei höheren Etagen

### 6.3 Floor-Transition
- [ ] `<FloorTransition>` Komponente:
  - "Etage X abgeschlossen!"
  - "Betretet Etage Y..."
  - Fade-Animation
  - Nach 2-3 Sekunden: Neue Karte generieren und anzeigen

### 6.4 Finales Ziel
- [ ] Finale Etage definieren (z.B. Floor 10)
- [ ] Finaler Boss mit hoher HP
- [ ] Victory-Screen bei Endboss-Sieg:
  - "Glückwunsch! Spiel abgeschlossen!"
  - Statistiken (Zeit, Floors, Gegner besiegt, etc.)
  - "Neustart" Button

---

## Phase 7: Items & Inventar

### 7.1 Inventar-System
- [ ] Player-State um Inventar erweitern
- [ ] `<Inventory>` Komponente (Overlay/Modal):
  - Liste aller Items
  - "Benutzen" Button für Verbrauchsgegenstände
  - Tastenkombination zum Öffnen (z.B. "I")

### 7.2 Item-Effekte
- [ ] Item-Usage implementieren (utils/itemEffects.ts):
  - useItem() Funktion
  - HEAL: +30 HP (max: maxHp)
  - MAX_HP: +20 Max HP und Current HP
  - Switch-Case für alle ItemEffect-Typen

### 7.3 Item-Drops bei Gegner-Sieg
- [ ] Chance auf Item-Drop nach Kampf (z.B. 20%)
- [ ] Items zur Loot-Anzeige hinzufügen

---

## Phase 8: Polish & Details

### 8.1 Animationen
- [ ] Framer Motion Animationen:
  - Szenen-Übergänge (fade in/out)
  - Spieler-Bewegung auf Karte (slide)
  - HP-Bar Änderungen (spring animation)
  - Charakter-Angriffe (shake, scale)
  - Item-Pickup (bounce)

- [ ] CSS-Animationen:
  - Fackel-Flackern (`@keyframes flicker`)
  - Nebel-Bewegung im Hintergrund
  - Button-Hover-Effekte

### 8.2 Partikel-Effekte (optional)
- [ ] Simple Partikel-Library oder eigene Implementation:
  - Schaden-Zahlen (floating numbers)
  - Blut-Spritzer (bei Gegner-Schaden)
  - Sterne/Funken (bei Level-Up oder Loot)
  - Rauch von Fackeln

### 8.3 Sound & Musik (optional)
- [ ] Sound-Effekte:
  - Button-Click
  - Tür-Öffnen
  - Schwert-Schlag
  - Gegner-Schrei
  - Loot-Aufheben
  - Kauf im Shop

- [ ] Hintergrund-Musik:
  - Map-Theme (ruhig)
  - Combat-Theme (actionreich)
  - Boss-Theme (episch)

### 8.4 Responsive Design
- [ ] Scaling-Logik für verschiedene Bildschirmgrößen:
  - Feste Spielgröße (z.B. 1280x720)
  - Skaliert proportional wenn Fenster kleiner
  - scale = min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT)

### 8.5 UI-Verbesserungen
- [ ] Pause-Menü:
  - "P" zum Pausieren
  - "Fortsetzen", "Neustart", "Optionen"

- [ ] Game-Over-Screen:
  - Statistiken anzeigen
  - "Nochmal versuchen" Button

- [ ] Tutorial/Anleitung:
  - Erste Etage: Tooltips für Steuerung
  - Erste Kampf: Erklärung der Mathe-Aufgaben

### 8.6 Accessibility
- [ ] Tastatur-Navigation für alle Elemente
- [ ] Screen-Reader Support (ARIA-Labels)
- [ ] Farbblindheit-Modi (optional)

---

## Phase 9: Testing & Debugging

### 9.1 Unit Tests
- [ ] Utility-Funktionen testen:
  - `mathGenerator.ts`
  - `floorGenerator.ts`
  - `lootGenerator.ts`
  - `itemEffects.ts`

### 9.2 Component Tests
- [ ] Key-Components testen:
  - `<HPBar>` rendert korrekt mit verschiedenen Werten
  - `<RoomNode>` zeigt korrektes Icon
  - `<MathQuestion>` validiert Antworten korrekt

### 9.3 Integration Tests
- [ ] Game-Flow testen:
  - Bewegung auf Karte → Kampf → Sieg → Zurück zur Karte
  - Shop-Kauf funktioniert
  - Etagen-Wechsel funktioniert

### 9.4 Playtesting
- [ ] Komplettes Spiel durchspielen
- [ ] Balance-Anpassungen:
  - Sind Gegner zu stark/schwach?
  - Sind Mathe-Aufgaben zu leicht/schwer?
  - Ist genug Gold verdienbar?

### 9.5 Performance-Optimierung
- [ ] React DevTools Profiler nutzen
- [ ] Unnötige Re-Renders vermeiden (React.memo, useMemo, useCallback)
- [ ] Lazy Loading für Komponenten

---

## Phase 10: Deployment & Dokumentation

### 10.1 Build & Deployment
- [ ] Production Build erstellen (`npm run build`)
- [ ] Build optimieren (Code-Splitting, Tree-Shaking)
- [ ] Deployen (z.B. GitHub Pages, Vercel, Netlify)

### 10.2 Dokumentation
- [ ] README.md erstellen:
  - Spielbeschreibung
  - Steuerung
  - Installation & Start
  - Tech Stack

- [ ] Code-Dokumentation:
  - JSDoc für komplexe Funktionen
  - Inline-Kommentare für nicht-offensichtliche Logik

### 10.3 Repository-Setup
- [ ] GitHub Repository erstellen (falls nicht Teil des Hauptprojekts)
- [ ] License hinzufügen
- [ ] Contributing Guidelines (optional)

---

## Erweiterte Features (Post-MVP)

Falls Zeit/Interesse für weitere Features:

- [ ] **Verschiedene Charakter-Klassen** (Krieger, Magier, etc.) mit unterschiedlichen Fähigkeiten
- [ ] **Skill-Tree / Level-System** für Spieler-Progression
- [ ] **Mehr Gegner-Typen** mit besonderen Fähigkeiten
- [ ] **Permanente Upgrades** (Meta-Progression zwischen Runs)
- [ ] **Daily Challenges** mit speziellen Modifikatoren
- [ ] **Leaderboard** für schnellste Durchläufe
- [ ] **Achievements** System
- [ ] **Verschiedene Schwierigkeitsgrade**
- [ ] **Multiplayer** (Turn-Based Co-Op)
- [ ] **Mobile Version** mit Touch-Steuerung

---

## Technische Notizen & Best Practices

### Code-Organisation
- **Komponenten**: Klein und fokussiert halten, Single Responsibility
- **State**: So lokal wie möglich, nur globaler State wenn nötig
- **Types**: Strenge Typisierung, keine `any` verwenden
- **Naming**: Klare, beschreibende Namen (englisch)

### Performance
- Framer Motion Animationen mit `useReducedMotion` Hook respektieren
- Große Listen virtualisieren (falls viele Items)
- Bilder optimieren (WebP, lazy loading)

### Design-Treue
- **Absolut kritisch**: Screenshots als Referenz verwenden
- Pixel-perfektes Layout (Figma/Photoshop zur Vermessung nutzen optional)
- Farben exakt matchen (Eyedropper-Tool)
- Proportionen beibehalten

### Git-Workflow
- Feature-Branches für jede Phase/Feature
- Commits in englisch, aussagekräftig
- Regelmäßig committen (kleine, logische Einheiten)

---

## Geschätzte Implementierungs-Reihenfolge

**Empfohlene Reihenfolge für maximale Effizienz:**

1. **Phase 0** → Projekt-Setup
2. **Phase 1** → Design-System (Farben, Icons erstmal als Platzhalter)
3. **Phase 2** → Game State Management (Types, Store)
4. **Phase 3.1-3.3** → Basis Map-Layout mit Navigation (ohne Verzweigung)
5. **Phase 4.1-4.3** → Combat-Layout und UI (ohne Logik)
6. **Phase 4.4-4.5** → Combat-Logik und Mathe-Aufgaben
7. **Phase 3.4-3.5** → Map-Legende und Verzweigung
8. **Phase 6.1** → Basis Floor-Generator (feste Struktur)
9. **Phase 5.2** → Schatzraum
10. **Phase 5.1** → Boss-Raum
11. **Phase 5.3** → Shop
12. **Phase 6.2-6.4** → Schwierigkeits-Skalierung und Etagen-Wechsel
13. **Phase 7** → Items & Inventar
14. **Phase 8** → Polish (Animationen, Sound)
15. **Phase 1** (revisit) → Icons & Design verfeinern zu Screenshot-Qualität
16. **Phase 9** → Testing
17. **Phase 10** → Deployment

**Grund für diese Reihenfolge:**
- Früh spielbare Version (nach Schritt 6)
- Iteratives Verfeinern statt perfektionistisches Blockieren
- Design-Polish am Ende, wenn Funktionalität steht
- Core-Loop zuerst (Map → Combat → Map)

---

## Checkliste für "Fertig"

Das Spiel ist fertig, wenn:

- [x] Alle Phasen 0-6 abgeschlossen (Kern-Gameplay)
- [x] Design entspricht Screenshots (>90% Ähnlichkeit)
- [x] Kompletter Durchlauf ohne Bugs möglich
- [x] Mindestens 5 Etagen spielbar
- [x] Alle Raum-Typen funktionieren
- [x] Mathe-Aufgaben funktionieren korrekt
- [x] Responsive (skaliert auf verschiedene Bildschirmgrößen)
- [x] Code ist sauber und dokumentiert
- [x] Deployed und spielbar im Browser

---

## Fragen für Klärung vor Start

Vor Beginn der Implementierung klären:

1. **Zielgruppe/Schwierigkeit**: Welche Altersgruppe? (bestimmt Mathe-Schwierigkeit)
2. **Spieldauer**: Soll ein Durchlauf 10min oder 1h dauern? (beeinflusst Anzahl Etagen)
3. **Priorität**: Funktionalität > Design oder Design > Features?
4. **Browser-Support**: Nur moderne Browser oder auch Legacy?
5. **Mobile**: Muss es auf Mobile funktionieren oder nur Desktop?

---

**Status**: Bereit für Implementierung ✓
