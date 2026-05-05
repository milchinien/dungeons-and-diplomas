# Implementation Roadmap - MVP

> **Deprecated / historisch (Stand 2026-05-04):** Diese Roadmap beschreibt die urspruengliche MVP-Implementierungssequenz aus der Phaser-/Combat-Scene-Planung. Der aktuelle Code ist deutlich weiter und nutzt Custom Canvas Rendering statt Phaser. Fuer operative Planung siehe [Current_Roadmap.md](./Current_Roadmap.md). Dieses Dokument bleibt als historischer Kontext erhalten.

## Erstellt
2025-11-17 - Tobias (mit Claude)

## Übersicht
Dieser Plan definiert die Implementierungs-Sequenz für den MVP des Educational Dungeon Crawlers. Die Stories sind bewusst high-level gehalten und werden vor der Umsetzung jeweils im Detail ausgearbeitet.

---

## Phase 0: Foundation & Setup

### Story 0.1: Project Initialization
**Ziel:** Funktionierende Next.js + TypeScript + Phaser Entwicklungsumgebung

**Umfang:**
- Next.js Projekt aufsetzen mit TypeScript
- Phaser 3 Integration als React Component
- Vercel Deployment konfigurieren (automatisches Deployment bei Push)
- Supabase Projekt erstellen und mit Next.js verbinden
- Environment Variables Setup (lokal + Vercel)
- Basic Folder-Struktur etablieren

**Akzeptanzkriterien:**
- Lokaler Dev-Server läuft (`pnpm dev`)
- Phaser-Canvas rendered in Next.js Page
- Vercel Preview-Deployment funktioniert
- Supabase-Connection steht

---

## Phase 1: Core Game Loop (Combat Focus)

### Story 1.1: Basic Combat Scene
**Ziel:** Einfachster Combat-Flow spielbar

**Umfang:**
- Phaser Combat Scene erstellen
- Hardcoded Multiple-Choice-Aufgabe anzeigen (JSON-Mock-Data)
- Spieler kann Antwort wählen → Richtig/Falsch-Feedback
- Einfacher Gegner (statisches Sprite, hardcoded HP)
- Damage-Berechnung: Richtig → Spieler macht Schaden, Falsch → Gegner macht Schaden
- Kampf-Ende-Logik (einer bei 0 HP → Szene endet)

**Akzeptanzkriterien:**
- Ein Kampf ist spielbar von Start bis Ende
- Visuelles Feedback (HP-Bars, Damage-Zahlen)
- Gewinn/Verlust-Zustand erkennbar

### Story 1.2: Timer & Enemy Behavior
**Ziel:** Gegner "löst" Aufgaben mit Timer

**Umfang:**
- Timer-System: Countdown für Gegner-Lösungszeit
- Visueller Fortschrittsbalken für Gegner
- Logik: Spieler muss schneller sein als Timer
- Timer abgelaufen → Gegner "löst richtig" → Spieler nimmt Schaden

**Akzeptanzkriterien:**
- Gegner hat realistisches "Solving"-Verhalten
- Spieler fühlt Zeitdruck

### Story 1.3: Room Selection System
**Ziel:** Nach Kampf zwischen 2-3 nächsten Räumen wählen

**Umfang:**
- Room-Selection-Scene (zeigt 2-3 Türen/Optionen)
- Jede Tür zeigt Gegnertyp (Name + Icon)
- Auswahl führt zu neuem Combat mit entsprechendem Gegner
- Einfaches Difficulty-Scaling (Gegner-HP steigt pro Raum)

**Akzeptanzkriterien:**
- Run läuft nahtlos: Combat → Selection → Combat → ...
- Spieler kann bewusst Gegnertyp wählen

### Story 1.4: Death & Run Reset
**Ziel:** Permadeath + Highscore

**Umfang:**
- Game-Over-Screen bei Spieler-Tod
- Highscore-Tracking (Anzahl Räume geschafft)
- "Restart Run"-Button → zurück zu Raum 1
- Optionaler Highscore-Display (localStorage oder Supabase)

**Akzeptanzkriterien:**
- Spieler kann beliebig viele Runs machen
- Highscore ist persistent

---

## Phase 2: Progression System

### Story 2.1: XP & Level System
**Ziel:** In-Run-Progression durch Level-Ups

**Umfang:**
- XP-Drop bei Gegner-Tod (hardcoded Werte)
- XP-Bar im UI
- Level-Up-Logik (Thresholds: z.B. Level 2 = 50 XP, Level 3 = 150 XP)
- Level-Up-Feedback (Animation, Sound optional)

**Akzeptanzkriterien:**
- Spieler levelt während eines Runs
- Level-Display funktioniert

