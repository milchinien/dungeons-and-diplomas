# Dungeons & Diplomas - E2E Tests

Playwright Tests für die gesamte Anwendung im headless mode.

## Tests

### UI Layout Tests (`ui-layout.spec.ts`)
- ✅ Top Left Panel (Username, Level, HP Bar)
- ✅ Bottom Center Bar (XP, ELO Circles)
- ✅ Top Right Panel (Gold Counter, Minimap)
- ✅ Responsive Positioning
- ✅ HP Bar Visual Updates

### Gold System Tests (`gold-system.spec.ts`)
- ✅ Keine Infinite Loop (Performance Test)
- ✅ Gold erhöht sich nach Enemy Defeat
- ✅ Gold Counter Display
- ✅ Console Log Monitoring (< 5 logs in 3 Sekunden)

### Loading Screen Tests (`loading-screen.spec.ts`)
- ✅ Loading Screen angezeigt während Game Initialization
- ✅ Questions Loading zeigt Progress
- ✅ Kein schwarzer Bildschirm während Loading

### Shop System Tests (`shop-system.spec.ts`)
- 🔄 Shop Room finden
- 🔄 Shop Modal anzeigen
- 🔄 Item kaufen (Gold wird abgezogen)
- 🔄 Nicht genug Gold (Kauf blockiert)
- 🔄 Equipment Display Update

### Interaction Tests (`interactions.spec.ts`)
- ✅ Login Flow
- ✅ ESC Menu öffnen/schließen
- ✅ Statistiken Button
- ✅ Player Movement (WASD)
- ✅ Combat Modal
- ✅ Options Menu (Volume)

## Test ausführen

```bash
# Headless mode (default)
npm test

# Mit sichtbarem Browser
npm run test:headed

# Interactive UI mode
npm run test:ui

# Nur bestimmte Tests
npx playwright test ui-layout

# Report anzeigen
npm run test:report
```

## Hinweise

- Tests laufen gegen `localhost:3000` (dev server wird automatisch gestartet)
- Chromium wird verwendet
- Screenshots bei Fehler
- Videos bei Fehler
- Traces bei Retry

## Test-User

Die Tests verwenden verschiedene Usernamen:
- `TestUser` - UI Layout Tests
- `PlaywrightTest` - Gold System Tests
- `ShopTest` - Shop System Tests
- `InteractionTest` - Login Tests
- `ESCTest` - ESC Menu Tests
- etc.
