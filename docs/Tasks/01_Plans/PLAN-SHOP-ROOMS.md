# Implementierungsplan: Shop-Räume

**Erstellt:** 2025-01-12
**Autor:** Michel Waggoner
**Status:** Plan
**Basiert auf:** [FEATURE-SHOP-ROOMS.md](../02_Backlog/FEATURE-SHOP-ROOMS.md)

---

## Übersicht

Dieser Plan beschreibt die vollständige Implementierung des Shop-Raum-Features. Das Feature wird in 7 Phasen unterteilt, wobei jede Phase auf der vorherigen aufbaut. Der Plan ist so gestaltet, dass er später in einzelne Tasks aufgeteilt werden kann.

---

## Phase 1: Grundlagen & Datenstrukturen

Diese Phase legt das Fundament für alle weiteren Arbeiten. Hier werden die TypeScript-Typen, Konstanten und grundlegenden Datenstrukturen definiert.

### 1.1 Seltenheitssystem definieren

**Ziel:** Ein wiederverwendbares Seltenheitssystem erstellen, das für Items und Perks verwendet wird.

**Aufgaben:**
- Neuen Ordner `lib/shop/` erstellen
- Datei `lib/shop/Rarity.ts` erstellen mit:
  - Enum `Rarity` mit den Werten: `COMMON`, `UNCOMMON`, `RARE`, `EPIC`, `LEGENDARY`
  - Interface `RarityConfig` mit Feldern für:
    - `name`: Anzeigename (z.B. "Common", "Legendär")
    - `color`: Hex-Farbcode für die Aura
    - `glowIntensity`: Stärke des Leuchteffekts (0-1)
    - `spawnWeight`: Gewichtung für die Spawn-Wahrscheinlichkeit
    - `effectMultiplier`: Multiplikator für Effektstärke
  - Konstante `RARITY_CONFIG`: Map von Rarity zu RarityConfig
  - Funktion `rollRarity(randomFn)`: Würfelt eine Seltenheit basierend auf Gewichtung
  - Funktion `getRarityColor(rarity)`: Gibt Farbe für Seltenheit zurück

**Spawn-Gewichtungen:**
- COMMON: 50
- UNCOMMON: 25
- RARE: 15
- EPIC: 8
- LEGENDARY: 2

**Effekt-Multiplikatoren:**
- COMMON: 1.0
- UNCOMMON: 1.5
- RARE: 2.0
- EPIC: 3.0
- LEGENDARY: 5.0

### 1.2 Item-System definieren

**Ziel:** Alle Item-Typen und deren Effekte definieren.

**Aufgaben:**
- Datei `lib/shop/Item.ts` erstellen mit:
  - Enum `ItemType`: `SWORD`, `CHESTPLATE`, `HELMET`, `SHIELD`, `BOOTS`, `AMULET`
  - Interface `ItemDefinition`:
    - `type`: ItemType
    - `name`: Anzeigename
    - `description`: Beschreibung des Effekts
    - `baseEffect`: Basis-Effektwert (wird mit Seltenheit multipliziert)
    - `effectType`: Art des Effekts (z.B. 'damage_flat', 'damage_reduction', 'hp_flat', 'block_chance', 'speed')
    - `spriteKey`: Schlüssel für das Item-Sprite
  - Interface `Item`:
    - `definition`: ItemDefinition
    - `rarity`: Rarity
    - `effectValue`: Berechneter Effektwert (baseEffect * rarityMultiplier)
    - `id`: Eindeutige ID
  - Konstante `ITEM_DEFINITIONS`: Array aller Item-Definitionen
  - Funktion `createItem(type, rarity)`: Erstellt ein Item mit berechnetem Effektwert
  - Funktion `generateRandomItem(randomFn)`: Erstellt zufälliges Item mit zufälliger Seltenheit

**Item-Definitionen:**
| Typ | Name | Basis-Effekt | Effekt-Typ |
|-----|------|--------------|------------|
| SWORD | Schwert | +5 Schaden | damage_flat |
| CHESTPLATE | Brustplatte | -10% Schaden | damage_reduction |
| HELMET | Helm | +10 HP | hp_flat |
| SHIELD | Schild | 10% Block-Chance | block_chance |
| BOOTS | Stiefel | +10% Geschwindigkeit | speed |
| AMULET | Amulett | +5% alle Stats | all_stats |

