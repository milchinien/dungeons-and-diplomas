# Perk Icons

Diese Dateien werden für die Perk-Darstellung im Shop benötigt.

## Benötigte Dateien (32x32 px)

| Dateiname | Beschreibung | Symbol-Vorschlag |
|-----------|--------------|------------------|
| `hp_flat.png` | +HP (flach) | Rotes Herz mit "+" |
| `hp_percent.png` | +HP% | Rotes Herz mit "%" |
| `damage_flat.png` | +Schaden | Schwert mit "+" |
| `damage_percent.png` | +Schaden% | Schwert mit "%" |
| `regeneration.png` | HP-Regeneration | Grünes Herz mit Kreislauf |
| `critical.png` | Kritische Treffer | Blitz oder Stern |
| `time_bonus.png` | Zeitbonus | Sanduhr oder Uhr |
| `extra_life.png` | Extra Leben | Goldenes Herz mit Flügeln |
| `elo_boost.png` | ELO-Boost | Grüner Pfeil nach oben |

## Design-Hinweise

- 32x32 Pixel
- Klare, erkennbare Symbole
- Konsistente Farbpalette
- PNG mit Transparenz

## Erstellung

Tools: Piskel, Aseprite, oder GIMP
Siehe: `/public/Assets/Items/Icons/ICON_CREATION_GUIDE.md`

## Fallback

Ohne diese Assets werden farbige Kreise mit Symbolen gerendert:
- ❤ für HP-Perks
- ⚔ für Schadens-Perks
- 💚 für Regeneration
- ⚡ für Kritisch
- ⏱ für Zeitbonus
- ✨ für Extra Leben
- 📈 für ELO-Boost
