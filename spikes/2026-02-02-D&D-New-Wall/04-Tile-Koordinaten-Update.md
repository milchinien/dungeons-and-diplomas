# Tile-Koordinaten Update

**Datum:** 2026-02-04
**Datei:** 04-Tile-Koordinaten-Update.md

---

## Zweck

Dieses Dokument ist die **Arbeits-Tabelle** für die Koordinaten-Identifikation.

**Aufgabe:** Fülle die "Neu (x,y)" Spalten aus, nachdem du die Tiles im `Tileset_old.png` identifiziert hast.

---

## Koordinaten-Tabelle: Wände

| Wand-Typ | Visuell | Aktuell (x,y) | Neu (x,y) | Status | Notizen |
|----------|---------|---------------|-----------|--------|---------|
| **HORIZONTAL** | ═══ | (0, 0) | ??? | ❌ TODO | Wand läuft horizontal |
| **VERTICAL** | ║ | (0, 0) | ??? | ❌ TODO | Wand läuft vertikal |
| **CORNER_TL** | ╔ | (0, 0) | ??? | ❌ TODO | Ecke oben-links |
| **CORNER_TR** | ╗ | (0, 0) | ??? | ❌ TODO | Ecke oben-rechts |
| **CORNER_BL** | ╚ | (0, 0) | ??? | ❌ TODO | Ecke unten-links |
| **CORNER_BR** | ╝ | (0, 0) | ??? | ❌ TODO | Ecke unten-rechts |
| **T_UP** | ╩ | (0, 0) | ??? | ❌ TODO | T öffnet nach oben |
| **T_DOWN** | ╦ | (0, 0) | ??? | ❌ TODO | T öffnet nach unten |
| **T_LEFT** | ╣ | (0, 0) | ??? | ❌ TODO | T öffnet nach links |
| **T_RIGHT** | ╠ | (0, 0) | ??? | ❌ TODO | T öffnet nach rechts |
| **CROSS** | ╬ | (0, 0) | ??? | ❌ TODO | Kreuzung (4 Richtungen) |
| **ISOLATED** | ▢ | (0, 0) | ??? | ⚠️ OPTIONAL | Alleinstehend (Fallback auf VERTICAL) |
| **END_LEFT** | ═ | (0, 0) | ??? | ⚠️ OPTIONAL | Ende links (Fallback auf VERTICAL) |
| **END_RIGHT** | ═ | (0, 0) | ??? | ⚠️ OPTIONAL | Ende rechts (Fallback auf VERTICAL) |
| **END_TOP** | ║ | (0, 0) | ??? | ⚠️ OPTIONAL | Ende oben (Fallback auf HORIZONTAL) |
| **END_BOTTOM** | ║ | (0, 0) | ??? | ⚠️ OPTIONAL | Ende unten (Fallback auf HORIZONTAL) |

**Legende:**
- ✅ = Fertig
- ❌ TODO = Muss noch ausgefüllt werden
- ⚠️ OPTIONAL = Optional, Fallback existiert

---

## Koordinaten-Tabelle: Türen

| Tür-Typ | Visuell | Aktuell (x,y) | Neu (x,y) | Status | Notizen |
|---------|---------|---------------|-----------|--------|---------|
| **HORIZONTAL_CLOSED** | 🚪─ | (1, 0) | ??? | ❌ TODO | Tür links-rechts, geschlossen |
| **HORIZONTAL_OPEN** | 🚪─ | (1, 1) | ??? | ❌ TODO | Tür links-rechts, offen |
| **VERTICAL_CLOSED** | 🚪│ | (0, 0) | ??? | ❌ TODO | Tür oben-unten, geschlossen |
| **VERTICAL_OPEN** | 🚪│ | (0, 1) | ??? | ❌ TODO | Tür oben-unten, offen |

---

## Koordinaten-Tabelle: Böden (optional)

**Hinweis:** Böden bleiben normalerweise unverändert, außer du möchtest auch diese austauschen.

| Boden-Typ | Aktuell (x,y) | Neu (x,y) | Status | Notizen |
|-----------|---------------|-----------|--------|---------|
| **FLOOR** (Standard) | (0, 1) | (0, 1) | ✅ BEHALTEN | Unverändert |
| **FLOOR_VARIANT_2** | (1, 1) | (1, 1) | ✅ BEHALTEN | Unverändert |
| **FLOOR_VARIANT_3** | (2, 1) | (2, 1) | ✅ BEHALTEN | Unverändert |
| **FLOOR_VARIANT_4** | (3, 1) | (3, 1) | ✅ BEHALTEN | Unverändert |
| **FLOOR_VARIANT_5** | (4, 1) | (4, 1) | ✅ BEHALTEN | Unverändert |

---

## Beispiel: Koordinaten identifizieren

### Schritt 1: GIMP mit Grid öffnen
```
Tileset_old.png → Grid (64×64) anzeigen
```

### Schritt 2: Tile finden
Suche nach dem visuellen Muster:
- **HORIZONTAL (═══):** Wand mit horizontalem Balken
- Beispiel-Position im Tileset: Spalte 3, Reihe 2

### Schritt 3: Koordinate berechnen
```
Tile-Position: (3, 2)
Pixel-Position: (3 * 64, 2 * 64) = (192, 128)
```