### 1.3 Perk-System definieren

**Ziel:** Alle Perk-Typen und deren Effekte definieren.

**Aufgaben:**
- Datei `lib/shop/Perk.ts` erstellen mit:
  - Enum `PerkType`: `HP_FLAT`, `HP_PERCENT`, `DAMAGE_FLAT`, `DAMAGE_PERCENT`, `REGENERATION`, `CRITICAL`, `TIME_BONUS`, `EXTRA_LIFE`, `ELO_BOOST`
  - Interface `PerkDefinition`:
    - `type`: PerkType
    - `name`: Anzeigename
    - `description`: Beschreibung
    - `baseEffect`: Basis-Effektwert
    - `effectType`: Art des Effekts
    - `iconKey`: Schlüssel für das Perk-Icon
  - Interface `Perk`:
    - `definition`: PerkDefinition
    - `rarity`: Rarity
    - `effectValue`: Berechneter Effektwert
    - `id`: Eindeutige ID
  - Konstante `PERK_DEFINITIONS`: Array aller Perk-Definitionen
  - Funktion `createPerk(type, rarity)`: Erstellt einen Perk
  - Funktion `generateRandomPerk(randomFn)`: Erstellt zufälligen Perk

**Perk-Definitionen:**
| Typ | Name | Basis-Effekt | Beschreibung |
|-----|------|--------------|--------------|
| HP_FLAT | +HP | +5 HP | Erhöht max HP um festen Wert |
| HP_PERCENT | +HP% | +5% HP | Erhöht max HP prozentual |
| DAMAGE_FLAT | +Schaden | +3 Schaden | Erhöht Basis-Schaden |
| DAMAGE_PERCENT | +Schaden% | +5% Schaden | Erhöht Schaden prozentual |
| REGENERATION | Regeneration | 1 HP/5s | Regeneriert HP über Zeit |
| CRITICAL | Kritisch | 10% Chance | Chance auf doppelten Schaden |
| TIME_BONUS | Zeitbonus | +2 Sekunden | Mehr Zeit bei Quiz-Fragen |
| EXTRA_LIFE | Extra Leben | 1 Leben | Einmal bei 0 HP wiederbeleben |
| ELO_BOOST | ELO-Boost | +1 ELO | Verbessert alle Fach-ELOs |

### 1.4 Shop-Inventar-System definieren

**Ziel:** Datenstruktur für das Shop-Inventar erstellen.

**Aufgaben:**
- Datei `lib/shop/ShopInventory.ts` erstellen mit:
  - Interface `ShopInventory`:
    - `items`: Array von 3 Items (oder null wenn gekauft)
    - `perks`: Array von 3 Perks (oder null wenn gekauft)
    - `shopRoomId`: ID des zugehörigen Raums
  - Funktion `generateShopInventory(roomId, randomFn)`: Generiert 3 Items und 3 Perks
  - Funktion `purchaseItem(inventory, index)`: Markiert Item als gekauft (setzt auf null)
  - Funktion `purchasePerk(inventory, index)`: Markiert Perk als gekauft

### 1.5 Konstanten erweitern

**Ziel:** Neue Shop-bezogene Konstanten in `lib/constants.ts` hinzufügen.

**Aufgaben:**
- Room-Typ `'shop'` zum bestehenden RoomType hinzufügen
- Neue Konstanten hinzufügen:
  - `SHOP_SPAWN_CHANCE`: 0.08 (8% Wahrscheinlichkeit)
  - `SHOP_MIN_ROOM_SIZE`: 6 (Mindestgröße in Tiles)
  - `SHOP_ITEMS_COUNT`: 3
  - `SHOP_PERKS_COUNT`: 3
  - `FLOATING_ITEM_AMPLITUDE`: 0.3 (Amplitude der Schwebanimation)
  - `FLOATING_ITEM_SPEED`: 2 (Geschwindigkeit der Schwebanimation)
- Tile-Koordinaten für Shop-Elemente (falls im Tileset vorhanden, sonst Platzhalter)

### 1.6 Player-Interface erweitern

**Ziel:** Player-Objekt um Items, Perks und deren Effekte erweitern.

