# Trashmob-System Plan

## Uebersicht

Trashmobs sind kleine Gegner, die man im Echtzeit-Kampf besiegen kann - **ohne Quiz-Fragen**. Der Spieler greift mit einem 75-Grad Schlagwinkel an.

---

## 1. Melee-Attack System (75 Grad Schlagwinkel)

### Konzept
```
                    75 Grad
                   /       \
                  /         \
                 /           \
                /      ^      \
               /   Blick-      \
              /   richtung      \
             --------------------
                   SPIELER
```

### Berechnung
1. **Spieler-Blickrichtung** = Vektor basierend auf `player.direction` (up/down/left/right)
2. **Winkel zum Gegner** = `atan2(enemy.y - player.y, enemy.x - player.x)`
3. **Differenz** = Winkel zwischen Blickrichtung und Gegner
4. **Treffer** = wenn `|Differenz| <= 37.5 Grad` (halber Schlagwinkel)

### Reichweite
- **Attack Range**: 1.5 Tiles (nah genug fuer Nahkampf)

---

## 2. Trashmob-Klasse

### Unterschiede zu normalen Enemies (Goblins)

| Eigenschaft | Goblin (Quiz) | Trashmob |
|-------------|---------------|----------|
| HP | 10 + level * 5 | 1-2 HP (sehr wenig) |
| Schaden am Spieler | Quiz-basiert (15 HP) | Kontaktschaden (3-4 HP) |
| Besiegen durch | Quiz richtig beantworten | Melee-Angriff |
| Aggro-Verhalten | Folgt Spieler | Einfaches Patrouillieren |
| Spawn-Rate | 1 pro Raum | Mehrere pro Raum moeglich |

### Vorgeschlagene Trashmob-Typen

1. **Ratte** (Rat)
   - 1 HP
   - Schnell, aber schwach
   - Flieht manchmal

2. **Schleim** (Slime)
   - 2 HP
   - Langsam
   - Teilt sich nicht (zu komplex fuer v1)

3. **Fledermaus** (Bat)
   - 1 HP
   - Fliegt (ignoriert Waende? Oder nur visuell)
   - Erratische Bewegung

---

## 3. Player Attack System

### Input
- **Leertaste** oder **Linke Maustaste** = Angriff

### Attack-Ablauf
1. Spieler drueckt Angriffstaste
2. **Cooldown-Check** (0.4 Sekunden zwischen Angriffen)
3. **Schlag-Animation** starten (slash/thrust)
4. **Verlangsamung**: Spieler bewegt sich mit 50% Geschwindigkeit
5. **Hitbox-Berechnung**:
   - Alle Trashmobs im Radius pruefen
   - Winkel zur Blickrichtung berechnen
   - Treffer wenn innerhalb 75 Grad Kegel
6. **Schaden anwenden** (1 HP pro Treffer)
7. **Knockback** (optional): Trashmob wird leicht weggestossen

### Cooldown & Timing
- **Attack Cooldown**: 0.4 Sekunden
- **Attack Duration**: 0.3 Sekunden (Schlag-Animation)
- **Bewegung waehrend Angriff**: 50% Geschwindigkeit

---

## 4. Implementierungs-Schritte

### Phase 1: Attack-System Grundlagen
- [ ] `lib/combat/MeleeAttack.ts` erstellen
  - `isInAttackCone(player, target, coneAngle)` Funktion
  - `getAttackTargets(player, enemies, range, coneAngle)` Funktion
- [ ] Attack-Input in `useGameState` oder `GameEngine` hinzufuegen
- [ ] Attack-Cooldown implementieren
- [ ] Verlangsamung waehrend Angriff

### Phase 2: Trashmob-Klasse
- [ ] `lib/enemy/Trashmob.ts` erstellen (erbt von Enemy oder eigene Klasse)
- [ ] Einfache AI: Wandern + Kontaktschaden
- [ ] **Platzhalter-Rendering** (farbige Kreise)

### Phase 3: Spawning
- [ ] Trashmobs in Raeumen spawnen (zusaetzlich zu Quiz-Goblins)
- [ ] Spawn-Regeln: z.B. 2-4 Trashmobs pro Raum

