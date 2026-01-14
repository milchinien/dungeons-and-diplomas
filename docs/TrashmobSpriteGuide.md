# Trashmob Sprite Guide

Diese Dokumentation erklärt, wie die prozedural generierten Trashmob-Sprites funktionieren und wie man neue Trashmobs erstellt.

## Übersicht

Trashmob-Sprites werden als **12x12 Pixel** 2D-Arrays definiert, wobei jede Zahl einem Farbindex in einer Palette entspricht. Die Sprites werden zur Laufzeit auf dem Canvas gerendert.

**Datei:** `lib/rendering/TrashmobSprites.ts`

## Aktuelle Animationen

Jeder Trashmob benötigt **7 Animationen**:

| Animation | Frames | Beschreibung | Geschwindigkeit (FPS) |
|-----------|--------|--------------|----------------------|
| `idle` | 2 | Ruhezustand, leichte Bewegung | 1.5-3 |
| `move` | 3-4 | Lauf-/Flug-Animation | 4-10 |
| `dash` | 3 | Schneller Vorwärts-Dash | 8-14 |
| `jump` | 4 | Sprung nach oben und landen | 5-8 |
| `hurt` | 2 | Getroffen werden (Flash + Recoil) | 6-10 |
| `death` | 5 | Todesanimation (Fallen + Verschwinden) | 3-5 |
| `attack` | 3 | Angriff auf Spieler | 8-12 |

## Frame-Übersicht nach Trashmob

### RAT (Ratte)
| Animation | Frames | Beschreibung |
|-----------|--------|--------------|
| idle | 2 | Ohren zucken |
| move | 4 | Rennen mit Beinbewegung |
| dash | 3 | Vorwärts-Sprung |
| jump | 4 | Hoch und runter hüpfen |
| hurt | 2 | Rot blinken + zurückweichen |
| death | 5 | Umkippen und verblassen |
| attack | 3 | Beißen |

### SLIME (Schleim)
| Animation | Frames | Beschreibung |
|-----------|--------|--------------|
| idle | 2 | Squish-Bounce |
| move | 3 | Hüpfen |
| dash | 3 | Strecken und vorwärts schießen |
| jump | 4 | Hoch bounce als Tropfen |
| hurt | 2 | Rot blinken + wackeln |
| death | 5 | Schmelzen zu einer Pfütze |
| attack | 3 | Auf Spieler schleudern |

### BAT (Fledermaus)
| Animation | Frames | Beschreibung |
|-----------|--------|--------------|
| idle | 2 | Flügel leicht bewegen |
| move | 3 | Fliegen mit Flügelschlag |
| dash | 3 | Sturzflug |
| jump | 4 | Nach oben schweben |
| hurt | 2 | Rot blinken + taumeln |
| death | 5 | Fallen und "poof" |
| attack | 3 | Sturzangriff mit Zähnen |

## Wie man einen neuen Trashmob erstellt

### Schritt 1: Konstante hinzufügen

In `lib/constants.ts`:

```typescript
export const TRASHMOB_TYPE = {
  RAT: 'rat',
  SLIME: 'slime',
  BAT: 'bat',
  SPIDER: 'spider'  // NEU
} as const;

export const TRASHMOB_HP: Record<TrashmobType, number> = {
  rat: 2,
  slime: 3,
  bat: 1,
  spider: 2  // NEU
};

export const TRASHMOB_COLORS: Record<TrashmobType, string> = {
  rat: '#8B4513',
  slime: '#32CD32',
  bat: '#4B0082',
  spider: '#000000'  // NEU (Fallback-Farbe)
};
```

### Schritt 2: Farbpalette definieren

In `TrashmobSprites.ts`, füge eine neue Palette hinzu:

```typescript
const PALETTES: Record<TrashmobType, string[]> = {
  // ... bestehende Paletten ...
  [TRASHMOB_TYPE.SPIDER]: [
    'transparent', // 0 - IMMER transparent
    '#1a1a1a',     // 1 - Outline (dunkel)
    '#333333',     // 2 - Körper (Hauptfarbe)
    '#555555',     // 3 - Highlight
    '#ff0000',     // 4 - Augen
    '#222222',     // 5 - Schatten
    '#ffffff',     // 6 - Glanz
    '#ff0000',     // 7 - Hurt-Flash (ROT - immer Index 7!)
  ],
};
```

**Wichtig:**
- Index `0` ist IMMER `'transparent'`
- Index `7` sollte IMMER `'#ff0000'` sein (für Hurt-Animation)

### Schritt 3: Sprite-Frames zeichnen

Erstelle ein 12x12 Array für jeden Frame:

```typescript
const SPIDER_FRAMES: TrashmobAnimationSet = {
  idle: [
    // Frame 1
    [
      [0,0,0,0,0,0,0,0,0,0,0,0],  // Zeile 0
      [0,0,0,0,0,0,0,0,0,0,0,0],  // Zeile 1
      [0,0,0,0,1,1,1,1,0,0,0,0],  // Zeile 2
      // ... 9 weitere Zeilen ...
    ],
    // Frame 2
    [
      // ...
    ],
  ],
  move: [ /* 3-4 Frames */ ],
  dash: [ /* 3 Frames */ ],
  jump: [ /* 4 Frames */ ],
  hurt: [ /* 2 Frames */ ],
  death: [ /* 5 Frames */ ],
  attack: [ /* 3 Frames */ ],
};
```

### Schritt 4: Frames registrieren