**Aufgaben:**
- In `lib/constants.ts` das `Player`-Interface erweitern:
  - `equippedItems`: Array von Items
  - `activePerks`: Array von Perks
  - `bonusStats`: Objekt mit berechneten Bonus-Werten
    - `damageFlat`: Zusätzlicher flacher Schaden
    - `damagePercent`: Prozentuale Schadenserhöhung
    - `damageReduction`: Schadensreduktion
    - `maxHpBonus`: Zusätzliche max HP
    - `speedMultiplier`: Geschwindigkeitsmultiplikator
    - `blockChance`: Block-Chance
    - `criticalChance`: Kritische Treffer-Chance
    - `timeBonus`: Zusätzliche Quiz-Zeit
    - `extraLives`: Anzahl Extra-Leben
    - `eloBonus`: ELO-Bonus
    - `regeneration`: HP-Regeneration pro Sekunde
- Funktion `calculateBonusStats(items, perks)`: Berechnet alle Boni aus Items und Perks
- Funktion `applyItemToPlayer(player, item)`: Fügt Item hinzu und aktualisiert Boni
- Funktion `applyPerkToPlayer(player, perk)`: Fügt Perk hinzu und aktualisiert Boni

---

## Phase 2: Dungeon-Generierung erweitern

Diese Phase integriert Shop-Räume in das bestehende Dungeon-Generierungssystem.

### 2.1 Room-Interface erweitern

**Ziel:** Das Room-Interface um Shop-spezifische Eigenschaften erweitern.

**Aufgaben:**
- In `lib/constants.ts` das `Room`-Interface erweitern:
  - `type` erweitern um `'shop'`
  - Neues optionales Feld `shopInventory?: ShopInventory`
  - Neues optionales Feld `shopDoorOpen?: boolean` (Standard: false)

### 2.2 Shop-Raum-Generierung implementieren

**Ziel:** Shop-Räume während der Dungeon-Generierung erstellen.

**Aufgaben:**
- In `lib/dungeon/generation.ts` die Funktion `assignRoomTypes` erweitern:
  - Nach der normalen Raumtyp-Zuweisung Shop-Räume hinzufügen
  - Für jeden Raum (außer Startraum):
    - Prüfen ob Raumgröße >= SHOP_MIN_ROOM_SIZE
    - Mit SHOP_SPAWN_CHANCE Wahrscheinlichkeit zum Shop machen
    - Maximal 2 Shops pro Dungeon (um Balancing zu wahren)
  - Für Shop-Räume:
    - Typ auf `'shop'` setzen
    - `shopInventory` generieren
    - `shopDoorOpen` auf `false` setzen

### 2.3 Shop-Layout im Raum platzieren

**Ziel:** Tresen und Schild-Position im Shop-Raum berechnen.

**Aufgaben:**
- Neue Datei `lib/shop/ShopLayout.ts` erstellen:
  - Interface `ShopLayout`:
    - `signPosition`: {x, y} Position des Schildes
    - `leftCounterTiles`: Array von {x, y} für linken Tresen
    - `rightCounterTiles`: Array von {x, y} für rechten Tresen
    - `itemPositions`: Array von 3 {x, y} Positionen für Items
    - `perkPositions`: Array von 3 {x, y} Positionen für Perks
  - Funktion `calculateShopLayout(room)`: Berechnet Layout basierend auf Raumgröße
    - Schild: Zentriert, oberes Drittel des Raums
    - Linker Tresen: Links von der Mitte, 2-3 Tiles breit
    - Rechter Tresen: Rechts von der Mitte, 2-3 Tiles breit
    - Items/Perks: Über den jeweiligen Tresen, gleichmäßig verteilt

### 2.4 Kollision für Shop-Elemente

**Ziel:** Tresen als Kollisionsobjekte behandeln.

**Aufgaben:**
- In `lib/physics/CollisionDetector.ts` erweitern:
  - Neue Funktion `checkShopCollision(x, y, room)`:
    - Prüft ob Position auf einem Tresen-Tile liegt
    - Gibt `true` zurück wenn Kollision
  - Bestehende Kollisionsprüfung erweitern:
    - Wenn im Shop-Raum: Zusätzlich Tresen-Kollision prüfen

