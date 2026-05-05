# Aktueller Projektstatus

**Stand:** 2026-05-04  
**Letzter dokumentierter Arbeitsstand:** 2025-12-25  
**Letzter Git-Commit vor Dokumentationsupdate:** `382b25e` - Merge `origin/main` in `feature/deployment`

## Kurzfazit

Das Projekt ist kein einfacher Phaser-MVP mehr. Der aktuelle Root-Stand ist eine Next.js-App mit eigenem Canvas-Renderer, prozeduralem Dungeon, Echtzeit-Bewegung, Quiz-Combat, Trashmobs, Items, XP, Highscores, Shrine-System, Level-Editor, Tiletheme-Editor und Datenbank-Adapter fuer SQLite/Supabase.

Die groesste Diskrepanz liegt in der Dokumentation: mehrere alte Plaene beschreiben noch den urspruenglichen Phaser-Combat-MVP oder behandeln Supabase als Zukunftsaufgabe, obwohl der Adapter-Layer inzwischen implementiert ist.

## Aktuell im Code vorhanden

- Next.js 14 App Router mit React 18 und TypeScript.
- Custom Canvas Game Loop statt Phaser.
- Automatischer Spielstart nach Login.
- Lokaler SQLite-Betrieb mit `better-sqlite3`.
- Supabase-Adapter fuer Vercel/Production ueber `NEXT_PUBLIC_SUPABASE_URL` und `SUPABASE_SECRET_KEY` oder `SUPABASE_SERVICE_ROLE_KEY`.
- API-Routen fuer Auth, Fragen, Antworten, ELO, Stats, XP, Highscores, Editor-Level und Tiletheme-Daten.
- BSP-basierte Dungeon-Generierung mit Seeds und Theme-Rendering.
- Fog of War, Minimap, Tueren, Raumzustaende und Raumuebergaenge.
- Quiz-Combat mit Timer, ELO-basierter Fragenauswahl und Antwort-Logging.
- Melee-Angriff per Maus gegen Trashmobs.
- Trashmob-Typen: Rat, Slime, Bat.
- Quiz-Gegner mit unterschiedlichen Sprites aus `ENEMY_TYPES`.
- Shrine-System mit Buff-Auswahl und Shrine-Gegnern.
- Item-Drops, Inventar, Equipment-Boni und Item-Drop-Notification.
- XP-System, Level-Anzeige und Highscore-Speicherung.
- Audio-Einstellungen, Schrittgeraeusche und Hintergrundmusik-Clips.
- Level-Editor und Tilemap-/Theme-Editor.
- Supabase-Migrationen fuer Users, Questions, Answer Log, XP Log, Highscores, Editor Levels und Tiletheme-Tabellen.

## Wichtige Einschraenkungen

- Authentifizierung ist weiterhin Username-only und nicht produktionsreif.
- Spielzustand, Combat-Ergebnisse und Dungeon-State sind clientseitig vertrauensbasiert.
- Supabase-Adapter ist implementiert, sollte aber vor echtem Deployment einmal Ende-zu-Ende gegen ein frisches Supabase-Projekt geprueft werden.
- `README.md` und mehrere alte Planungsdateien waren vor diesem Update veraltet.
- Automatisierte Tests sind nicht sichtbar etabliert; der Backlog fuer Unit-Test-Kandidaten existiert.
- Der alte InProgress-Task `Phase1-Task1-BasicCombatScene` war deprecated und wurde archiviert.

## Letzter Arbeitsmonat

### 2025-11-24 bis 2025-11-27

- Item-Drops, Loot-Generation, Inventar und Equipment-Boni.
- Spike-Struktur in Root migriert.
- Unit-Test-Kandidaten dokumentiert.
- Skeleton-Gegner und Asset-Fixes.

### 2025-12-03

- Optionsmenue, Audio-Einstellungen und Schrittgeraeusche.
- Erste Trashmob-KI.

### 2025-12-10 bis 2025-12-12

- Trashmob-Ausbau, Pixel-Gegner und Unterschiede zwischen Mob-Typen.
- Highscore-Tracking mit API.
- Partikel, Screen-Shake und Raumuebergaenge.
- Konzept fuer verzögertes Raum-Spawning erstellt.

### 2025-12-16 bis 2025-12-25

- Sword-Icons, DungeonSelectMenu-Fortschritt und spaeter direkter Spielstart nach Login.
- Bugfixes: Unsterblichkeit, zufaelliger Schaden, Alt-Tab-DT-Cap, Ratten-Pathing.
- Supabase-Abstraktionslayer und mehrere Vercel-Deployment-Fixes.
- Theme-API-Caching und Cache-Invalidation.

## Wahrscheinlich naechste sinnvolle Arbeit

1. Deployment/Supabase auf einem frischen Setup verifizieren.
2. Dokumentierte Roadmap als Team bestaetigen.
3. Testbasis fuer Kernlogik aufsetzen und Prio-1-Tests aus dem Backlog implementieren.
4. `Delayed Room Spawn` als naechstes Gameplay-Feature umsetzen oder bewusst zurueckstellen.
5. Refactoring-Plan fortsetzen, besonders `DungeonView`, `useCombat`, `GameEngine.updatePlayer` und RNG-State.