### Phase 4: Visuelles Feedback
- [ ] Schlag-Animation fuer Spieler
- [ ] Hit-Effekt (Partikel oder Flash)
- [ ] Schaden-Zahlen (optional)

---

## 5. Code-Beispiel: Attack Cone Berechnung

```typescript
// lib/combat/MeleeAttack.ts

export function isInAttackCone(
  playerX: number,
  playerY: number,
  playerDirection: Direction,
  targetX: number,
  targetY: number,
  coneAngleDegrees: number = 75
): boolean {
  // Blickrichtung als Winkel (in Radians)
  const directionAngles: Record<Direction, number> = {
    up: -Math.PI / 2,    // -90 Grad
    down: Math.PI / 2,   // 90 Grad
    left: Math.PI,       // 180 Grad
    right: 0             // 0 Grad
  };

  const lookAngle = directionAngles[playerDirection];

  // Winkel zum Ziel
  const dx = targetX - playerX;
  const dy = targetY - playerY;
  const angleToTarget = Math.atan2(dy, dx);

  // Differenz berechnen (normalisiert auf -PI bis PI)
  let diff = angleToTarget - lookAngle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;

  // Halber Kegelwinkel in Radians
  const halfCone = (coneAngleDegrees / 2) * (Math.PI / 180);

  return Math.abs(diff) <= halfCone;
}

export function getTrashMobsInAttackRange(
  player: Player,
  trashmobs: Trashmob[],
  tileSize: number,
  attackRangeTiles: number = 1.5,
  coneAngle: number = 75
): Trashmob[] {
  const playerCenterX = player.x + tileSize / 2;
  const playerCenterY = player.y + tileSize / 2;
  const attackRangePx = attackRangeTiles * tileSize;

  return trashmobs.filter(mob => {
    if (!mob.alive) return false;

    const mobCenterX = mob.x + tileSize / 2;
    const mobCenterY = mob.y + tileSize / 2;

    // Distanz-Check
    const dx = mobCenterX - playerCenterX;
    const dy = mobCenterY - playerCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > attackRangePx) return false;

    // Winkel-Check
    return isInAttackCone(
      playerCenterX, playerCenterY,
      player.direction,
      mobCenterX, mobCenterY,
      coneAngle
    );
  });
}
```

---

## 6. Entscheidungen (geklaert)

| Frage | Entscheidung |
|-------|--------------|
| Bewegung waehrend Angriff | **Verlangsamt** (50% Geschwindigkeit) |
| Kontaktschaden | **3-4 HP** |
| Sprites | **Platzhalter** - farbige Kreise, spaeter echte Sprites |
| Unverwundbarkeit nach Treffer | 1 Sekunde (verhindert Spam-Damage) |

---

## 7. Platzhalter-Rendering

Bis echte Sprites kommen, werden Trashmobs als **farbige Kreise** gerendert:

```typescript
// Platzhalter-Rendering fuer Trashmobs
function drawTrashmobPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileSize: number,
  type: 'rat' | 'slime' | 'bat'
) {
  const colors = {
    rat: '#8B4513',    // Braun
    slime: '#32CD32',  // Gruen
    bat: '#4B0082'     // Lila
  };

  const size = tileSize * 0.4;  // Kleiner als normale Gegner
  const centerX = x + tileSize / 2;
  const centerY = y + tileSize / 2;

  ctx.beginPath();
  ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = colors[type];
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Kleiner Buchstabe zur Identifikation
  ctx.fillStyle = '#FFF';
  ctx.font = `${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(type[0].toUpperCase(), centerX, centerY);
}
```

**Farben:**
- Ratte (R) - Braun `#8B4513`
- Schleim (S) - Gruen `#32CD32`
- Fledermaus (B) - Lila `#4B0082`

---

## 8. Konstanten

