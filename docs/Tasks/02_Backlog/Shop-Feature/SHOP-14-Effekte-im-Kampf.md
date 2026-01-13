# SHOP-14: Item/Perk-Effekte im Kampf anwenden

**Feature:** Shop-Räume
**Priorität:** Hoch
**Geschätzte Dauer:** 1-2 Stunden
**Vorgänger:** SHOP-13 (Kauf-System)
**Nachfolger:** SHOP-15

---

## Ziel

Alle Item- und Perk-Effekte im Kampfsystem aktivieren: Schadenserhöhung, Schadensreduktion, Block-Chance, kritische Treffer, Zeitbonus und Extra-Leben.

---

## Zu bearbeitende Dateien

1. `lib/combat/DamageCalculator.ts` - Schadensberechnung
2. `hooks/useCombat.ts` - Kampf-Logik

---

## Teil 1: DamageCalculator erweitern

**Pfad:** `lib/combat/DamageCalculator.ts`

### Bestehende Funktion erweitern

```typescript
import { Player, BonusStats } from '../constants';

/**
 * Berechnet den Schaden, den der Spieler bei korrekter Antwort verursacht.
 * Berücksichtigt: damageFlat, damagePercent, criticalChance
 */
export function calculatePlayerDamage(
  baseDamage: number,
  bonusStats: BonusStats,
  randomFn: () => number = Math.random
): { damage: number; isCritical: boolean } {
  // 1. Flachen Bonus addieren
  let damage = baseDamage + bonusStats.damageFlat;

  // 2. Prozentuale Erhöhung
  damage = damage * (1 + bonusStats.damagePercent / 100);

  // 3. Kritischer Treffer prüfen
  let isCritical = false;
  if (randomFn() * 100 < bonusStats.criticalChance) {
    damage = damage * 2;
    isCritical = true;
  }

  // 4. Runden und Minimum
  damage = Math.max(Math.round(damage), 1);

  return { damage, isCritical };
}

/**
 * Berechnet den Schaden, den der Spieler bei falscher Antwort erhält.
 * Berücksichtigt: damageReduction, blockChance
 */
export function calculateEnemyDamage(
  baseDamage: number,
  bonusStats: BonusStats,
  randomFn: () => number = Math.random
): { damage: number; isBlocked: boolean } {
  // 1. Block-Chance prüfen
  if (randomFn() * 100 < bonusStats.blockChance) {
    return { damage: 0, isBlocked: true };
  }

  // 2. Schadensreduktion anwenden
  let damage = baseDamage * (1 - bonusStats.damageReduction / 100);

  // 3. Runden und Minimum
  damage = Math.max(Math.round(damage), 1);

  return { damage, isBlocked: false };
}
```

---

## Teil 2: useCombat erweitern

**Pfad:** `hooks/useCombat.ts`

### Timer mit Zeitbonus

```typescript
import { COMBAT_TIME_LIMIT } from '../lib/constants';

// In der Funktion, die eine neue Frage startet:
function askQuestion() {
  // ... bestehende Logik ...

  // Timer mit Zeitbonus berechnen
  const timeLimit = COMBAT_TIME_LIMIT + player.bonusStats.timeBonus;
  setTimeRemaining(timeLimit);

  // Timer starten
  timerRef.current = setInterval(() => {
    setTimeRemaining(prev => {
      if (prev <= 0) {
        handleTimeout();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
}
```

### Schadensberechnung bei Antwort

```typescript
import {
  calculatePlayerDamage,
  calculateEnemyDamage
} from '../lib/combat/DamageCalculator';

function answerQuestion(selectedIndex: number) {
  const isCorrect = selectedIndex === currentQuestion.correctIndex;

  if (isCorrect) {
    // Spieler macht Schaden
    const { damage, isCritical } = calculatePlayerDamage(
      DAMAGE_CORRECT,  // Basis-Schaden (z.B. 10)
      player.bonusStats
    );

    enemy.hp -= damage;

    if (isCritical) {
      showMessage('KRITISCHER TREFFER!');
    }

    setLastDamageDealt(damage);
  } else {
    // Gegner macht Schaden
    const { damage, isBlocked } = calculateEnemyDamage(
      DAMAGE_WRONG,  // Basis-Schaden (z.B. 15)
      player.bonusStats
    );

    if (isBlocked) {
      showMessage('GEBLOCKT!');
    } else {
      player.hp -= damage;
    }

    setLastDamageTaken(damage);
  }

  // Kampf-Ende prüfen
  checkCombatEnd();
}
```