### 2.5 Shop-Tür-Mechanik

**Ziel:** Verschlossene Shop-Türen implementieren.

**Aufgaben:**
- Interface `DoorState` erweitern (oder neu erstellen):
  - `isShopDoor`: boolean
  - `isLocked`: boolean
  - `adjacentRoomId`: ID des Nachbarraums
- Neue Datei `lib/shop/ShopDoor.ts`:
  - Funktion `isShopDoorLocked(shopRoom, adjacentRoom, enemies)`:
    - Prüft ob im Nachbarraum noch lebende Gegner sind
    - Gibt `true` zurück wenn verschlossen
  - Funktion `checkShopDoorAccess(player, shopRoom, enemies)`:
    - Prüft ob Spieler den Shop betreten darf
    - Gibt Objekt zurück: `{canEnter: boolean, message?: string}`
- In Kollisionssystem integrieren:
  - Wenn Spieler verschlossene Shop-Tür berührt: Bewegung blockieren
  - Hinweistext anzeigen

---

## Phase 3: Grafiken & Assets

Diese Phase behandelt alle visuellen Elemente für den Shop.

### 3.1 Tileset-Erweiterung planen

**Ziel:** Benötigte Tiles identifizieren und Erweiterungsstrategie festlegen.

**Aufgaben:**
- Liste der benötigten Tiles erstellen:
  - Shop-Schild (2-3 Tiles breit, 1-2 Tiles hoch)
  - Tresen-Tiles (Holz/Stein, passend zum Dungeon-Stil)
  - Shop-Tür (offen und geschlossen Variante)
- Entscheiden:
  - Option A: Bestehendes Tileset erweitern (`Castle-Dungeon2_Tiles/Tileset.png`)
  - Option B: Separates Shop-Tileset erstellen
- Tiled Editor verwenden um:
  - Tile-Koordinaten zu planen
  - Eventuell neue Tiles zu zeichnen

### 3.2 Item-Sprites erstellen

**Ziel:** Sprites für alle 6 Item-Typen erstellen.

**Aufgaben:**
- Für jeden Item-Typ ein Sprite erstellen (32x32 oder 64x64 Pixel):
  - Schwert: Metallklinge mit Griff
  - Brustplatte: Rüstung/Panzer
  - Helm: Kopfschutz
  - Schild: Rundschild oder Turmschild
  - Stiefel: Lederstiefel
  - Amulett: Halskette mit Edelstein
- Sprites in `public/Assets/Items/` speichern
- SpriteSheet erstellen oder Einzeldateien verwenden

### 3.3 Perk-Icons erstellen

**Ziel:** Icons für alle 9 Perk-Typen erstellen.

**Aufgaben:**
- Für jeden Perk-Typ ein Icon erstellen (32x32 Pixel):
  - HP_FLAT: Herz mit +
  - HP_PERCENT: Herz mit %
  - DAMAGE_FLAT: Schwert mit +
  - DAMAGE_PERCENT: Schwert mit %
  - REGENERATION: Grünes Herz mit Kreislauf
  - CRITICAL: Blitz oder Stern
  - TIME_BONUS: Sanduhr
  - EXTRA_LIFE: Goldenes Herz
  - ELO_BOOST: Aufwärtspfeil
- Icons in `public/Assets/Perks/` speichern

### 3.4 Seltenheits-Auren erstellen

**Ziel:** Glow-Effekte für jede Seltenheitsstufe.

**Aufgaben:**
- Aura-Sprites oder Shader-Definitionen erstellen:
  - Common: Kein Effekt (transparent)
  - Uncommon: Grüner Schimmer (leicht, subtle)
  - Rare: Blauer Glow (deutlich sichtbar)
  - Epic: Violetter Glow (intensiv)
  - Legendary: Goldener, pulsierender Glow
- Entscheidung treffen:
  - Option A: Canvas-basierte Glow-Effekte (dynamisch)
  - Option B: Vorgefertigte Aura-Sprites
- Pulsier-Animation für Legendary definieren

### 3.5 Asset-Loader erweitern

**Ziel:** Neue Assets in das Ladesystem integrieren.

**Aufgaben:**
- In relevanten Komponenten/Hooks:
  - Item-Sprites laden
  - Perk-Icons laden
  - Shop-Tileset (falls separat) laden
