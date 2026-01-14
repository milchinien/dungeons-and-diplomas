# SHOP-17: Polish, Testing und Dokumentation

**Feature:** Shop-Räume
**Priorität:** Niedrig
**Geschätzte Dauer:** 2-3 Stunden
**Vorgänger:** Alle vorherigen SHOP-Tasks
**Nachfolger:** Keine (Abschluss)

---

## Ziel

Das Shop-System finalisieren: Visuelles Feedback hinzufügen, Sound-Effekte einbinden, Balancing anpassen, alle Edge-Cases testen und die Dokumentation aktualisieren.

---

## Teil 1: Visuelles Feedback

### Kauf-Animation

```typescript
// In ShopRenderer.ts oder eigenem Modul

interface PurchaseAnimation {
  startX: number;
  startY: number;
  startTime: number;
  duration: number;
  color: string;
}

const activeAnimations: PurchaseAnimation[] = [];

/**
 * Startet eine Kauf-Animation.
 */
export function startPurchaseAnimation(
  x: number,
  y: number,
  rarityColor: string
): void {
  activeAnimations.push({
    startX: x,
    startY: y,
    startTime: performance.now(),
    duration: 500,  // 500ms
    color: rarityColor
  });
}

/**
 * Rendert aktive Kauf-Animationen.
 */
export function renderPurchaseAnimations(
  ctx: CanvasRenderingContext2D,
  currentTime: number,
  camera: { x: number; y: number }
): void {
  for (let i = activeAnimations.length - 1; i >= 0; i--) {
    const anim = activeAnimations[i];
    const elapsed = currentTime - anim.startTime;
    const progress = elapsed / anim.duration;

    if (progress >= 1) {
      activeAnimations.splice(i, 1);
      continue;
    }

    const screenX = anim.startX - camera.x;
    const screenY = anim.startY - camera.y - (progress * 50);  // Nach oben
    const alpha = 1 - progress;
    const scale = 1 + progress * 0.5;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = anim.color;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 10 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
```

### Floating Text für Effekte

```typescript
interface FloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  startTime: number;
}

const floatingTexts: FloatingText[] = [];

export function showFloatingText(
  text: string,
  x: number,
  y: number,
  color: string = '#FFFFFF'
): void {
  floatingTexts.push({
    text,
    x,
    y,
    color,
    startTime: performance.now()
  });
}

export function renderFloatingTexts(
  ctx: CanvasRenderingContext2D,
  currentTime: number,
  camera: { x: number; y: number }
): void {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    const elapsed = currentTime - ft.startTime;
    const progress = elapsed / 1500;  // 1.5s

    if (progress >= 1) {
      floatingTexts.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      ft.text,
      ft.x - camera.x,
      ft.y - camera.y - progress * 30
    );
    ctx.restore();
  }
}
```

---

## Teil 2: Sound-Effekte (optional)

### Sound-Dateien

Benötigte Sounds (in `public/Assets/Sounds/`):

| Datei | Beschreibung |
|-------|--------------|
| `shop_enter.mp3` | Betreten des Shops (Glöckchen) |
| `shop_purchase.mp3` | Item/Perk gekauft (Münzklirren) |
| `shop_locked.mp3` | Verschlossene Tür (dumpfes Thunk) |
| `critical_hit.mp3` | Kritischer Treffer |
| `block.mp3` | Schaden geblockt |
| `extra_life.mp3` | Extra-Leben verwendet |

### Sound-System

```typescript
// lib/audio/SoundManager.ts

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();

  preload(key: string, src: string): void {
    const audio = new Audio(src);
    audio.preload = 'auto';
    this.sounds.set(key, audio);
  }

  play(key: string, volume: number = 0.5): void {
    const sound = this.sounds.get(key);
    if (sound) {
      sound.currentTime = 0;
      sound.volume = volume;
      sound.play().catch(() => {});  // Ignoriere Autoplay-Fehler
    }
  }
}

export const soundManager = new SoundManager();

// Beim Spielstart:
soundManager.preload('shop_purchase', '/Assets/Sounds/shop_purchase.mp3');
// ...
```

---

## Teil 3: Balancing

### Konfigurierbare Werte

Alle Balancing-Parameter in einer Datei sammeln:

```typescript
// lib/shop/ShopBalancing.ts

export const SHOP_BALANCING = {
  // Spawn-Raten
  shopSpawnChance: 0.08,      // 8%
  maxShopsPerDungeon: 2,
  minRoomSizeForShop: 6,

  // Seltenheits-Gewichtungen
  rarityWeights: {
    common: 50,
    uncommon: 25,
    rare: 15,
    epic: 8,
    legendary: 2
  },

  // Effekt-Multiplikatoren
  rarityMultipliers: {
    common: 1.0,
    uncommon: 1.5,
    rare: 2.0,
    epic: 3.0,
    legendary: 5.0
  },

  // Effekt-Caps
  maxBlockChance: 75,
  maxCriticalChance: 50,
  maxDamageReduction: 50,
  maxExtraLives: 3
};
```