```typescript
const SPRITE_FRAMES: Record<TrashmobType, TrashmobAnimationSet> = {
  [TRASHMOB_TYPE.RAT]: RAT_FRAMES,
  [TRASHMOB_TYPE.SLIME]: SLIME_FRAMES,
  [TRASHMOB_TYPE.BAT]: BAT_FRAMES,
  [TRASHMOB_TYPE.SPIDER]: SPIDER_FRAMES,  // NEU
};
```

### Schritt 5: Animations-Geschwindigkeiten festlegen

```typescript
const ANIMATION_SPEEDS: Record<TrashmobType, Record<TrashmobAnimationType, number>> = {
  // ... bestehende ...
  [TRASHMOB_TYPE.SPIDER]: {
    idle: 2,      // Langsam für Ruhe
    move: 8,      // Schnell für Bewegung
    dash: 12,     // Sehr schnell für Dash
    jump: 6,      // Mittel für Sprung
    hurt: 8,      // Schnell für Treffer-Feedback
    death: 4,     // Langsam für dramatischen Tod
    attack: 10    // Schnell für Angriff
  },
};
```

## Sprite-Zeichnen-Tipps

### Grundstruktur

```
   0 1 2 3 4 5 6 7 8 9 10 11   <- X-Koordinate
0  [0,0,0,0,0,0,0,0,0,0,0, 0]
1  [0,0,0,0,0,0,0,0,0,0,0, 0]
2  [0,0,0,0,1,1,1,1,0,0,0, 0]  <- Outline beginnt
3  [0,0,0,1,2,2,2,2,1,0,0, 0]  <- Körper
4  [0,0,1,2,4,2,2,4,2,1,0, 0]  <- Augen (Farbe 4)
5  [0,0,1,2,2,2,2,2,2,1,0, 0]
...
```

### Farb-Konventionen

| Index | Zweck | Typische Verwendung |
|-------|-------|---------------------|
| 0 | Transparent | Hintergrund |
| 1 | Outline | Dunkelste Farbe, umrandet den Sprite |
| 2 | Körper | Hauptfarbe des Charakters |
| 3 | Highlight | Hellere Version für Glanzpunkte |
| 4 | Akzent 1 | Augen, besondere Merkmale |
| 5 | Schatten | Dunklere Version für Tiefe |
| 6 | Akzent 2 | Glanz, sekundäre Merkmale |
| 7 | Hurt | ROT - für Treffer-Animation |

### Animation-Design-Prinzipien

1. **Idle**: Minimale Bewegung, zeigt Lebendigkeit
   - Ohren zucken, Augen blinzeln, leichtes Atmen

2. **Move**: Klare Fortbewegung
   - Beine/Flügel bewegen sich
   - Körper bewegt sich leicht auf/ab

3. **Dash**: Schnelle Vorwärtsbewegung
   - Frame 1: Komprimieren/Zurücklehnen
   - Frame 2: Gestreckt/In Bewegung
   - Frame 3: Landen/Bremsen

4. **Jump**: Vertikale Bewegung
   - Frame 1: Ducken (Vorbereitung)
   - Frame 2: Abheben
   - Frame 3: Höhepunkt
   - Frame 4: Fallen

5. **Hurt**: Sofortiges Feedback
   - Frame 1: Kompletter Flash (alles Farbe 7)
   - Frame 2: Zurückweichen/Taumeln

6. **Death**: Dramatisch, aber kurz
   - Frame 1: Getroffen
   - Frame 2-3: Fallen/Transformieren
   - Frame 4: Auf dem Boden
   - Frame 5: Verschwinden/Verblassen

7. **Attack**: Aggressiv, vorwärts gerichtet
   - Frame 1: Zurücklehnen (Wind-up)
   - Frame 2: Vorwärts/Angriff
   - Frame 3: Treffer/Zurückziehen

## Richtungsunterstützung

Sprites werden automatisch horizontal gespiegelt wenn `direction === 'left'`. Du musst nur die rechts-schauende Version zeichnen.

Für `up` und `down` wird derselbe Sprite verwendet (keine Rotation). Falls nötig, können separate Up/Down-Sprites hinzugefügt werden.

## Renderer-API

```typescript
import { trashmobSpriteRenderer, TrashmobAnimationType } from './TrashmobSprites';

// Animation aktualisieren
trashmobSpriteRenderer.update(deltaTime);

// Sprite zeichnen
trashmobSpriteRenderer.draw(
  ctx,              // CanvasRenderingContext2D
  'rat',            // TrashmobType
  100,              // x Position
  200,              // y Position
  48,               // Größe in Pixeln
  'move',           // Animation
  'right',          // Richtung
  2                 // Optional: Frame-Override
);

// Frame-Anzahl abfragen
const frameCount = trashmobSpriteRenderer.getFrameCount('rat', 'death');
```

## Checkliste für neue Trashmobs

- [ ] Konstante in `TRASHMOB_TYPE` hinzugefügt
- [ ] HP in `TRASHMOB_HP` definiert
- [ ] Fallback-Farbe in `TRASHMOB_COLORS` definiert
- [ ] Farbpalette (8 Farben, Index 0 = transparent, Index 7 = rot)
- [ ] `idle` Animation (2 Frames)
- [ ] `move` Animation (3-4 Frames)
- [ ] `dash` Animation (3 Frames)
- [ ] `jump` Animation (4 Frames)
- [ ] `hurt` Animation (2 Frames, Frame 1 komplett rot)
- [ ] `death` Animation (5 Frames)
- [ ] `attack` Animation (3 Frames)
- [ ] Frames in `SPRITE_FRAMES` registriert
- [ ] Geschwindigkeiten in `ANIMATION_SPEEDS` definiert

---

**Letzte Aktualisierung:** Januar 2026