- Preloading implementieren:
  - Assets beim Spielstart laden
  - Oder: Lazy-Loading wenn Shop-Raum betreten wird

---

## Phase 4: Rendering

Diese Phase implementiert die visuelle Darstellung des Shops.

### 4.1 Shop-Raum-Rendering

**Ziel:** Shop-Raum mit Schild und Tresen rendern.

**Aufgaben:**
- In `lib/rendering/GameRenderer.ts` erweitern:
  - Neue Funktion `renderShopRoom(ctx, room, layout, camera)`:
    - Shop-Schild an berechneter Position zeichnen
    - Linken Tresen zeichnen (mehrere Tiles)
    - Rechten Tresen zeichnen
    - Besondere Boden-Tiles für Shop-Bereich (optional)
  - In Hauptrender-Schleife einbinden:
    - Wenn `room.type === 'shop'`: Shop-spezifisches Rendering aufrufen

### 4.2 Schwebende Waren rendern

**Ziel:** Items und Perks mit Schwebanimation über den Tresen anzeigen.

**Aufgaben:**
- Neue Datei `lib/rendering/ShopRenderer.ts`:
  - Funktion `renderFloatingItems(ctx, items, positions, time, camera)`:
    - Für jedes Item (das nicht null ist):
      - Y-Position mit Sinus-Welle animieren
      - Item-Sprite zeichnen
      - Seltenheits-Aura zeichnen
  - Funktion `renderFloatingPerks(ctx, perks, positions, time, camera)`:
    - Analog zu Items
  - Funktion `renderRarityGlow(ctx, x, y, rarity, time)`:
    - Glow-Effekt basierend auf Seltenheit
    - Pulsieren für Legendary (Sinus auf Alpha-Wert)
- Animation-Parameter:
  - Schwebhöhe: ±5 Pixel
  - Schweb-Geschwindigkeit: 2 Zyklen pro Sekunde
  - Puls-Geschwindigkeit (Legendary): 1 Zyklus pro Sekunde

### 4.3 Shop-Tür rendern

**Ziel:** Verschlossene und offene Shop-Türen visuell unterscheiden.

**Aufgaben:**
- In `GameRenderer.ts` erweitern:
  - Funktion `renderShopDoor(ctx, doorPosition, isLocked, camera)`:
    - Wenn verschlossen: Tür-Sprite mit Schloss/Kette
    - Wenn offen: Normale offene Tür oder spezielles Shop-Portal
- Hinweistext-Rendering:
  - Wenn Spieler nahe verschlossener Tür:
    - Text "Besiege alle Gegner!" anzeigen
    - Semi-transparenter Hintergrund für Lesbarkeit

### 4.4 Tooltips für Waren

**Ziel:** Beim Annähern an eine Ware deren Details anzeigen.

**Aufgaben:**
- Neue Datei `lib/rendering/TooltipRenderer.ts`:
  - Interface `Tooltip`:
    - `title`: Name des Items/Perks
    - `description`: Effektbeschreibung
    - `rarity`: Seltenheit (für Farbe)
    - `effectValue`: Konkreter Wert
  - Funktion `renderTooltip(ctx, tooltip, x, y)`:
    - Hintergrund-Box zeichnen
    - Titel in Seltenheits-Farbe
    - Beschreibung in Weiß
    - Effektwert hervorgehoben
- Tooltip-Trigger:
  - Berechnen ob Spieler nahe genug an einer Ware ist
  - Tooltip für nächste Ware anzeigen

### 4.5 Minimap-Anpassung

**Ziel:** Shop-Räume auf der Minimap erkennbar machen.

**Aufgaben:**
- In `lib/rendering/MinimapRenderer.ts` erweitern:
  - Neue Farbe für Shop-Räume definieren: Grün oder Türkis
  - In `renderRoom` Funktion:
    - Wenn `room.type === 'shop'`: Shop-Farbe verwenden
- Optional: Spezielles Icon für Shop auf Minimap

---

## Phase 5: Interaktion & Spiellogik

Diese Phase implementiert die Kaufmechanik und Effekt-Anwendung.

### 5.1 Interaktions-Erkennung

**Ziel:** Erkennen wenn Spieler bei einer Ware steht.

