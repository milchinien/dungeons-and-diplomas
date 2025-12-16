# Item Icon Creation Guide

## Ordnerstruktur

```
Icons/
├── helm/
│   ├── common/
│   ├── uncommon/
│   ├── rare/
│   ├── epic/
│   └── legendary/
├── brustplatte/
├── schwert/
├── schild/
├── hose/
└── schuhe/
```

---

## Methode B: Pixel Art selbst erstellen

### Empfohlene Tools (kostenlos)

1. **Piskel** (Browser): https://www.piskelapp.com/
   - Direkt im Browser, kein Download
   - Export als PNG oder SVG

2. **Aseprite** (Desktop, 20€): https://www.aseprite.org/
   - Professionell, viele Features
   - Kostenlos wenn selbst kompiliert

3. **Pixilart** (Browser): https://www.pixilart.com/draw
   - Einfach zu bedienen
   - Community mit Vorlagen

### Einstellungen

- **Canvas-Groesse:** 64x64 Pixel
- **Pixel-Groesse:** 4x4 (ergibt 16x16 "grosse Pixel")
- **Transparenter Hintergrund**

### Farbpalette nach Rarity

| Rarity | Hauptfarben | Akzent |
|--------|-------------|--------|
| Common | Grau, Braun | - |
| Uncommon | Gruen-Toene | Silber |
| Rare | Blau-Toene | Gold |
| Epic | Lila/Violett | Gold, Edelsteine |
| Legendary | Orange/Gold | Leuchteffekte |

### Beispiel-Workflow (Piskel)

1. Oeffne https://www.piskelapp.com/
2. Erstelle neues Sprite: 64x64
3. Aktiviere "Grid" (4x4)
4. Zeichne mit der Pixel-Groesse 4x4
5. Export als SVG oder PNG

---

## Methode C: AI-generierte Icons

### DALL-E 3 Prompt (ChatGPT Plus)

```
Create a 64x64 pixel art game icon of a [ITEM_NAME] in retro RPG style.

Style requirements:
- Pixel art with visible pixels (16x16 large pixels)
- [RARITY] item quality colors: [FARBEN]
- Dark fantasy dungeon crawler aesthetic
- Transparent background
- Clean silhouette, recognizable at small size
- No text or labels

Item: [BESCHREIBUNG]
```

### Beispiel-Prompts

**Common Rostiges Schwert:**
```
Create a 64x64 pixel art game icon of a rusty short sword in retro RPG style.

Style requirements:
- Pixel art with visible pixels (16x16 large pixels)
- Common item quality: gray metal with brown rust spots
- Dark fantasy dungeon crawler aesthetic
- Transparent background
- Clean silhouette, recognizable at small size
- No text or labels

Item: An old, rusty short sword with a worn cloth-wrapped handle. The blade shows significant rust and wear.
```

**Epic Flammenschwert:**
```
Create a 64x64 pixel art game icon of a flaming sword in retro RPG style.

Style requirements:
- Pixel art with visible pixels (16x16 large pixels)
- Epic item quality: orange flames, purple handle, gold accents
- Dark fantasy dungeon crawler aesthetic
- Transparent background
- Clean silhouette, recognizable at small size
- No text or labels

Item: A magical sword with a blade made of eternal fire. The crossguard is ornate with purple and gold. Flames dance around the blade.
```

**Legendary Krone der Allwissenheit:**
```
Create a 64x64 pixel art game icon of a crown of omniscience in retro RPG style.

Style requirements:
- Pixel art with visible pixels (16x16 large pixels)
- Legendary item quality: glowing orange/gold, magical aura
- Dark fantasy dungeon crawler aesthetic
- Transparent background
- Clean silhouette, recognizable at small size
- No text or labels

Item: An ancient crown that once belonged to a god of wisdom. Glowing runes, floating mystical particles, radiating golden light.
```

### Midjourney Prompt

```
pixel art RPG game icon, [ITEM], 64x64, [RARITY] quality [FARBEN], retro 16-bit style, dark fantasy, transparent background, clean edges --v 6 --style raw
```

### Nach dem Generieren

1. Download als PNG
2. Hintergrund entfernen (falls noetig) mit:
   - https://www.remove.bg/ (kostenlos)
   - Photoshop/GIMP
3. Auf 64x64 skalieren (Nearest Neighbor, NICHT smooth!)
4. Als PNG speichern in den richtigen Ordner

---

## Benoetigte Icons (78 total)

### Helm (13 Icons)
- [ ] common/topf.svg - Verbeulter Topfhelm
- [ ] common/muetze.svg - Zerfranste Wollmuetze
- [ ] common/strohhut.svg - Loechtiger Strohhut
- [ ] uncommon/lederkappe.svg - Gefuetterte Lederkappe
- [ ] uncommon/kettenhaube.svg - Flickwerk-Kettenhaube
- [ ] uncommon/eisenhelm.svg - Billiger Eisenhelm
- [ ] rare/lehrmeister.svg - Lehrmeister-Kapuze
- [ ] epic/gelehrter.svg - Diadem des Gelehrten
- [ ] epic/daemonenkrone.svg - Daemonenkrone
- [ ] epic/phoenix.svg - Phoönixfeder-Haube
- [ ] legendary/allwissend.svg - Krone der Allwissenheit
- [ ] legendary/unsterblich.svg - Helm der Unsterblichen
- [ ] legendary/sternenlicht.svg - Sternenlicht-Tiara