### Balancing-Tipps

| Problem | Lösung |
|---------|--------|
| Spieler zu stark | Seltenheits-Chancen reduzieren |
| Shops zu selten | shopSpawnChance erhöhen |
| Legendary zu häufig | Gewichtung auf 1 reduzieren |
| Effekte zu schwach | Basis-Werte erhöhen |

---

## Teil 4: Testing-Checkliste

### Funktionale Tests

- [ ] Shop-Räume spawnen mit korrekter Häufigkeit
- [ ] Startraum ist nie ein Shop
- [ ] Kleine Räume werden keine Shops
- [ ] Shop-Inventar hat 3 Items und 3 Perks
- [ ] Seltenheitsverteilung entspricht Gewichtung
- [ ] Schild, Tresen und Waren werden gerendert
- [ ] Schweb-Animation funktioniert
- [ ] Seltenheits-Auren werden angezeigt
- [ ] Legendary-Items pulsieren
- [ ] Tooltips erscheinen bei Annäherung
- [ ] [E]-Taste öffnet Bestätigungs-Modal
- [ ] Kauf funktioniert (Item verschwindet, Spieler erhält Bonus)
- [ ] Gekaufte Items erscheinen im CharacterPanel
- [ ] Gekaufte Perks erscheinen im CharacterPanel
- [ ] Shop-Tür ist verschlossen wenn Gegner da sind
- [ ] Shop-Tür öffnet sich nach Gegner-Sieg
- [ ] Keine Gegner spawnen in Shops
- [ ] Gegner können nicht in Shops folgen
- [ ] Alle Item-Effekte funktionieren im Kampf
- [ ] Alle Perk-Effekte funktionieren
- [ ] Kritische Treffer funktionieren
- [ ] Block funktioniert
- [ ] Extra-Leben funktioniert
- [ ] Regeneration funktioniert
- [ ] Zeitbonus funktioniert
- [ ] Bewegungsgeschwindigkeit skaliert
- [ ] Minimap zeigt Shops korrekt

### Edge-Cases

- [ ] Leerer Shop (alle Items gekauft)
- [ ] Mehrere Shops im Dungeon
- [ ] Shop am Dungeon-Rand
- [ ] Shop neben Startraum
- [ ] Spieler stirbt mit Extra-Leben im Shop
- [ ] Stapeln von mehreren gleichen Perks
- [ ] Caps werden respektiert (75% Block, etc.)

---

## Teil 5: Dokumentation aktualisieren

### CLAUDE.md erweitern

Folgende Sektionen hinzufügen:

```markdown
### Shop-System

**Implementation**: lib/shop/

**Features:**
- Shop-Räume spawnen mit 8% Wahrscheinlichkeit
- 3 Items + 3 Perks pro Shop
- 5 Seltenheitsstufen mit Farb-Auren
- Verschlossene Türen bis Nachbarraum aufgeräumt

**Dateien:**
- `lib/shop/Rarity.ts` - Seltenheitssystem
- `lib/shop/Item.ts` - Item-Definitionen
- `lib/shop/Perk.ts` - Perk-Definitionen
- `lib/shop/ShopInventory.ts` - Inventar-Verwaltung
- `lib/shop/ShopLayout.ts` - Layout-Berechnung
- `lib/shop/ShopDoor.ts` - Tür-Mechanik
- `lib/shop/ShopPurchase.ts` - Kauf-Logik
- `lib/shop/ShopInteraction.ts` - Interaktions-Erkennung
- `lib/rendering/ShopRenderer.ts` - Rendering
- `lib/rendering/TooltipRenderer.ts` - Tooltips
- `components/ShopConfirmModal.tsx` - Kauf-Dialog

**Konstanten:**
- SHOP_SPAWN_CHANCE: 0.08
- SHOP_MIN_ROOM_SIZE: 6
- SHOP_MAX_PER_DUNGEON: 2
- SHOP_ITEMS_COUNT: 3
- SHOP_PERKS_COUNT: 3
```

---

## Teil 6: Code-Cleanup

- [ ] Alle `console.log` Debug-Ausgaben entfernen
- [ ] Ungenutzte Imports entfernen
- [ ] JSDoc-Kommentare für öffentliche Funktionen
- [ ] Einheitliche Namenskonvention
- [ ] Keine Magic Numbers (Konstanten verwenden)

---

## Abnahmekriterien

- [ ] Alle funktionalen Tests bestanden
- [ ] Alle Edge-Cases getestet
- [ ] Visuelles Feedback implementiert
- [ ] CLAUDE.md aktualisiert
- [ ] Keine TypeScript-Fehler
- [ ] Keine Console-Errors
- [ ] Performance ist akzeptabel
- [ ] Code ist sauber und dokumentiert