### Story 2.2: Item Slot System
**Ziel:** Level-Ups schalten Item-Slots frei

**Umfang:**
- Inventory-UI (zeigt Item-Slots, 3 aktiv zu Start)
- Slot-Unlock-Logik bei Level-Ups (Level 2 → 4 Slots, Level 4 → 5 Slots)
- Visuelle Darstellung (locked/unlocked Slots)

**Akzeptanzkriterien:**
- Slots werden durch Level-Ups freigeschaltet
- UI zeigt klar, wie viele Slots verfügbar sind

### Story 2.3: Item Drops & Equip
**Ziel:** Items droppen und ausrüsten

**Umfang:**
- 5 Items definieren (siehe MVP: +Damage, +HP, etc.)
- Item-Drop-Logik nach Kampf (zufälliger Drop)
- Item-Pickup-Screen (Spieler wählt Item oder skippt)
- Equip-Logik: Item in freien Slot setzen
- Item-Effekte anwenden (Stats modifizieren)

**Akzeptanzkriterien:**
- Items droppen nach Kämpfen
- Spieler kann Items ausrüsten und Effekte sind spürbar

### Story 2.4: Enemy Scaling
**Ziel:** Gegner werden pro Raum stärker

**Umfang:**
- Scaling-Formel: HP += 2 pro Raum, Damage += 1 pro Raum, Timer -1s alle 5 Räume
- Unterschiedliche Gegnertypen (Speedster, Tank, Balanced) mit Base-Stats
- Balancing-Tweaks ermöglichen (Config-File oder Supabase)

**Akzeptanzkriterien:**
- Schwierigkeit steigt merklich
- Run ist nicht zu früh unschaffbar (Balancing "gut genug")

---

## Phase 3: Content Pipeline

### Story 3.1: Supabase Schema & Seed Data
**Ziel:** Database-Struktur für Content

**Umfang:**
- Supabase-Tabellen erstellen (siehe Tech Stack: subjects, dungeons, questions, enemy_types, items)
- Seed-Script für Test-Daten (z.B. 2 Fächer, 2 Dungeons, 50 Aufgaben)
- TypeScript Types generieren (Supabase CLI)

**Akzeptanzkriterien:**
- Tabellen existieren in Supabase
- Seed-Daten sind abrufbar
- Types sind im Code verwendbar

### Story 3.2: Question Loading from DB
**Ziel:** Aufgaben aus Supabase laden statt Hardcoded

**Umfang:**
- Supabase-Query: Aufgaben für gewählten Dungeon laden
- Question-Pool-Logik: Zufällige Aufgaben ziehen ohne Wiederholung (im Run)
- Fallback: Wenn Pool leer → Error-Handling (später: Auto-Regenerierung)

**Akzeptanzkriterien:**
- Combat Scene lädt echte Aufgaben aus DB
- Kein Hardcoding mehr

### Story 3.3: AI Content Generation Script
**Ziel:** Script zum Generieren von Aufgaben via AI

**Umfang:**
- CLI-Script: `npm run generate-questions -- --dungeon=mathe-basic --count=100`
- OpenAI/Claude API Integration
- Prompt-Engineering für strukturierte Question-Generierung
- Validation + Insert in Supabase
- Error-Handling (API-Fehler, Rate-Limits)

**Akzeptanzkriterien:**
- Script generiert + speichert 100 Aufgaben
- Aufgaben sind korrekt formatiert (4 Optionen, correct_index valide)

---

## Phase 4: Overworld & Navigation

### Story 4.1: Overworld Map UI
**Ziel:** Fächer-Auswahl im Hauptmenü

**Umfang:**
- Overworld-Scene oder React-Page mit Fächer-Übersicht
- 2 aktive Fächer (Mathe, Physik)
- Weitere Fächer als "Coming Soon" (grayed out)
- Auswahl eines Fachs führt zu Dungeon-Auswahl

**Akzeptanzkriterien:**
- Spieler kann zwischen Fächern wählen
- UI ist verständlich

### Story 4.2: Dungeon Selection
**Ziel:** Pro Fach Dungeons auswählen

**Umfang:**
- Dungeon-List-View (zeigt Dungeons des gewählten Fachs)
- 1 spielbarer Dungeon pro Fach
- 2 weitere als "Coming Soon" sichtbar
- Dungeon-Auswahl startet Run mit entsprechendem Content

**Akzeptanzkriterien:**
- Spieler kann Dungeon wählen
- Run lädt korrekte Aufgaben (aus gewähltem Dungeon)

---

## Phase 5: Polish & MVP-Finalisierung

### Story 5.1: Visual Assets Integration
**Ziel:** Low-Poly Art-Style umsetzen