### Schritt 4: Eintragen
```markdown
| **HORIZONTAL** | ═══ | (0, 0) | (3, 2) | ✅ DONE | Gefunden bei (192, 128) px |
```

---

## Validierung

### Nach dem Ausfüllen der Tabelle:

**Checkliste:**
- [ ] Alle 11 Pflicht-Wand-Typen ausgefüllt
- [ ] Alle 4 Tür-Typen ausgefüllt
- [ ] Optional: 5 Spezial-Wand-Typen (END_*, ISOLATED)
- [ ] Koordinaten überprüft (keine Duplikate)
- [ ] Visuell im Tileset validiert (richtiges Tile?)

**Duplikate prüfen:**
```bash
# Kein Tile sollte mehrfach verwendet werden (außer Fallbacks)
# Prüfe: Gibt es zwei verschiedene Wand-Typen mit gleichen Koordinaten?
```

---

## Code-Snippet für lib/spriteConfig.ts

**Nachdem die Tabelle ausgefüllt ist:**

```typescript
// lib/spriteConfig.ts (Zeilen 89-135)

export const TILESET_COORDS = {
  // === BÖDEN (unverändert) ===
  FLOOR: { x: 0, y: 1 },

  // === WÄNDE (NEU!) ===
  WALL_TOP: { x: ??, y: ?? },           // HORIZONTAL
  WALL_BOTTOM: { x: ??, y: ?? },        // HORIZONTAL
  WALL_LEFT: { x: ??, y: ?? },          // VERTICAL
  WALL_RIGHT: { x: ??, y: ?? },         // VERTICAL
  WALL_HORIZONTAL: { x: ??, y: ?? },    // HORIZONTAL
  WALL_VERTICAL: { x: ??, y: ?? },      // VERTICAL

  // === ECKEN (NEU!) ===
  CORNER_TL: { x: ??, y: ?? },
  CORNER_TR: { x: ??, y: ?? },
  CORNER_BL: { x: ??, y: ?? },
  CORNER_BR: { x: ??, y: ?? },

  // === T-STÜCKE (NEU!) ===
  T_UP: { x: ??, y: ?? },
  T_DOWN: { x: ??, y: ?? },
  T_LEFT: { x: ??, y: ?? },
  T_RIGHT: { x: ??, y: ?? },

  // === KREUZ (NEU!) ===
  CROSS: { x: ??, y: ?? },

  // === TÜREN (NEU!) ===
  DOOR_HORIZONTAL_CLOSED: { x: ??, y: ?? },
  DOOR_HORIZONTAL_OPEN: { x: ??, y: ?? },
  DOOR_VERTICAL_CLOSED: { x: ??, y: ?? },
  DOOR_VERTICAL_OPEN: { x: ??, y: ?? },

  // === OPTIONAL: Spezialfälle ===
  ISOLATED: { x: ??, y: ?? },       // Oder nutze Fallback
  END_LEFT: { x: ??, y: ?? },       // Oder nutze Fallback
  END_RIGHT: { x: ??, y: ?? },      // Oder nutze Fallback
  END_TOP: { x: ??, y: ?? },        // Oder nutze Fallback
  END_BOTTOM: { x: ??, y: ?? },     // Oder nutze Fallback
};
```

**Ersetze `??` mit den Koordinaten aus der Tabelle!**

---

## Fallback-Strategie

Falls ein Wand-Typ **nicht** im `Tileset_old.png` gefunden wird:

### Lösung 1: Fallback nutzen
```typescript
// Beispiel: ISOLATED nicht gefunden → nutze VERTICAL
ISOLATED: { x: SAME_AS_VERTICAL_X, y: SAME_AS_VERTICAL_Y },
```

### Lösung 2: Tile selbst erstellen
- In GIMP ein passendes Tile zeichnen
- Ins Tileset einfügen
- Koordinaten eintragen

### Lösung 3: Aus anderem Tileset kopieren
- Suche online nach "dungeon tileset 64x64"
- Finde passendes Tile
- Lizenz prüfen!
- Tile kopieren und einfügen

---

## Beispiel-Ergebnis (ausgefüllt)

**BEISPIEL - NICHT ECHTE WERTE!**

| Wand-Typ | Visuell | Aktuell (x,y) | Neu (x,y) | Status | Notizen |
|----------|---------|---------------|-----------|--------|---------|
| **HORIZONTAL** | ═══ | (0, 0) | **(3, 2)** | ✅ DONE | Pixel: (192, 128) |
| **VERTICAL** | ║ | (0, 0) | **(4, 2)** | ✅ DONE | Pixel: (256, 128) |
| **CORNER_TL** | ╔ | (0, 0) | **(0, 1)** | ✅ DONE | Pixel: (0, 64) |

---

## Nächste Schritte

1. ✅ GIMP öffnen mit `Tileset_old.png`
2. ✅ Grid aktivieren (64×64)
3. ✅ Jeden Wand-Typ visuell finden
4. ✅ Koordinaten in Tabelle eintragen
5. ✅ Validierung durchführen
6. ✅ Code-Snippet in `spriteConfig.ts` übernehmen

**Danach:** Weiter mit Dokument `05-Room-Editor-Anpassung.md`

---

**Wichtig:** Diese Datei ist deine **Arbeitsunterlage**. Speichere sie nach jedem Update!