### Schwert (13 Icons)
- [x] common/rostig.svg - Rostiges Kurzschwert ✓
- [ ] common/kuechenmesser.svg - Stumpfes Kuechenmesser
- [ ] common/spitzer_stock.svg - Angespitzter Stock
- [ ] uncommon/jagdmesser.svg - Scharfes Jagdmesser
- [ ] uncommon/saebel.svg - Alter Kavalleriesaebel
- [ ] uncommon/breitschwert.svg - Abgenutztes Breitschwert
- [ ] rare/stahl.svg - Staehernes Langschwert
- [x] epic/flammen.svg - Flammenklinge ✓
- [ ] epic/seelen.svg - Seelenschneider
- [ ] epic/blitz.svg - Blitzschlag-Saebel
- [ ] legendary/weltenschneider.svg - Weltenschneider
- [ ] legendary/sonnenfeuer.svg - Schwert des Sonnenfeuers
- [ ] legendary/verdammnis.svg - Klinge der Verdammnis

### Brustplatte (13 Icons)
- [ ] common/geflickt.svg - Geflickte Ledertunika
- [ ] common/sack.svg - Kartoffelsack-Weste
- [ ] common/lumpen.svg - Zusammengebundene Lumpen
- [ ] uncommon/wattiert.svg - Wattierte Jacke
- [ ] uncommon/kette.svg - Kurzes Kettenhemd
- [ ] uncommon/leder_gehaertet.svg - Gehaertete Lederweste
- [ ] rare/wanderer.svg - Schuluniform des Wanderers
- [ ] epic/drachen.svg - Drachenschuppen-Harnisch
- [ ] epic/magier.svg - Robe des Erzmagiers
- [ ] epic/mithril.svg - Mithril-Kettenhemd
- [ ] legendary/goetter.svg - Goetterruestung
- [ ] legendary/erzmagier.svg - Gewand des Obersten Erzmagiers
- [ ] legendary/adamant.svg - Adamant-Plattenruestung

### Schild (13 Icons)
- [ ] common/brett.svg - Holzbrett mit Griff
- [ ] common/topfdeckel.svg - Verbogener Topfdeckel
- [ ] common/fassdeckel.svg - Rissiger Fassdeckel
- [ ] uncommon/holz_verstaerkt.svg - Verstaerkter Holzschild
- [ ] uncommon/tartsche.svg - Kleine Tartsche
- [ ] uncommon/buckler.svg - Rostiger Buckler
- [ ] rare/eisen.svg - Eisenbeschlagener Rundschild
- [ ] epic/aegis.svg - Aegis des Wissens
- [ ] epic/spiegel.svg - Spiegelschild
- [ ] epic/eis.svg - Frostrunen-Schild
- [ ] legendary/unendlichkeit.svg - Schild der Unendlichkeit
- [ ] legendary/weisheit.svg - Aegis der Uralten Weisheit
- [ ] legendary/titan.svg - Schild des Weltenwaechters

### Hose (13 Icons)
- [ ] common/ausgebeult.svg - Ausgebeulte Stoffhose
- [ ] common/flicken.svg - Mehr Flicken als Hose
- [ ] common/kurz.svg - Abgeschnittene Arbeitshose
- [ ] uncommon/leder.svg - Robuste Lederhose
- [ ] uncommon/kettenrock.svg - Kurzer Kettenrock
- [ ] uncommon/reiter.svg - Ausgediente Reiterhose
- [ ] rare/forscher.svg - Wanderhosen des Forschers
- [ ] epic/schatten.svg - Schattenweber-Beinkleid
- [ ] epic/titan.svg - Titanenschurz
- [ ] epic/meister.svg - Meistergelehrten-Hose
- [ ] legendary/dimension.svg - Dimensionswandler-Beinkleid
- [ ] legendary/goettlich.svg - Goettliche Beinplatten
- [ ] legendary/erkenntnis.svg - Hose der Ewigen Erkenntnis

### Schuhe (13 Icons)
- [ ] common/abgelaufen.svg - Abgelaufene Lederstiefel
- [ ] common/sandalen.svg - Ausgeleierte Sandalen
- [ ] common/fusslappen.svg - Dicke Fusslappen
- [ ] uncommon/wanderer.svg - Stabile Wanderstiefel
- [ ] uncommon/beschlagen.svg - Beschlagene Lederstiefel
- [ ] uncommon/jaeger.svg - Leichte Jaegerstiefel
- [ ] rare/schleich.svg - Schleichsohlen des Schuelers
- [ ] epic/hermes.svg - Hermesstiefel
- [ ] epic/vulkan.svg - Vulkanschmiede-Stiefel
- [ ] epic/gelehrter.svg - Wanderschuhe des Gelehrten
- [ ] legendary/zeitwanderer.svg - Stiefel des Zeitwanderers
- [ ] legendary/weltlaeufer.svg - Weltlaeufer-Stiefel
- [ ] legendary/transzendenz.svg - Schuhe der Transzendenz

---

## Fortschritt: 2/78 Icons erstellt