**Umfang:**
- AI-generierte Assets erstellen (Gegner-Sprites, Item-Icons, UI-Elemente)
- Phaser Asset-Loading optimieren
- Backgrounds für Overworld + Combat
- Basic Animations (Tween für Item-Pickups, Transitions)

**Akzeptanzkriterien:**
- Game sieht "fertig" aus (nicht Placeholder-Grafiken)
- Art-Style ist konsistent

### Story 5.2: Audio & Feedback
**Ziel:** Sound-Effekte + Musik

**Umfang:**
- Basic Sound-Effekte (Attack, Level-Up, Item-Pickup, Damage)
- Optional: Hintergrund-Musik (Loop für Combat + Overworld)
- Audio-System Setup (Howler.js oder Phaser Audio)

**Akzeptanzkriterien:**
- Sound-Feedback bei wichtigen Actions
- Musik ist optional togglebar

### Story 5.3: Settings & QoL Features
**Ziel:** User-freundliche Einstellungen

**Umfang:**
- Settings-Page (React): Audio On/Off, Fullscreen Toggle
- Pause-Menü im Combat (ESC → zurück zu Overworld?)
- Tutorial/Onboarding (optional: erste Run zeigt Hints)

**Akzeptanzkriterien:**
- Spieler kann Settings ändern
- Game ist intuitiv bedienbar

### Story 5.4: Balancing & Playtesting
**Ziel:** MVP ist "fun to play"

**Umfang:**
- Playtest-Sessions mit Freunden/Familie
- Balancing-Tweaks basierend auf Feedback (Gegner-Stats, XP-Kurven, Item-Effekte)
- Bug-Fixing
- Performance-Optimierung (Phaser FPS, Asset-Loading)

**Akzeptanzkriterien:**
- Spieler erreichen durchschnittlich 10-15 Räume im ersten Run
- "One more run"-Gefühl entsteht
- Keine Game-Breaking-Bugs

---

## Phase 6: Deployment & Monitoring

### Story 6.1: Production Deployment
**Ziel:** Public verfügbar machen

**Umfang:**
- Vercel Production-Deploy (Custom Domain optional)
- Environment Variables checken (Prod-Keys)
- Supabase Row-Level-Security aktivieren (Public Read-Only für Questions)
- Monitoring Setup (Vercel Analytics)

**Akzeptanzkriterien:**
- Game ist unter Public URL erreichbar
- Performance ist akzeptabel (< 3s Initial Load)

### Story 6.2: Metrics & Feedback Loop
**Ziel:** User-Verhalten verstehen

**Umfang:**
- Analytics-Events tracken (Run Started, Run Ended, Rooms Completed, etc.)
- Optional: Custom Dashboard für Game-Metrics (Supabase Edge Function)
- Feedback-Formular oder Discord-Link für User-Feedback

**Akzeptanzkriterien:**
- Wir sehen, wie viele Runs gespielt werden
- User können Feedback geben

---

## Dependency-Graph (High-Level)

```
Phase 0 (Setup)
    ↓
Phase 1 (Core Loop) → muss komplett fertig sein vor Phase 2
    ↓
Phase 2 (Progression) → kann parallel mit Phase 3 entwickelt werden
    ↓                    ↓
Phase 3 (Content)   Phase 4 (Overworld)
    ↓                    ↓
Phase 5 (Polish) ← beide Phasen müssen fertig sein
    ↓
Phase 6 (Deployment)
```

---

## Geschätzte Aufwände (Rough Estimates)

| Phase | Stories | Geschätzter Aufwand |
|-------|---------|---------------------|
| Phase 0 | 1 Story | 1-2 Tage |
| Phase 1 | 4 Stories | 5-7 Tage |
| Phase 2 | 4 Stories | 4-5 Tage |
| Phase 3 | 3 Stories | 3-4 Tage |
| Phase 4 | 2 Stories | 2-3 Tage |
| Phase 5 | 4 Stories | 5-7 Tage |
| Phase 6 | 2 Stories | 1-2 Tage |
| **Total** | **20 Stories** | **~21-30 Tage** |

*Hinweis: Aufwände sind für ein Team aus 3 Personen geschätzt (1 Senior + 2 Juniors). Tatsächliche Dauer hängt von verfügbarer Zeit pro Woche ab.*

---

## Nächste Schritte

1. **Roadmap Review:** Team bespricht diesen Plan, identifiziert Abhängigkeiten/Risiken
2. **Story Refinement:** Erste Story (0.1) im Detail ausarbeiten
3. **Sprint Planning:** Entscheiden, welche Stories in ersten Sprint kommen
4. **Kickoff:** Los geht's! 🚀

---

## Status
✅ **Implementation Roadmap erstellt** - Bereit für Story Refinement
