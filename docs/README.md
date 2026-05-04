# Dungeons & Diplomas Dokumentation

**Stand:** 2026-05-04  
**Quelle:** Abgleich mit Codebase auf Branch `codex/docs-restructure-2026-05-04`

Dieses Verzeichnis ist die zentrale Projekt-Dokumentation. Alte Planungsdokumente bleiben erhalten, sind aber als historisch oder deprecated markiert, wenn sie nicht mehr dem aktuellen Code-Stand entsprechen.

## Schnellstart fuer Projektkontext

1. [Aktueller Projektstatus](./CURRENT_STATUS.md) - was im Code heute vorhanden ist und was offen ist.
2. [Architekturuebersicht](./ARCHITECTURE.md) - Hauptmodule, Datenfluss, APIs und Datenbank.
3. [Aktuelle Roadmap](./Tasks/01_Plans/Current_Roadmap.md) - naechste sinnvolle Arbeitsbloecke.
4. [Historie](./History/) - chronologische Arbeitszusammenfassungen.

## Struktur

```
docs/
├── README.md
├── CURRENT_STATUS.md
├── ARCHITECTURE.md
├── DATABASE_SETUP.md
├── Concepts/
├── History/
├── Tasks/
│   ├── 01_Plans/
│   ├── 02_Backlog/
│   ├── 03_InProgress/
│   └── 04_Archive/
└── spec/
```

## Dokumentationsregeln

- Aktive Plaene liegen in `docs/Tasks/01_Plans/`.
- Konkrete noch nicht gestartete Tasks liegen in `docs/Tasks/02_Backlog/`.
- Nur wirklich aktuell bearbeitete Tasks liegen in `docs/Tasks/03_InProgress/`.
- Abgeschlossene, ersetzte oder veraltete Tasks liegen in `docs/Tasks/04_Archive/`.
- Deprecated-Dokumente werden nicht geloescht. Sie erhalten einen Hinweisblock am Anfang oder werden unter `04_Archive/Deprecated/` abgelegt.
- Projektdokumentation bleibt auf Deutsch. Code, Typen und Commit-Messages bleiben auf Englisch.

## Aktive Dokumente

| Dokument | Zweck |
| --- | --- |
| [CURRENT_STATUS.md](./CURRENT_STATUS.md) | Wahrer Projektzustand nach laengerer Pause |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technische Orientierung fuer Weiterentwicklung |
| [Current_Roadmap.md](./Tasks/01_Plans/Current_Roadmap.md) | Aktualisierte Planungsgrundlage |
| [REFACTORING-PLAN.md](./Tasks/03_InProgress/REFACTORING-PLAN.md) | Weiterhin relevante technische Schulden |
| [UNIT-TEST-CANDIDATES.md](./Tasks/02_Backlog/UNIT-TEST-CANDIDATES.md) | Test-Backlog fuer Kernlogik |
| [Delayed Room Spawn](./Concepts/2025-12-12%20Delayed%20Room%20Spawn.md) | Geplantes Gameplay-Konzept |

## Historische Dokumente

Die urspruengliche MVP-Definition, Initial-Idee und Implementation-Roadmap sind wertvoll fuer Kontext, aber nicht mehr die operative Wahrheit. Der Code hat sich inzwischen von Phaser-Planung und Minimal-Combat deutlich weiterentwickelt: Canvas-Renderer, SQLite/Supabase-Adapter, Dungeon-/Tiletheme-Editor, Shrines, Items, Trashmobs, XP, Highscores und Audio sind vorhanden.
