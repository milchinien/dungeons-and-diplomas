# Item Definitions

Dieser Ordner enthält alle Item-Definitionen für das Spiel.

## Struktur

Jede Item-Kategorie hat ihre eigene JSON-Datei:

- `consumables.json` - Verbrauchsgegenstände (Tränke, Buffs, etc.)
- `equipment.json` - Ausrüstung (Waffen, Rüstung, Accessoires)
- `quest_items.json` - Quest-relevante Items (Schlüssel, Dokumente)
- `resources.json` - Ressourcen (Gold, Crafting-Materialien)

## JSON Format

Jede Item-Definition folgt diesem Schema:

```json
{
  "id": "unique_item_id",
  "name": "Display Name",
  "description": "Item description",
  "type": "consumable | equipment | quest | resource",
  "rarity": "common | uncommon | rare | epic | legendary",
  "iconPath": "/Assets/Items/Icons/item_icon.png",
  "spritePath": "/Assets/Items/Sprites/item_sprite.png",
  "stackable": true,
  "maxStack": 10,
  "weight": 1,
  "value": 50,
  "effects": [
    {
      "type": "heal | damage_boost | xp_boost | ...",
      "value": 25,
      "duration": 0,
      "target": "self | enemy | area"
    }
  ],
  "levelRequirement": 5,
  "subjectRequirement": "math",
  "droppable": true,
  "tradeable": true,
  "questItem": false
}
```

## Beispiel-Items

Siehe `../item-creation-plan.md` für detaillierte Beispiele.

## Neue Items hinzufügen

1. Öffne die passende JSON-Datei für die Item-Kategorie
2. Füge ein neues Item-Objekt zum Array hinzu
3. Stelle sicher, dass die `id` einzigartig ist
4. Platziere Icon und Sprite in `/public/Assets/Items/`
5. Teste das Item im Spiel
