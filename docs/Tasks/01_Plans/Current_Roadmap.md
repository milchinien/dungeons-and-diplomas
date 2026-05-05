# Aktuelle Roadmap

**Stand:** 2026-05-04  
**Status:** Aktiv - ersetzt nicht die alten Plaene, sondern fasst den aktuellen naechsten Arbeitsstand zusammen.

## Ziel

Nach der laengeren Pause soll zuerst der echte Ist-Stand stabilisiert werden. Danach koennen neue Gameplay-Features auf einer belastbaren Basis entstehen.

## Leitplanken

- Keine direkte Arbeit auf `main`.
- Junior-Tasks muessen klein, klar und testbar sein.
- Code, Typen und Commit-Messages auf Englisch.
- Markdown, Plaene und History auf Deutsch.
- Alte Plaene nicht loeschen, sondern archivieren oder als deprecated markieren.

## Phase A: Wiederaufnahme und Stabilisierung

### A1: Frisches Setup verifizieren

**Ziel:** Ein neuer Entwickler kann das Projekt lokal starten und versteht, welche Env-Variablen optional/noetig sind.

**Umfang:**
- `npm install`
- `npm run type-check`
- `npm run build`
- lokaler Start mit SQLite
- Supabase-Modus mit Env-Variablen pruefen
- README und `DATABASE_SETUP.md` gegen echten Ablauf pruefen

**Akzeptanzkriterien:**
- README-Schritte funktionieren auf einem frischen Checkout.
- SQLite-Modus startet ohne Supabase.
- Vercel/Supabase-Modus ist dokumentiert und wirft keine `better-sqlite3`-Importfehler.

### A2: Supabase-Ende-zu-Ende-Test

**Ziel:** Die am 25.12.2025 implementierte Datenbankabstraktion wird real validiert.

**Umfang:**
- Migrationen in frischem Supabase-Projekt ausfuehren.
- Seed-Fragen pruefen.
- Login, Questions, Answer-Logging, XP, Highscores, Editor-Level und Tiletheme-Routen testen.
- Service-Key/Secret-Key-Verwendung dokumentieren.

**Akzeptanzkriterien:**
- Alle zentralen API-Routen funktionieren im Supabase-Modus.
- Bekannte Abweichungen zwischen SQLite und Supabase sind dokumentiert oder behoben.

## Phase B: Tests und technische Schulden

### B1: Test-Setup etablieren

**Ziel:** Kernlogik kann automatisiert getestet werden.

**Startpunkt:** [UNIT-TEST-CANDIDATES.md](../02_Backlog/UNIT-TEST-CANDIDATES.md)

**Erste Kandidaten:**
- `lib/scoring/EloCalculator.ts`
- `lib/scoring/LevelCalculator.ts`
- `lib/combat/DamageCalculator.ts`
- `lib/dungeon/SeededRandom.ts`
- `lib/spawning/LevelDistribution.ts`

**Akzeptanzkriterien:**
- Test-Runner ist im `package.json` dokumentiert.
- Prio-1-Kandidaten haben Regression-Tests.
- CI- oder lokaler Standardbefehl ist klar.

### B2: Refactoring-Plan fortsetzen

**Ziel:** Grosse Orchestratoren werden schrittweise testbarer, ohne Gameplay zu veraendern.

**Aktuelle Kandidaten:**
- `DungeonView`/Canvas-Komponenten, soweit noch relevant.
- `useCombat` in fokussierte Sub-Hooks aufteilen.
- `GameEngine.updatePlayer` in Movement, Door/Treasure/Shrine-Interaktion zerlegen.
- `DungeonRNG` von globalem State auf instanzbasierte RNG-Pools migrieren.
- Direkte Fetch-Aufrufe und API-Client-Abdeckung pruefen.

**Akzeptanzkriterien:**
- Refactorings sind klein genug fuer Review durch Junior Devs.
- Tests decken extrahierte pure Funktionen ab.
- Keine sichtbaren Gameplay-Regressionen.

## Phase C: Naechstes Gameplay-Feature

### C1: Delayed Room Spawn entscheiden

**Ziel:** Das Konzept vom 12.12.2025 wird entweder umgesetzt oder bewusst verschoben.

**Startpunkt:** [Delayed Room Spawn](../../Concepts/2025-12-12%20Delayed%20Room%20Spawn.md)

**Empfohlene Umsetzung in kleinen Tasks:**
1. `DelayedSpawnManager` ohne Effekte implementieren.
2. Bestehende Start-Spawns fuer Combat-Raeume anpassen.
3. Einfache visuelle Crack-Markierung rendern.
4. Smoke/Particle-Spawn und Audio ergaenzen.
5. Edge-Cases testen: Raum verlassen, mehrere Timer, Restart.

**Akzeptanzkriterien:**
- Gegner spawnen nicht mehr sofort in Combat-Raeumen, sofern das Feature aktiviert ist.
- Startraum bleibt sicher.
- Keine Mehrfachspawns pro Raum.
- Spiel bleibt ohne Spawn-Effekte funktionsfaehig.

### C2: Shrine-System abrunden

**Ziel:** Das bereits vorhandene Shrine-System wird dokumentiert, getestet und balanciert.

**Umfang:**
- Bestehende Shrine-Konzepte mit Code abgleichen.
- Buff-Werte pruefen.
- Spawn- und Completion-Flow testen.
- UX fuer Shrine-Interaktion klaeren.

## Phase D: Content und Produktqualitaet

### D1: Fragen- und Faecherpipeline

**Ziel:** Mehr als Seed-Fragen und bessere Content-Pflege.

**Umfang:**
- Content-Format finalisieren.
- Import-/Seed-Workflow dokumentieren.
- Optional AI-Generation als separates Tool planen.

### D2: Playtest und Balancing

**Ziel:** Nach Stabilisierung echte Spielbarkeit bewerten.

**Messpunkte:**
- Wie lange dauert ein Run?
- Wie oft sterben Spieler an Trashmobs statt Quiz-Combat?
- Sind Items spuerbar?
- Sind ELO-Fragen fair?
- Funktionieren Highscores motivierend?

## Nicht mehr aktuelle Planannahmen

- Phaser ist nicht mehr die aktuelle Game-Engine.
- `Phase1-Task1-BasicCombatScene` ist abgeschlossen/ueberholt und archiviert.
- Supabase ist nicht mehr nur Zukunftsaufgabe; der Adapter existiert, braucht aber Verifikation.
- Der MVP ist nicht mehr nur Combat-Scene + Raumauswahl. Der Code enthaelt bereits deutlich mehr Systeme.