```typescript
// lib/constants.ts - Neue Trashmob-Konstanten

// Trashmob Stats
export const TRASHMOB_CONTACT_DAMAGE_MIN = 3;
export const TRASHMOB_CONTACT_DAMAGE_MAX = 4;
export const TRASHMOB_INVULNERABILITY_TIME = 1.0; // 1 Sekunde nach Treffer

// Player Attack
export const PLAYER_ATTACK_CONE_ANGLE = 75;      // Grad
export const PLAYER_ATTACK_RANGE = 1.5;          // Tiles
export const PLAYER_ATTACK_COOLDOWN = 0.4;       // Sekunden
export const PLAYER_ATTACK_SLOWDOWN = 0.5;       // 50% Geschwindigkeit waehrend Angriff
export const PLAYER_ATTACK_DURATION = 0.3;       // Sekunden (Schlag-Animation)

// Trashmob HP
export const TRASHMOB_HP = {
  rat: 1,
  slime: 2,
  bat: 1
};
```

---

## 9. Naechste Schritte

1. [x] Plan erstellt
2. [x] `lib/combat/MeleeAttack.ts` - Attack-Cone Logik
3. [x] `lib/enemy/Trashmob.ts` - Trashmob Klasse mit Platzhalter-Rendering
4. [x] Attack-Input (Mausklick) in GameEngine einbauen
5. [x] Verlangsamung waehrend Angriff implementieren
6. [x] Kontaktschaden (3-4 HP) + Unverwundbarkeit (1s)
7. [x] Trashmobs in Raeumen spawnen (EntitySpawner.ts)

---

## 10. Implementierte Dateien

| Datei | Beschreibung |
|-------|--------------|
| `lib/constants.ts` | Neue Konstanten fuer Trashmobs und Melee-Attack |
| `lib/combat/MeleeAttack.ts` | Attack-Cone Berechnung (75 Grad) |
| `lib/enemy/Trashmob.ts` | Trashmob-Klasse mit Platzhalter-Rendering |
| `lib/game/GameEngine.ts` | Attack-State, Verlangsamung, Kontaktschaden |
| `lib/game/EntitySpawner.ts` | `spawnTrashmobs()` Funktion |
| `lib/types/game.ts` | `UpdateTrashmobsContext` Interface |
| `lib/enemy/index.ts` | Export von Trashmob |

## 11. Integration (erledigt)

1. [x] **Mausklick-Handler** im useGameState Hook (linke Maustaste = Angriff)
2. [x] **Trashmobs im Game-Loop** spawnen und updaten (DungeonManager + useGameState)
3. [x] **Trashmobs rendern** im GameRenderer
4. [ ] **Schlag-Animation** fuer Spieler (optional, spaeter)
5. [ ] **Hit-Effekte** (optional, spaeter)

## 12. Vollstaendige Dateiliste

| Datei | Aenderung |
|-------|-----------|
| `lib/constants.ts` | Neue Konstanten fuer Trashmobs und Melee-Attack |
| `lib/combat/MeleeAttack.ts` | **NEU** - Attack-Cone Berechnung (75 Grad) |
| `lib/enemy/Trashmob.ts` | **NEU** - Trashmob-Klasse mit Platzhalter-Rendering |
| `lib/enemy/index.ts` | Export von Trashmob |
| `lib/game/GameEngine.ts` | Attack-State, Verlangsamung, Kontaktschaden, updateTrashmobs |
| `lib/game/EntitySpawner.ts` | `spawnTrashmobs()` Funktion |
| `lib/game/DungeonManager.ts` | trashmobs Array, spawnTrashmobs Aufruf |
| `lib/types/game.ts` | `UpdateTrashmobsContext` Interface |
| `lib/rendering/GameRenderer.ts` | renderTrashmobs Methode |
| `hooks/useGameState.ts` | Mausklick-Handler, Trashmob-Update im Loop |

## 13. Test-Anleitung

1. `npm run dev` starten
2. Einloggen
3. In Raeume gehen - dort sollten farbige Kreise (Trashmobs) erscheinen:
   - **R** (Braun) = Ratte
   - **S** (Gruen) = Schleim
   - **B** (Lila) = Fledermaus
4. Linke Maustaste druecken um anzugreifen (75 Grad Kegel vor Spieler)
5. Bei Kontakt mit Trashmob: 3-4 HP Schaden (1 Sekunde Unverwundbarkeit danach)
6. Waehrend Angriff: Bewegung ist 50% langsamer
