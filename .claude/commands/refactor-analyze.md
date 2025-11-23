# Refactoring-Analyse

Du führst eine strukturierte Codebase-Analyse durch mit dem Ziel, einen Refactoring-Plan zu erstellen.

## Ziele

1. **Testbarkeit** - Pure Functions, Dependency Injection, klare Interfaces
2. **Wartbarkeit** - Single Responsibility, wenig Kopplung, klare Abhängigkeiten
3. **Lesbarkeit** - Kleine Funktionen, sprechende Namen, konsistente Patterns

## Analyseschritte

### Phase 1: Architektur-Überblick

Erstelle eine kurze Übersicht der Codebasis:
- Ordnerstruktur und Verantwortlichkeiten
- Datenfluss zwischen Modulen
- Zentrale Abhängigkeiten

### Phase 2: Problemidentifikation

Suche systematisch nach:

**Strukturelle Probleme:**
- God-Files (>300 Zeilen mit gemischten Verantwortlichkeiten)
- God-Klassen (>5 verschiedene Aufgaben)
- Zirkuläre Abhängigkeiten
- Prop-Drilling (>3 Ebenen)

**Testbarkeits-Probleme:**
- Funktionen mit Seiteneffekten (fetch, localStorage, DOM)
- Direkte Instanziierung von Abhängigkeiten
- Globaler State ohne Abstraktion
- Fehlende Interfaces für Mocking

**Duplikation:**
- Identische Code-Blöcke an mehreren Stellen
- Ähnliche Patterns ohne Abstraktion
- Kopierte Konstanten

**Komplexität:**
- Funktionen >50 Zeilen
- Tiefe Verschachtelung (>3 Ebenen)
- Komplexe Conditionals

### Phase 3: Refactoring-Kandidaten

Für jeden identifizierten Problembereich:
1. Beschreibe das Problem konkret
2. Nenne betroffene Dateien mit Zeilennummern
3. Schlage eine Lösung vor
4. Bewerte Aufwand (S/M/L) und Risiko (niedrig/mittel/hoch)

## Output-Format

Erstelle eine Datei `docs/Tasks/03_InProgress/REFACTORING-PLAN.md`:

```markdown
# Refactoring-Plan [DATUM]

## Zusammenfassung
[2-3 Sätze zum aktuellen Zustand]

## Architektur-Snapshot
[Kurze Beschreibung der aktuellen Struktur]

## Identifizierte Refactorings

### [R01] [Kurztitel]
**Problem:** [Was ist das Problem?]
**Betroffene Dateien:**
- `pfad/datei.ts:zeilen` - [Beschreibung]

**Lösung:** [Konkreter Ansatz]
**Aufwand:** S/M/L | **Risiko:** niedrig/mittel/hoch

**Schritte:**
1. [Erster Schritt]
2. [Zweiter Schritt]
...

---

### [R02] ...
```

## Regeln

- Keine Änderungen am Code in dieser Phase
- Fokus auf Quick Wins (hoher Impact, niedriges Risiko)
- Max 10 Refactorings pro Durchlauf
- Priorisiere Refactorings die Testbarkeit verbessern
- Dokumentiere Abhängigkeiten zwischen Refactorings

## Temporäre Tests

Falls ein Refactoring riskant ist, beschreibe:
- Welche temporären Tests zur Absicherung sinnvoll wären
- Welches Verhalten getestet werden sollte
- Ob die Tests nach dem Refactoring gelöscht werden können
