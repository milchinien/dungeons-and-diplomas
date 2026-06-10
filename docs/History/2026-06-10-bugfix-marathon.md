# 2026-06-10 — Bugfix-Marathon: Dungeon-Generierung + 19 verifizierte Bugs

## Hauptproblem: "Falsch platzierte Raumteile"

**Symptom:** Beim Spielstart waren Raumwände zerfetzt, Räume liefen ineinander, begehbare Flächen sahen aus wie verschobene Raumfragmente.

**Ursache:** Commit `5e8be0e` (Feb 2026) änderte `removeDoubleWalls()` von AND- auf OR-Logik ("Wand entfernen, wenn Boden auf EINER Seite"). Multi-Pass + OR kaskadierte von jeder Tür aus: Jede entfernte Wand machte im nächsten Durchlauf die Nachbarwand entfernbar. Ergebnis: **382 zerstörte Wandkacheln pro Dungeon**, aufgelöste Raumumrisse.

**Fix (lib/dungeon/generation.ts, lib/dungeon/layoutGeneration.ts):**
- OR → AND: Verschmelzung nur bei echtem `FLOOR|WALL|WALL|FLOOR`-Muster (Single-Pass, kein Kaskadieren möglich)
- DOOR zählt nicht mehr als Zugang (sonst entstehen raumlose Boden-Nischen hinter Türen, roomMap -1/-2)
- Duplikat entfernt: `layoutGeneration.ts` importiert `removeDoubleWalls` jetzt aus `generation.ts` statt eine eigene Kopie zu pflegen
- Neu: `sealExposedFloors()` — jede EMPTY-Kachel neben FLOOR/DOOR wird Wand (versiegelt nicht-rechteckige Layouts und Junction-Ecken)
- `placeRoomInDungeon()`: Wände auf geteilter Kante werden nur noch übersprungen, wenn dort wirklich etwas steht (vorher: Löcher, wenn Raum B über Raum A hinausragte)
- `validateDoorConnection()`: EMPTY zählt nicht mehr als gültiger Nachbar — Türen ins Nichts werden zu Wänden
- `placeRoomInDungeon()`: Die Verbindungstür wird nicht erneut in `openDoors` gepusht (vorher: unplatzierbare Einträge verbrannten das Versuchsbudget der Generierung)
- `updateRoomMapAfterWallRemoval()`: iteriert bis stabil, toter Code entfernt

**Verifikation:**
- Neuer Property-Test `tests/unit/layout-generation.property.test.ts`: 50 Generierungsläufe gegen die echten Seed-Layouts, Invarianten: versiegelt (kein FLOOR/DOOR neben EMPTY), alle Räume per Flood-Fill erreichbar, jede Bodenkachel hat Raum-Zuordnung. Der Test fand beim Schreiben sofort zwei weitere Randfälle (Tür-Tür-Verschmelzung), die mitgefixt wurden.
- `tests/unit/dungeon-generation-fixes.test.ts` testet jetzt die **echte exportierte Funktion** statt einer Inline-Kopie des Algorithmus
- Browser-Verifikation: ASCII-Dump via `window.dungeonTestData` — geschlossene Raumumrisse, 20/20 Räume erreichbar, 0 exponierte Kacheln, 0 Konsolen-Fehler

## Multi-Agent-Bugscan: 19 verifizierte Bugs behoben

6 Finder-Agenten (je Subsystem) + adversariale Verifizierung (19/23 Funde bestätigt), danach 11 parallele Fixer mit disjunkter Datei-Zuständigkeit:

| Bug | Datei | Fix |
|---|---|---|
| WASD tot bei CapsLock / Taste klemmt bei Shift | `hooks/useKeyboardInput.ts` | Key-Normalisierung (lowercase) in keydown+keyup |
| Shop-Layout-Cache überlebt Dungeon-Wechsel (Shop unsichtbar/unkaufbar) | `lib/game/DungeonManager.ts` | `clearLayoutCache()` bei jeder Generierung |
| Theme-Ladefehler → dauerhaft schwarzes Spiel | `lib/game/DungeonManager.ts` | Theme-Retry bei Regenerierung, konsistenter State |
| Schrein-Buffs mutieren `INITIAL_PLAYER_BUFFS` (Buffs leaken über Runs) | `lib/buff/BuffSystem.ts` | `activeBuffs` wird geklont statt geteilt |
| **Shop-Käufe unmöglich** (Stale Closure im Proximity-Intervall) | `components/GameCanvas.tsx` | Latest-Callback-Ref-Muster |
| Gratis-Items wenn /api/gold fehlschlägt | `hooks/useShopPurchase.ts` | Gold-Abzug VOR Item-Anwendung + Double-Submit-Guard |
| E-Kauf-Reichweite 32px daneben (player.width/2 = 0) | `hooks/useShopPurchase.ts` | Konsistent `tileSize/2` wie Tooltip |
| **Shop-Effekte wirkten nie** (Bonus-Stats ohne Call-Sites) | `hooks/useCombat.ts`, `useShopPurchase.ts`, `GameCanvas.tsx` | Verdrahtet: Zeitbonus, Schaden flat/%, Krit, Block, Schadensreduktion, Extra-Leben, echtes Max-HP |
| React-Crash "fewer hooks" im Kaufmodal | `components/ShopConfirmModal.tsx` | Hooks vor Early-Return |
| SQL-Injection über `doorSide`-Parameter | `lib/db/roomLayouts.ts` | Whitelist + Parametrisierung |
| 2 Gegner starten gleichzeitig Kampf (Race) | `lib/game/GameEngine.ts` | Guard mit Grace-Period |
| Tür schließen klemmt Entities in Wand ein | `lib/game/GameEngine.ts` | Push-Out für alle Tür-Kacheln inkl. Teilüberlappung |
| HP-Regeneration aktualisiert HUD nicht | `hooks/useGameState.ts` | React-State-Sync bei Regen-Tick |
| Krit/Erstschlag-Feedback rot als "falsch" angezeigt | `lib/combat/CombatEngine.ts` | ✓-Präfix → grün, Animation, Antworten versteckt |
| Bomben zünden durch Wände | `lib/enemy/Trashmob.ts` | Line-of-Sight-Check vor dem Scharfstellen |

## Bekannte Restpunkte

- `speedMultiplier` und `regeneration` aus Shop-Items sind noch nicht in den GameEngine-Loop verdrahtet (beschrieben in den Fixer-Notes); `eloBonus` braucht eine Design-Entscheidung
- Trashmobs werden beim Türschließen nicht herausgedrückt (benötigt `UpdatePlayerContext`-Erweiterung)
- Vorbestehend rote Unit-Tests (liefen nie im CI, vitest ist nicht installiert): `shop-layout.test.ts` (4), `tiletheme-labels.test.ts` (6), `wall-end-piece-detection.test.ts` (12) — vermutlich veraltete Erwartungen
- `/api/gold` validiert den Kontostand nicht serverseitig
- Empfehlung: vitest als devDependency aufnehmen + `test:unit`-Script, damit die Unit-Tests (inkl. neuem Property-Test) im CI laufen
