# SHOP-11: Grafiken und Assets erstellen

**Feature:** Shop-Räume
**Priorität:** Mittel
**Geschätzte Dauer:** 2-4 Stunden
**Vorgänger:** Keine (kann parallel bearbeitet werden)
**Nachfolger:** SHOP-10

---

## Ziel

Alle benötigten Grafiken für das Shop-System erstellen: Item-Sprites, Perk-Icons, Tresen-Tiles und das Shop-Schild. Die Grafiken sollen zum bestehenden Dungeon-Stil passen.

---

## Übersicht der benötigten Assets

| Asset | Größe | Anzahl | Speicherort |
|-------|-------|--------|-------------|
| Item-Sprites | 32x32 px | 6 | `public/Assets/Items/` |
| Perk-Icons | 32x32 px | 9 | `public/Assets/Perks/` |
| Shop-Schild | 128x64 px | 1 | `public/Assets/Shop/` |
| Tresen-Tile | 64x64 px | 1 | `public/Assets/Shop/` |
| Shop-Tür (offen) | 64x64 px | 1 | `public/Assets/Shop/` |
| Shop-Tür (geschlossen) | 64x64 px | 1 | `public/Assets/Shop/` |

---

## 1. Item-Sprites (32x32 Pixel)

### Zu erstellen:

| Dateiname | Beschreibung | Design-Hinweise |
|-----------|--------------|-----------------|
| `sword.png` | Schwert | Metallklinge, brauner Griff, leichter Glanz |
| `chestplate.png` | Brustplatte | Metallrüstung, Brustform erkennbar |
| `helmet.png` | Helm | Ritterhelm oder Wikingerhelm |
| `shield.png` | Schild | Rundschild oder Turmschild mit Wappen |
| `boots.png` | Stiefel | Braune Lederstiefel |
| `amulet.png` | Amulett | Goldkette mit Edelstein |

### Stil-Vorgaben:
- Pixel-Art passend zum Dungeon-Tileset
- Klare Silhouetten (erkennbar auch in klein)
- Dunkle Outlines
- Leichte Schattierung für 3D-Effekt

---

## 2. Perk-Icons (32x32 Pixel)

### Zu erstellen:

| Dateiname | Beschreibung | Design-Hinweise |
|-----------|--------------|-----------------|
| `hp_flat.png` | +HP (flach) | Rotes Herz mit "+" Zeichen |
| `hp_percent.png` | +HP% | Rotes Herz mit "%" Zeichen |
| `damage_flat.png` | +Schaden | Schwert mit "+" Zeichen |
| `damage_percent.png` | +Schaden% | Schwert mit "%" Zeichen |
| `regeneration.png` | Regeneration | Grünes Herz mit Kreislauf-Pfeil |
| `critical.png` | Kritisch | Blitz oder Stern (gelb/orange) |
| `time_bonus.png` | Zeitbonus | Sanduhr oder Uhr |
| `extra_life.png` | Extra Leben | Goldenes Herz mit Flügeln |
| `elo_boost.png` | ELO-Boost | Grüner Pfeil nach oben |

### Stil-Vorgaben:
- Icons sollten auf einen Blick erkennbar sein
- Konsistente Farbpalette
- Symbole statt detaillierte Grafiken

---

## 3. Shop-Schild (128x64 Pixel)

### Design:
- Holzschild mit Metallbeschlägen
- Text "SHOP" in goldener/gelber Schrift
- Mittelalterlicher/Fantasy-Stil
- Eventuell hängende Ketten an den Seiten

### Varianten (optional):
- Normal
- Leuchtend (wenn Spieler nahe)

---

## 4. Tresen-Tile (64x64 Pixel)

### Design:
- Holztresen von oben/schräg gesehen
- Passend zum Dungeon-Tileset
- Dunkles Holz mit sichtbarer Maserung
- Eventuell Metallbeschläge an den Ecken

---

## 5. Shop-Tür (64x64 Pixel)

### Zwei Varianten:

**Geschlossen (`shop_door_locked.png`):**
- Holztür mit Metallbeschlägen
- Sichtbares Schloss oder Kette
- Rötlicher/warnender Schimmer

**Offen (`shop_door_open.png`):**
- Offene Tür oder Portal
- Einladender, goldener/grüner Schimmer
- Licht von innen

---

## Werkzeuge

Empfohlene Tools zum Erstellen:
- **Aseprite** - Professioneller Pixel-Art-Editor
- **Piskel** - Kostenloser Online-Pixel-Editor
- **GIMP** - Kostenlos, für alle Plattformen
- **Tiled Editor** - Für Tileset-Integration

---

## Ordnerstruktur erstellen

```bash
mkdir -p public/Assets/Items
mkdir -p public/Assets/Perks
mkdir -p public/Assets/Shop
```

---

## Fertige Dateistruktur

```
public/Assets/
├── Items/
│   ├── sword.png
│   ├── chestplate.png
│   ├── helmet.png
│   ├── shield.png
│   ├── boots.png
│   └── amulet.png
├── Perks/
│   ├── hp_flat.png
│   ├── hp_percent.png
│   ├── damage_flat.png
│   ├── damage_percent.png
│   ├── regeneration.png
│   ├── critical.png
│   ├── time_bonus.png
│   ├── extra_life.png
│   └── elo_boost.png
└── Shop/
    ├── sign.png
    ├── counter.png
    ├── door_locked.png
    └── door_open.png
```

---

## Platzhalter-Option

Falls keine Zeit für echte Grafiken:
1. Einfache farbige Formen verwenden (Quadrate, Kreise)
2. Aus dem Internet lizenzfreie Assets suchen (z.B. OpenGameArt.org)
3. KI-generierte Pixel-Art (z.B. mit DALL-E, Midjourney)

---

## Integration testen

Nach Erstellung die Assets in der Konsole testen:

```typescript
// Test-Code
const img = new Image();
img.onload = () => console.log('Asset geladen:', img.width, 'x', img.height);
img.onerror = () => console.error('Asset nicht gefunden!');
img.src = '/Assets/Items/sword.png';
```

---

## Abnahmekriterien

- [ ] Ordner `public/Assets/Items/` existiert mit 6 Sprites
- [ ] Ordner `public/Assets/Perks/` existiert mit 9 Icons
- [ ] Ordner `public/Assets/Shop/` existiert mit 4 Assets
- [ ] Alle Assets haben korrekte Größe
- [ ] Alle Assets sind im PNG-Format mit Transparenz
- [ ] Stil passt zum bestehenden Dungeon-Tileset
- [ ] Assets laden korrekt im Browser