**Aufgaben:**
- Neue Datei `lib/shop/ShopInteraction.ts`:
  - Funktion `getNearbyItem(playerPos, shopInventory, layout)`:
    - Für jede Item-Position:
      - Distanz zum Spieler berechnen
      - Wenn < 1 Tile und Item vorhanden: Item zurückgeben
    - Sonst: null
  - Funktion `getNearbyPerk(playerPos, shopInventory, layout)`:
    - Analog zu Items
  - Interface `InteractionTarget`:
    - `type`: 'item' | 'perk'
    - `index`: Position im Array
    - `data`: Item oder Perk Objekt
  - Funktion `getInteractionTarget(playerPos, shopInventory, layout)`:
    - Kombiniert Item und Perk Prüfung
    - Gibt nächstes interagierbares Objekt zurück

### 5.2 Kauf-Bestätigung UI

**Ziel:** Bestätigungsdialog für Käufe anzeigen.

**Aufgaben:**
- Neue React-Komponente `components/ShopConfirmModal.tsx`:
  - Props:
    - `item?: Item` oder `perk?: Perk`
    - `onConfirm`: Callback für Bestätigung
    - `onCancel`: Callback für Abbruch
  - Anzeige:
    - Item/Perk-Bild mit Seltenheits-Aura
    - Name und Beschreibung
    - Effektwert (z.B. "+15 HP")
    - "Erwerben" und "Abbrechen" Buttons
  - Styling: Passend zum Spiel-UI (dunkel, Fantasy-Stil)

### 5.3 Kauf-Logik implementieren

**Ziel:** Items und Perks kaufen und auf Spieler anwenden.

**Aufgaben:**
- In `lib/shop/ShopPurchase.ts`:
  - Funktion `purchaseShopItem(player, shopInventory, itemIndex)`:
    - Item aus Inventar holen
    - `applyItemToPlayer` aufrufen
    - Item im Inventar auf null setzen
    - Return: Aktualisierter Player und Inventar
  - Funktion `purchaseShopPerk(player, shopInventory, perkIndex)`:
    - Analog zu Items
- In Game-State (useGameState oder GameEngine):
  - Auf Kauf-Events reagieren
  - Player-State aktualisieren
  - Shop-Inventar-State aktualisieren

### 5.4 Item-Effekte im Kampf anwenden

**Ziel:** Item-Boni im Kampfsystem berücksichtigen.

**Aufgaben:**
- In `lib/combat/DamageCalculator.ts` erweitern:
  - Spieler-Schaden:
    - `baseDamage + player.bonusStats.damageFlat`
    - Ergebnis * `(1 + player.bonusStats.damagePercent / 100)`
    - Kritische Treffer prüfen: Wenn `random < player.bonusStats.criticalChance` → Schaden verdoppeln
  - Gegner-Schaden an Spieler:
    - Block-Chance prüfen: Wenn `random < player.bonusStats.blockChance` → 0 Schaden
    - Sonst: `baseDamage * (1 - player.bonusStats.damageReduction / 100)`
- In `useCombat.ts`:
  - Zeitbonus anwenden: `COMBAT_TIME_LIMIT + player.bonusStats.timeBonus`

### 5.5 Perk-Effekte implementieren

**Ziel:** Alle Perk-Effekte im Spiel aktiv machen.

**Aufgaben:**
- HP-Perks:
  - Bei Anwendung: `player.maxHp` erhöhen
  - Bei Anwendung: `player.hp` um gleichen Wert erhöhen (Bonus-HP sofort verfügbar)
- Regeneration:
  - In Game-Loop: Alle X Sekunden HP regenerieren
  - `player.hp = min(player.hp + regenAmount, player.maxHp)`
- Extra Leben:
  - In Kampf-Ende-Logik:
    - Wenn `player.hp <= 0` und `player.bonusStats.extraLives > 0`:
      - `player.hp = player.maxHp * 0.5` (50% HP wiederherstellen)
      - `player.bonusStats.extraLives -= 1`
      - Kampf fortsetzen statt Game Over
- ELO-Boost:
  - Bei Anwendung: Alle Fach-ELOs temporär erhöhen
  - Oder: Bei Fragen-Auswahl berücksichtigen