### Extra-Leben System

```typescript
function checkCombatEnd() {
  // Gegner besiegt
  if (enemy.hp <= 0) {
    endCombat('victory');
    return;
  }

  // Spieler besiegt?
  if (player.hp <= 0) {
    // Extra-Leben prüfen
    if (player.bonusStats.extraLives > 0) {
      // Wiederbeleben!
      player.hp = Math.round(player.maxHp * 0.5);  // 50% HP
      player.bonusStats.extraLives -= 1;

      showMessage('EXTRA LEBEN! Du wurdest wiederbelebt!');

      // Kampf geht weiter
      askQuestion();
      return;
    }

    // Kein Extra-Leben mehr
    endCombat('defeat');
  }
}
```

---

## Teil 3: Regeneration im Game-Loop

**Pfad:** `hooks/useGameState.ts` oder `lib/game/GameEngine.ts`

```typescript
// Timer für Regeneration
const lastRegenTime = useRef(0);
const REGEN_INTERVAL = 5000;  // Alle 5 Sekunden

function update(deltaTime: number, currentTime: number) {
  // ... andere Updates ...

  // Regeneration prüfen
  if (player.bonusStats.regeneration > 0) {
    if (currentTime - lastRegenTime.current >= REGEN_INTERVAL) {
      const regenAmount = player.bonusStats.regeneration;
      player.hp = Math.min(player.hp + regenAmount, player.maxHp);
      lastRegenTime.current = currentTime;

      // Optional: Visuelles Feedback
      showFloatingText(`+${regenAmount} HP`, player.x, player.y, 'green');
    }
  }
}
```

---

## Teil 4: Bewegungsgeschwindigkeit

**Pfad:** `lib/game/GameEngine.ts` oder `hooks/useGameState.ts`

```typescript
function updatePlayerPosition(player: Player, deltaTime: number) {
  // Geschwindigkeit mit Multiplikator
  const speed = PLAYER_SPEED_TILES * player.bonusStats.speedMultiplier;

  const dx = input.right - input.left;
  const dy = input.down - input.up;

  // Normalisieren für diagonale Bewegung
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length > 0) {
    player.x += (dx / length) * speed * deltaTime * TILE_SIZE;
    player.y += (dy / length) * speed * deltaTime * TILE_SIZE;
  }
}
```

---

## Übersicht aller Effekte

| Effekt | Wo implementiert | Status |
|--------|------------------|--------|
| damageFlat | DamageCalculator | ⬜ |
| damagePercent | DamageCalculator | ⬜ |
| damageReduction | DamageCalculator | ⬜ |
| blockChance | DamageCalculator | ⬜ |
| criticalChance | DamageCalculator | ⬜ |
| timeBonus | useCombat | ⬜ |
| extraLives | useCombat | ⬜ |
| regeneration | GameEngine | ⬜ |
| speedMultiplier | GameEngine | ⬜ |
| maxHpBonus | ShopPurchase | ✅ (in SHOP-13) |
| eloBonus | QuestionSelector | ⬜ (optional) |

---

## Testfälle

1. **Schwert (+Schaden)** → Mehr Schaden bei korrekten Antworten
2. **Brustplatte (-Schaden)** → Weniger Schaden bei falschen Antworten
3. **Schild (Block)** → Manchmal 0 Schaden + "GEBLOCKT!"
4. **Kritisch-Perk** → Manchmal doppelter Schaden + "KRITISCH!"
5. **Zeitbonus** → Mehr Sekunden pro Frage
6. **Extra-Leben** → Bei 0 HP wiederbelebt mit 50% HP
7. **Regeneration** → HP regeneriert alle 5 Sekunden
8. **Stiefel** → Schnellere Bewegung

---

## Abnahmekriterien

- [ ] `calculatePlayerDamage()` berücksichtigt alle Boni
- [ ] `calculateEnemyDamage()` berücksichtigt Block und Reduktion
- [ ] Kritische Treffer funktionieren
- [ ] Block funktioniert
- [ ] Zeitbonus wird auf Timer addiert
- [ ] Extra-Leben funktioniert
- [ ] Regeneration funktioniert im Game-Loop
- [ ] Bewegungsgeschwindigkeit skaliert korrekt
- [ ] Visuelles Feedback bei Kritisch/Block
- [ ] Keine TypeScript-Fehler
