# Refactoring-Ausführung

Führe die Refactorings aus dem Plan in `docs/Tasks/03_InProgress/REFACTORING-PLAN.md` durch.
Bereits durchgeführte Refactorings sind markiert.

## Ablauf

1. **Lies den Plan** - Verstehe alle geplanten Refactorings
2. **Prüfe Abhängigkeiten** - Führe abhängige Refactorings in richtiger Reihenfolge aus
3. **Führe schrittweise aus** - Ein Refactoring nach dem anderen
4. **Validiere** - Nach jedem Refactoring: Build prüfen

## Pro Refactoring

### Vor dem Refactoring
- [ ] Verstehe das Ziel des Refactorings
- [ ] Identifiziere alle betroffenen Stellen
- [ ] Falls im Plan beschrieben: Schreibe temporäre Tests

### Während des Refactorings
- [ ] Kleine, atomare Änderungen
- [ ] Keine Feature-Änderungen
- [ ] Keine "Verbesserungen" außerhalb des Plans
- [ ] Behalte Funktionalität exakt bei

### Nach dem Refactoring
- [ ] `npm run build` erfolgreich
- [ ] Temporäre Tests laufen durch (falls vorhanden)
- [ ] Markiere Refactoring im Plan als erledigt

## Regeln

1. **Nur geplante Refactorings** - Keine spontanen Änderungen
2. **Ein Refactoring pro Commit** - Klare Nachvollziehbarkeit
3. **Keine neuen Features** - Nur strukturelle Verbesserungen
4. **Bei Fehlern: Stopp** - Dokumentiere das Problem im Plan

## Abschluss

Nach Abschluss aller Refactorings:
1. Verschiebe `REFACTORING-PLAN.md` nach `docs/Tasks/04_Archive/`
2. Aktualisiere `CLAUDE.md` falls sich Architektur geändert hat
3. Lösche temporäre Test-Dateien (falls nicht zur Absicherung behalten)

## Commit-Format

```
refactor: [R0X] [Kurztitel]

[Optionale Details]
```
