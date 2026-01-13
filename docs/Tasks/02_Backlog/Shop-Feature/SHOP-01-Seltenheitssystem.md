# SHOP-01: Seltenheitssystem erstellen

**Feature:** Shop-Räume
**Priorität:** Hoch (Grundlage für alle weiteren Tasks)
**Geschätzte Dauer:** 1-2 Stunden
**Vorgänger:** Keine
**Nachfolger:** SHOP-02, SHOP-03

---

## Ziel

Ein wiederverwendbares Seltenheitssystem erstellen, das für Items und Perks im Shop verwendet wird. Dieses System definiert 5 Seltenheitsstufen mit unterschiedlichen Farben, Spawn-Wahrscheinlichkeiten und Effekt-Multiplikatoren.

---

## Zu erstellende Datei

**Pfad:** `lib/shop/Rarity.ts`

---

## Implementierung

### 1. Enum für Seltenheitsstufen

```typescript
export enum Rarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}
```

### 2. Interface für Seltenheits-Konfiguration

```typescript
export interface RarityConfig {
  name: string;           // Anzeigename (z.B. "Legendär")
  color: string;          // Hex-Farbcode für Aura/Text
  glowIntensity: number;  // Stärke des Leuchteffekts (0-1)
  spawnWeight: number;    // Gewichtung für Spawn-Wahrscheinlichkeit
  effectMultiplier: number; // Multiplikator für Effektstärke
}
```

### 3. Konfiguration aller Seltenheitsstufen

| Seltenheit | Name | Farbe | Glow | Spawn-Gewicht | Effekt-Multiplikator |
|------------|------|-------|------|---------------|---------------------|
| COMMON | Common | #9CA3AF (Grau) | 0 | 50 | 1.0 |
| UNCOMMON | Uncommon | #22C55E (Grün) | 0.3 | 25 | 1.5 |
| RARE | Rare | #3B82F6 (Blau) | 0.5 | 15 | 2.0 |
| EPIC | Epic | #A855F7 (Violett) | 0.7 | 8 | 3.0 |
| LEGENDARY | Legendär | #F59E0B (Gold) | 1.0 | 2 | 5.0 |

```typescript
export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  [Rarity.COMMON]: {
    name: 'Common',
    color: '#9CA3AF',
    glowIntensity: 0,
    spawnWeight: 50,
    effectMultiplier: 1.0
  },
  [Rarity.UNCOMMON]: {
    name: 'Uncommon',
    color: '#22C55E',
    glowIntensity: 0.3,
    spawnWeight: 25,
    effectMultiplier: 1.5
  },
  [Rarity.RARE]: {
    name: 'Rare',
    color: '#3B82F6',
    glowIntensity: 0.5,
    spawnWeight: 15,
    effectMultiplier: 2.0
  },
  [Rarity.EPIC]: {
    name: 'Epic',
    color: '#A855F7',
    glowIntensity: 0.7,
    spawnWeight: 8,
    effectMultiplier: 3.0
  },
  [Rarity.LEGENDARY]: {
    name: 'Legendär',
    color: '#F59E0B',
    glowIntensity: 1.0,
    spawnWeight: 2,
    effectMultiplier: 5.0
  }
};
```

### 4. Hilfsfunktionen

```typescript
/**
 * Würfelt eine zufällige Seltenheit basierend auf den Spawn-Gewichtungen.
 * @param randomFn - Optionale Zufallsfunktion (Standard: Math.random)
 * @returns Eine Seltenheit
 */
export function rollRarity(randomFn: () => number = Math.random): Rarity {
  const totalWeight = Object.values(RARITY_CONFIG).reduce(
    (sum, config) => sum + config.spawnWeight,
    0
  );

  let roll = randomFn() * totalWeight;

  for (const [rarity, config] of Object.entries(RARITY_CONFIG)) {
    roll -= config.spawnWeight;
    if (roll <= 0) {
      return rarity as Rarity;
    }
  }

  return Rarity.COMMON; // Fallback
}

/**
 * Gibt die Farbe für eine Seltenheit zurück.
 */
export function getRarityColor(rarity: Rarity): string {
  return RARITY_CONFIG[rarity].color;
}

/**
 * Gibt den Effekt-Multiplikator für eine Seltenheit zurück.
 */
export function getRarityMultiplier(rarity: Rarity): number {
  return RARITY_CONFIG[rarity].effectMultiplier;
}

/**
 * Gibt die Glow-Intensität für eine Seltenheit zurück.
 */
export function getRarityGlow(rarity: Rarity): number {
  return RARITY_CONFIG[rarity].glowIntensity;
}
```

---

## Ordnerstruktur

Falls der Ordner `lib/shop/` noch nicht existiert, muss er erstellt werden:

```
lib/
└── shop/
    └── Rarity.ts    <-- Diese Datei erstellen
```

---

## Testfälle

Nach der Implementierung manuell testen:

1. **rollRarity() aufrufen** - Sollte verschiedene Seltenheiten zurückgeben
2. **Gewichtung prüfen** - Bei 1000 Aufrufen sollte COMMON ~50%, LEGENDARY ~2% sein
3. **getRarityColor()** - Sollte korrekte Hex-Farben zurückgeben
4. **getRarityMultiplier()** - Sollte korrekte Multiplikatoren zurückgeben

---

## Abnahmekriterien

- [ ] Datei `lib/shop/Rarity.ts` existiert
- [ ] Enum `Rarity` mit 5 Werten exportiert
- [ ] `RARITY_CONFIG` mit allen Konfigurationen exportiert
- [ ] `rollRarity()` Funktion funktioniert korrekt
- [ ] `getRarityColor()` Funktion funktioniert korrekt
- [ ] `getRarityMultiplier()` Funktion funktioniert korrekt
- [ ] Keine TypeScript-Fehler
- [ ] Code ist kommentiert