### 5.6 Bewegungsgeschwindigkeit anpassen

**Ziel:** Stiefel-Effekt auf Spielerbewegung anwenden.

**Aufgaben:**
- In `lib/game/GameEngine.ts` oder `useGameState.ts`:
  - Bewegungsgeschwindigkeit berechnen:
    - `actualSpeed = PLAYER_SPEED_TILES * player.bonusStats.speedMultiplier`
  - Bei Bewegungsberechnung verwenden

---

## Phase 6: Gegner-Verhalten

Diese Phase behandelt das Verhalten von Gegnern in Bezug auf Shops.

### 6.1 Gegner-Spawning anpassen

**Ziel:** Keine Gegner in Shop-Räumen spawnen.

**Aufgaben:**
- In der Gegner-Generierungs-Logik:
  - Vor dem Spawnen eines Gegners:
    - Prüfen ob `room.type === 'shop'`
    - Wenn ja: Keinen Gegner spawnen
  - Alternativ: Shop-Räume aus der Liste der spawn-fähigen Räume entfernen

### 6.2 Aggro-Blockade an Shop-Türen

**Ziel:** Gegner können Shop-Räume nicht betreten.

**Aufgaben:**
- In `lib/Enemy.ts` erweitern:
  - In der Bewegungslogik:
    - Vor Bewegung: Prüfen ob Zielposition in einem Shop-Raum liegt
    - Wenn ja: Bewegung nicht ausführen
  - In der Following-Logik:
    - Wenn Spieler in Shop-Raum und Gegner nicht:
      - Aggro-State beenden
      - Zu IDLE oder WANDERING wechseln
      - Optional: Zurück zum eigenen Raum bewegen

### 6.3 Shop-Tür-Zugang prüfen

**Ziel:** Shop-Tür öffnet sich wenn Nachbarraum leer ist.

**Aufgaben:**
- Neue Logik in Game-Loop:
  - Für jeden Shop-Raum:
    - Alle Nachbar-Räume ermitteln
    - Prüfen ob lebende Gegner in Nachbar-Räumen
    - Wenn keine Gegner: `shopDoorOpen = true`
- Bei Spieler-Bewegung:
  - Wenn Spieler Shop-Tür berührt:
    - Status der Tür prüfen
    - Wenn offen: Durchgang erlauben
    - Wenn geschlossen: Bewegung blockieren, Hinweis anzeigen

---

## Phase 7: Integration & Polish

Diese Phase verbindet alle Komponenten und fügt Feinschliff hinzu.

### 7.1 Game-State-Integration

**Ziel:** Shop-System vollständig in den Game-State integrieren.

**Aufgaben:**
- In `useGameState.ts`:
  - Shop-Inventare als Teil des Dungeon-States speichern
  - Kauf-Events verarbeiten
  - Player-Boni bei jedem Frame berücksichtigen
- State-Persistenz:
  - Shop-Inventar-Zustand speichern (welche Items gekauft wurden)
  - Bei Raum-Wechsel: Zustand beibehalten

### 7.2 Tastatur-Steuerung

**Ziel:** Interaktion per Tastendruck.

**Aufgaben:**
- Neue Taste für Interaktion definieren (z.B. "E" oder "Enter")
- In Tastatur-Handler:
  - Wenn Interaktionstaste gedrückt:
    - Prüfen ob Spieler in Shop-Raum
    - Prüfen ob Interaktionsziel vorhanden
    - Wenn ja: Kauf-Bestätigung öffnen
- Visueller Hinweis:
  - Wenn nahe einer Ware: "[E] zum Kaufen" anzeigen

### 7.3 Sound-Effekte

**Ziel:** Audio-Feedback für Shop-Aktionen.

**Aufgaben:**
- Sound-Dateien erstellen/beschaffen:
  - Shop-Betreten: Glöckchen oder magischer Klang
  - Item-Kauf: Münzklirren oder "Bling"
  - Perk-Anwendung: Macht-Sound oder "Whoosh"
  - Tür-verschlossen: Dumpfes "Thunk"
- In entsprechende Aktionen einbinden

### 7.4 Visuelles Feedback

**Ziel:** Klares Feedback bei Käufen.

