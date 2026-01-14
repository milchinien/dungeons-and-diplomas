# Shop-Feature: Task-Übersicht

**Feature:** Shop-Räume im Dungeon
**Anzahl Tasks:** 17
**Geschätzte Gesamtdauer:** 20-30 Stunden

---

## Reihenfolge der Tasks

Die Tasks sind so nummeriert, dass sie in der angegebenen Reihenfolge abgearbeitet werden können. Jeder Task ist selbstständig und enthält alle nötigen Informationen.

---

## Phase 1: Grundlagen (SHOP-01 bis SHOP-05)

| Task | Name | Dauer | Abhängigkeiten |
|------|------|-------|----------------|
| **SHOP-01** | Seltenheitssystem erstellen | 1-2h | Keine |
| **SHOP-02** | Item-System erstellen | 1-2h | SHOP-01 |
| **SHOP-03** | Perk-System erstellen | 1-2h | SHOP-01 |
| **SHOP-04** | Shop-Inventar-System | 1h | SHOP-02, SHOP-03 |
| **SHOP-05** | Konstanten & Player erweitern | 1h | SHOP-01, SHOP-02, SHOP-03 |

**Ergebnis:** Alle Datenstrukturen und Typen sind definiert.

---

## Phase 2: Dungeon-Integration (SHOP-06 bis SHOP-09)

| Task | Name | Dauer | Abhängigkeiten |
|------|------|-------|----------------|
| **SHOP-06** | Dungeon-Generierung erweitern | 1-2h | SHOP-04, SHOP-05 |
| **SHOP-07** | Shop-Layout berechnen | 1h | SHOP-05 |
| **SHOP-08** | Tresen-Kollision | 30-45min | SHOP-07 |
| **SHOP-09** | Shop-Tür-Mechanik | 1-2h | SHOP-06 |

**Ergebnis:** Shop-Räume werden generiert und haben funktionale Türen.

---

## Phase 3: Grafiken (SHOP-11) - Parallel möglich!

| Task | Name | Dauer | Abhängigkeiten |
|------|------|-------|----------------|
| **SHOP-11** | Grafiken und Assets erstellen | 2-4h | Keine |

**Hinweis:** Kann parallel zu Phase 1 & 2 bearbeitet werden!

---

## Phase 4: Rendering (SHOP-10)

| Task | Name | Dauer | Abhängigkeiten |
|------|------|-------|----------------|
| **SHOP-10** | Shop-Raum rendern | 2-3h | SHOP-07, SHOP-11 |

**Ergebnis:** Shops werden visuell korrekt dargestellt.

---

## Phase 5: Interaktion (SHOP-12, SHOP-13)

| Task | Name | Dauer | Abhängigkeiten |
|------|------|-------|----------------|
| **SHOP-12** | Tooltips & Interaktion | 1-2h | SHOP-07, SHOP-10 |
| **SHOP-13** | Kauf-System | 2h | SHOP-12, SHOP-05 |

**Ergebnis:** Spieler kann Items und Perks kaufen.

---

## Phase 6: Spiellogik (SHOP-14, SHOP-15)

| Task | Name | Dauer | Abhängigkeiten |
|------|------|-------|----------------|
| **SHOP-14** | Effekte im Kampf | 1-2h | SHOP-13 |
| **SHOP-15** | Gegner-Verhalten | 1h | SHOP-06 |

**Ergebnis:** Alle Effekte funktionieren im Spiel.

---

## Phase 7: Finalisierung (SHOP-16, SHOP-17)

| Task | Name | Dauer | Abhängigkeiten |
|------|------|-------|----------------|
| **SHOP-16** | UI-Integration | 1-2h | SHOP-13 |
| **SHOP-17** | Polish & Testing | 2-3h | Alle vorherigen |

**Ergebnis:** Feature ist komplett und getestet.

---

## Abhängigkeits-Graph

```
SHOP-01 (Seltenheit)
    ├──> SHOP-02 (Items)
    ├──> SHOP-03 (Perks)
    └──> SHOP-05 (Konstanten)
              │
SHOP-02 + SHOP-03
    └──> SHOP-04 (Inventar)
              │
SHOP-04 + SHOP-05
    └──> SHOP-06 (Dungeon-Gen)
              ├──> SHOP-09 (Tür)
              └──> SHOP-15 (Gegner)

SHOP-05
    └──> SHOP-07 (Layout)
              ├──> SHOP-08 (Kollision)
              └──> SHOP-10 (Rendering) <── SHOP-11 (Grafiken)
                        │
                        └──> SHOP-12 (Tooltips)
                                  │
                                  └──> SHOP-13 (Kauf)
                                            ├──> SHOP-14 (Kampf-Effekte)
                                            └──> SHOP-16 (UI)

Alle ──> SHOP-17 (Polish)
```

---

## Schnellstart

1. **SHOP-01** starten (keine Abhängigkeiten)
2. Parallel **SHOP-11** starten (Grafiken)
3. Nach SHOP-01: **SHOP-02** und **SHOP-03** parallel
4. Weiter nach Abhängigkeiten

---

## Status-Tracking

| Task | Status | Bearbeiter | Datum |
|------|--------|------------|-------|
| SHOP-01 | ✅ Fertig | Michi | 2026-01-13 |
| SHOP-02 | ✅ Fertig | Michi | 2026-01-13 |
| SHOP-03 | ✅ Fertig | Michi | 2026-01-13 |
| SHOP-04 | ✅ Fertig | Michi | 2026-01-13 |
| SHOP-05 | ✅ Fertig | Michi | 2026-01-13 |
| SHOP-06 | ✅ Fertig | Michi | 2026-01-13 |
| SHOP-07 | ✅ Fertig | Michi | 2026-01-13 |
| SHOP-08 | ✅ Fertig | Michi | 2026-01-13 |
| SHOP-09 | ✅ Fertig | Michi | 2026-01-13 |
| SHOP-10 | ✅ Fertig | Michi | 2026-01-13 |
| SHOP-11 | ✅ Fertig | Claude | 2026-01-13 |
| SHOP-12 | ✅ Fertig | Claude | 2026-01-13 |
| SHOP-13 | ✅ Fertig | Michi | 2026-01-13 |
| SHOP-14 | ✅ Fertig | Claude | 2026-01-13 |
| SHOP-15 | ✅ Fertig | Claude | 2026-01-13 |
| SHOP-16 | ⬜ Offen | - | - |
| SHOP-17 | ⬜ Offen | - | - |

**Legende:** ⬜ Offen | 🔄 In Arbeit | ✅ Fertig