**Aufgaben:**
- Kauf-Animation:
  - Item fliegt zum Spieler und verschwindet
  - Kurzer Partikel-Effekt
  - Screen-Flash in Seltenheits-Farbe (subtil)
- Effekt-Anwendungs-Indikator:
  - Kurzer Text über Spieler: "+15 HP!"
  - Oder: Icon neben Spieler-Sprite

### 7.5 CharacterPanel-Erweiterung

**Ziel:** Aktive Items und Perks im UI anzeigen.

**Aufgaben:**
- In `components/CharacterPanel.tsx`:
  - Neuer Bereich für ausgerüstete Items
  - Kleine Icons für jeden Item-Slot
  - Hover-Tooltip mit Details
  - Neuer Bereich für aktive Perks
  - Perk-Icons in einer Reihe

### 7.6 Balancing & Testing

**Ziel:** System balancieren und testen.

**Aufgaben:**
- Balancing-Parameter anpassen:
  - Shop-Spawn-Rate: Nicht zu häufig, nicht zu selten
  - Item-Effektstärken: Spürbar, aber nicht übermächtig
  - Seltenheits-Verteilung: Legendary muss sich besonders anfühlen
- Testfälle durchspielen:
  - Shop finden und betreten
  - Alle Item-Typen kaufen und Effekte prüfen
  - Alle Perk-Typen kaufen und Effekte prüfen
  - Tür-Mechanik testen (Gegner besiegen → Tür öffnet)
  - Edge-Cases: Leerer Shop, mehrere Shops, Shop am Dungeon-Ende
- Bugs beheben

### 7.7 Code-Dokumentation

**Ziel:** Neue Systeme dokumentieren.

**Aufgaben:**
- JSDoc-Kommentare für alle neuen Funktionen
- CLAUDE.md aktualisieren:
  - Shop-System in Architecture-Sektion hinzufügen
  - Neue Dateien/Module dokumentieren
  - Neue Konstanten dokumentieren
- README oder interne Docs:
  - Shop-Feature beschreiben
  - Balancing-Parameter erklären

---

## Abhängigkeiten zwischen Phasen

```
Phase 1 (Grundlagen)
    ↓
Phase 2 (Dungeon-Generierung) ←→ Phase 3 (Grafiken)
    ↓                              ↓
Phase 4 (Rendering) ←──────────────┘
    ↓
Phase 5 (Interaktion & Spiellogik)
    ↓
Phase 6 (Gegner-Verhalten)
    ↓
Phase 7 (Integration & Polish)
```

**Hinweise:**
- Phase 1 muss komplett abgeschlossen sein bevor andere Phasen beginnen
- Phase 2 und 3 können parallel bearbeitet werden
- Phase 4 benötigt Ergebnisse aus Phase 2 und 3
- Phase 5 und 6 können teilweise parallel zu Phase 4 bearbeitet werden
- Phase 7 ist die finale Integration aller Komponenten

---

## Risiken & Herausforderungen

### Technische Risiken

1. **Tileset-Erweiterung:** Neue Tiles müssen zum bestehenden Stil passen. Falls schwierig, alternative Lösungen (Overlay-Sprites) in Betracht ziehen.

2. **Performance:** Viele schwebende Animationen könnten Performance beeinflussen. Optimierung durch Canvas-Caching oder reduzierte Update-Rate.

3. **Kollisions-System:** Tresen-Kollision muss sauber in bestehendes System integriert werden ohne Seiteneffekte.

### Design-Risiken

1. **Balancing:** Items/Perks könnten zu stark oder zu schwach sein. Iteratives Balancing nach ersten Playtests notwendig.

2. **Shop-Häufigkeit:** Zu viele Shops machen Spieler übermächtig, zu wenige machen Feature irrelevant.

3. **Komplexität:** Feature fügt erhebliche Komplexität hinzu. Klare Trennung der Systeme ist wichtig.

---

## Nächste Schritte

1. **Plan-Review:** Diesen Plan im Team besprechen
2. **Phase 1 starten:** Mit Datenstrukturen beginnen (kann ohne Grafiken getestet werden)
3. **Asset-Planung:** Parallel zu Phase 1 die benötigten Grafiken planen/erstellen
4. **Iterativ vorgehen:** Nach jeder Phase testen bevor nächste beginnt
