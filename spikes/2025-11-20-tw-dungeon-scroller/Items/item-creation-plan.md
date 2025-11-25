# Item Creation Plan

## Überblick

Dieses Dokument beschreibt den Prozess zur Erstellung neuer Items für das Dungeons & Diplomas Spiel.

---

## Seltenheiten (Rarities) & Drop-Raten

Items haben verschiedene Seltenheitsstufen mit entsprechenden Farben und Drop-Chancen von Gegnern:

| Seltenheit | Farbe | Drop-Chance | Power-Multiplikator |
|------------|-------|-------------|---------------------|
| **Common** | Grau (#808080) | 8% | 1x |
| **Rare** | Grün (#00FF00) | 3% | 2x |
| **Special** | Blau (#0080FF) | 1,5% | 3-4x |
| **Epic** | Lila (#8000FF) | 0,5% | 5-7x |
| **Legendary** | Gold (#FFD700) | 0,01% | Unique Effekte |

```typescript
export type ItemRarity = 'common' | 'rare' | 'special' | 'epic' | 'legendary';

export const RARITY_CONFIG = {
  common:    { color: '#808080', dropChance: 0.08,   name: 'Gewöhnlich', powerMult: 1 },
  rare:      { color: '#00FF00', dropChance: 0.03,   name: 'Selten', powerMult: 2 },
  special:   { color: '#0080FF', dropChance: 0.015,  name: 'Speziell', powerMult: 3.5 },
  epic:      { color: '#8000FF', dropChance: 0.005,  name: 'Episch', powerMult: 6 },
  legendary: { color: '#FFD700', dropChance: 0.0001, name: 'Legendär', powerMult: 10 }
} as const;
```

---

## Equipment-Slots (Rüstungs-Slots)

**WICHTIG:** Jedes Ausrüstungsteil passt **NUR in den dafür vorgesehenen Slot**!

| Slot | Slot-Key | Beschreibung | Beispiele |
|------|----------|--------------|-----------|
| **Helm** | helm | Kopfschutz | Helme, Kappen, Kronen |
| **Brustplatte** | brustplatte | Körperschutz | Rüstungen, Roben, Kettenhemden |
| **Schwert** | schwert | Primärwaffe (rechte Hand) | Schwerter, Äxte, Stäbe |
| **Schild** | schild | Sekundärwaffe/Schutz (linke Hand) | Schilde, Buckler, Zauberbücher |
| **Hose** | hose | Beinschutz | Hosen, Beinschienen, Röcke |
| **Schuhe** | schuhe | Fußschutz | Stiefel, Sandalen, Schuhe |

```typescript
export type EquipmentSlot = 'helm' | 'brustplatte' | 'schwert' | 'schild' | 'hose' | 'schuhe';

export interface EquipmentItem extends ItemDefinition {
  type: 'equipment';
  slot: EquipmentSlot;  // Jedes Item passt NUR in seinen zugewiesenen Slot!
}

export interface PlayerEquipment {
  helm: ItemInstance | null;
  brustplatte: ItemInstance | null;
  schwert: ItemInstance | null;
  schild: ItemInstance | null;
  hose: ItemInstance | null;
  schuhe: ItemInstance | null;
}
```

---

## Item-Kategorien

### 1. Consumables (Verbrauchsgegenstände)
- **Health Potions**: Stellen HP wieder her
- **Mana/Energy Potions**: Für zukünftige Skill-Systeme
- **Buff Potions**: Temporäre Stat-Boosts
- **Question Skip Tokens**: Ermöglicht das Überspringen einer Frage

### 2. Equipment (Ausrüstung)
- **Weapons**: Erhöhen Damage/Combat-Stats
- **Armor**: Reduzieren eingehenden Schaden
- **Accessories**: Spezielle Effekte (z.B. mehr XP, bessere Loot-Chancen)

### 3. Quest Items (Quest-Gegenstände)
- **Keys**: Öffnen spezielle Türen/Räume
- **Documents**: Story-relevante Items
- **Special Items**: Dungeon-spezifische Items

### 4. Loot/Resources (Ressourcen)
- **Gold/Currency**: Zum Kaufen von Items
- **Crafting Materials**: Für zukünftiges Crafting-System
- **Collectibles**: Achievement-Items

---

## Item-Eigenschaften

Jedes Item sollte folgende Eigenschaften haben:

```typescript
interface Item {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description: string;           // Item description
  type: ItemType;               // consumable, equipment, quest, resource
  rarity: ItemRarity;           // common, rare, special, epic, legendary

  // Visual
  iconPath: string;             // Path to item icon
  spritePath?: string;          // Path to world sprite (if droppable)

  // Stats
  stackable: boolean;           // Can multiple items stack?
  maxStack: number;             // Maximum stack size
  weight?: number;              // For inventory management
  value: number;                // Sell value in gold

  // Effects
  effects?: ItemEffect[];       // What does the item do?

  // Equipment-specific (nur für type: 'equipment')
  slot?: EquipmentSlot;         // Helm, Brustplatte, Schwert, Schild, Hose, Schuhe

  // Requirements
  levelRequirement?: number;    // Minimum player level
  subjectRequirement?: string;  // Required subject mastery

  // Metadata
  droppable: boolean;          // Can be dropped in world?
  tradeable: boolean;          // Can be traded? (future)
  questItem: boolean;          // Is this a quest item?
}
```

---

## Item-Effekt-System

### Spielrelevante Stats (Quiz-Combat-System)

**WICHTIG:** Dieses Spiel ist ein Quiz-basiertes Combat-System! Die Stats müssen zum Spielkonzept passen:

| Stat | Beschreibung | Basis-Wert | Slot-Tendenz |
|------|--------------|------------|--------------|
| **Max HP** | Maximale Lebenspunkte | 100 | Helm, Brustplatte, Hose |
| **Schaden** | Schaden an Gegner bei richtiger Antwort | 10 | Schwert |
| **Schadensreduktion** | Weniger Schaden bei falscher Antwort | 15 (Gegner-Dmg) | Schild |
| **Lösungszeit** | Sekunden zum Beantworten | 10s | Schuhe |
| **XP-Boost** | Mehr Erfahrungspunkte | 0% | Accessoires |
| **Hinweis-Chance** | Chance auf Tipp bei Fragen | 0% | Spezial-Items |

**NICHT im Spiel relevant:**
- ~~Verteidigung/Defense~~ (es gibt keine physischen Angriffe)
- ~~Angriffsgeschwindigkeit~~ (Turn-based Quiz)
- ~~Bewegungsgeschwindigkeit~~ (nicht kampfrelevant)
- ~~Mana~~ (kein Mana-System)

### Effekt-Typen

```typescript
type ItemEffectType =
  | 'max_hp'            // Erhöht maximale HP
  | 'damage_boost'      // Erhöht Schaden bei richtiger Antwort
  | 'damage_reduction'  // Reduziert Schaden bei falscher Antwort
  | 'time_boost'        // Mehr Zeit zum Antworten (in Sekunden)
  | 'xp_boost'          // Erhöht XP-Gain (prozentual)
  | 'heal'              // Heilt HP (Consumable)
  | 'skip_question'     // Überspringt aktuelle Frage (Consumable)
  | 'hint_chance'       // Chance auf Hinweis bei Fragen
  | 'reveal_map'        // Deckt Minimap auf
  | 'teleport';         // Teleportiert Spieler

interface ItemEffect {
  type: ItemEffectType;
  value: number;           // Magnitude des Effekts
  duration?: number;       // Dauer in Sekunden (0 = permanent für Equipment)
  target: 'self' | 'enemy' | 'area';
}
```

### Slot-Spezialisierungen

Jeder Equipment-Slot hat eine typische Stat-Tendenz:

| Slot | Primär-Stat | Sekundär-Stats |
|------|-------------|----------------|
| **Helm** | +Max HP (klein) | Hint-Chance |
| **Brustplatte** | +Max HP (groß) | Damage Reduction |
| **Schwert** | +Schaden | - |
| **Schild** | +Schadensreduktion | +Max HP |
| **Hose** | +Max HP (mittel) | XP-Boost |
| **Schuhe** | +Lösungszeit | - |

---

## Beispiel-Items (Rüstung - 1 pro Slot)

### 1. Helm: Lehrmeister-Kapuze

| Eigenschaft | Wert |
|-------------|------|
| **ID** | equipment_helm_lehrmeister |
| **Slot** | helm |
| **Seltenheit** | Rare (Grün) |
| **Drop-Chance** | 3% |

**Beschreibung:**
Eine abgetragene Kapuze aus dunkelblauem Stoff, die einst einem weisen Lehrmeister gehörte. Die feinen Runen entlang der Naht glühen schwach, wenn der Träger eine Frage korrekt beantwortet. Bietet leichten Schutz und erhöht die Konzentration.

**Stats:**
- +5 Verteidigung
- +10% XP-Bonus bei richtigen Antworten

---

### 2. Brustplatte: Schuluniform des Wanderers

| Eigenschaft | Wert |
|-------------|------|
| **ID** | equipment_brustplatte_wanderer |
| **Slot** | brustplatte |
| **Seltenheit** | Common (Grau) |
| **Drop-Chance** | 8% |

**Beschreibung:**
Eine robuste Lederweste mit verstärkten Schulterpolstern, wie sie von reisenden Gelehrten getragen wird. Die vielen Taschen bieten Platz für Notizen und kleine Gegenstände. Praktisch und zuverlässig, wenn auch nicht besonders beeindruckend.

**Stats:**
- +10 Verteidigung
- +1 zusätzlicher Inventar-Slot

---

### 3. Schwert: Feder der Erkenntnis

| Eigenschaft | Wert |
|-------------|------|
| **ID** | equipment_schwert_feder |
| **Slot** | schwert |
| **Seltenheit** | Special (Blau) |
| **Drop-Chance** | 1,5% |

**Beschreibung:**
Ein elegantes Kurzschwert, dessen Klinge wie eine übergroße Schreibfeder geformt ist. Die Waffe wurde von einem Gelehrten-Schmied geschaffen und ist scharf genug, um sowohl Pergament als auch Gegner zu durchbohren. Bei jedem Treffer hinterlässt sie leuchtende Tintenspuren.

**Stats:**
- +15 Angriffsschaden
- Spezialeffekt: Jeder kritische Treffer enthüllt einen Hinweis zur nächsten Quizfrage

---

### 4. Schild: Buch der Abwehr

| Eigenschaft | Wert |
|-------------|------|
| **ID** | equipment_schild_buch |
| **Slot** | schild |
| **Seltenheit** | Epic (Lila) |
| **Drop-Chance** | 0,5% |

**Beschreibung:**
Ein massives Buch mit verstärktem Metalleinband, das als Schild verwendet wird. Die Seiten sind mit Schutzrunen beschrieben und flattern bei jedem abgewehrten Angriff. Das Wissen in diesem Buch manifestiert sich als magische Barriere, die stärker wird, je mehr der Träger weiß.

**Stats:**
- +20 Verteidigung
- Blockiert 25% des Schadens bei falschen Antworten
- Spezialeffekt: Nach 3 richtigen Antworten in Folge, reflektiert der nächste gegnerische Angriff 50% Schaden

---

### 5. Hose: Wanderhosen des Forschers

| Eigenschaft | Wert |
|-------------|------|
| **ID** | equipment_hose_forscher |
| **Slot** | hose |
| **Seltenheit** | Rare (Grün) |
| **Drop-Chance** | 3% |

**Beschreibung:**
Strapazierfähige Hosen aus gewachstem Leinen mit zahlreichen Geheimtaschen. Einst einem berühmten Dungeonerforscher gehörend, sind sie mit Karten vergangener Expeditionen bestickt. Die verstärkten Knie erlauben sicheres Knien beim Studieren alter Inschriften.

**Stats:**
- +8 Verteidigung
- +15% Bewegungsgeschwindigkeit
- Spezialeffekt: Zeigt unerforschte Räume auf der Minimap schwach an

---

### 6. Schuhe: Schleichsohlen des Schülers

| Eigenschaft | Wert |
|-------------|------|
| **ID** | equipment_schuhe_schleich |
| **Slot** | schuhe |
| **Seltenheit** | Common (Grau) |
| **Drop-Chance** | 8% |

**Beschreibung:**
Weiche Lederschuhe mit abgenutzten Sohlen, perfekt um sich leise durch die Bibliothek oder einen Dungeon zu bewegen. Die Sohlen sind mit einem Quietsch-Verhinderungs-Zauber belegt worden - ein Muss für jeden, der nachts heimlich weiterlernen möchte.

**Stats:**
- +3 Verteidigung
- +10% Bewegungsgeschwindigkeit
- Gegner bemerken den Spieler erst aus kürzerer Distanz (Aggro-Radius -0.5 Tiles)

---

## Weitere Beispiel-Items (Consumables)

### Health Potion (Klein)
```typescript
{
  id: 'potion_health_small',
  name: 'Kleiner Heiltrank',
  description: 'Stellt 25 HP wieder her',
  type: 'consumable',
  rarity: 'common',
  iconPath: '/Assets/Items/Icons/potion_health_small.png',
  stackable: true,
  maxStack: 10,
  value: 10,
  effects: [{
    type: 'heal',
    value: 25,
    duration: 0,
    target: 'self'
  }],
  droppable: true,
  tradeable: true,
  questItem: false
}
```

### Mystischer Schlüssel
```typescript
{
  id: 'key_mystical',
  name: 'Mystischer Schlüssel',
  description: 'Öffnet verschlossene magische Türen',
  type: 'quest',
  rarity: 'rare',
  iconPath: '/Assets/Items/Icons/key_mystical.png',
  stackable: false,
  maxStack: 1,
  value: 0,
  effects: [],
  droppable: false,
  tradeable: false,
  questItem: true
}
```

---

## Item-Erstellungsprozess

### Ordnerstruktur für Item-Definitionen

Items durchlaufen einen 3-Phasen-Prozess in folgenden Ordnern:

```
Items/definitions/
├── 01_descriptions/     # Phase 1: Kreative Beschreibungen (Markdown)
├── 02_implementation-plans/  # Phase 2: Technische Planung (Markdown)
└── 03_final-items/      # Phase 3: Fertige JSON-Definitionen
```

**WICHTIG: Jedes Item bekommt eine eigene Datei!**

Dateinamen-Format: `{rarity}_{slot}_{kurzname}.md` bzw. `.json`

Beispiele:
- `01_descriptions/common_helm_topf.md`
- `01_descriptions/rare_schwert_feder.md`
- `03_final-items/common_helm_topf.json`

**Workflow:**
1. **01_descriptions/** - Hier werden zuerst die kreativen Beschreibungen geschrieben (Name, Beschreibung, Stats-Ideen)
2. **02_implementation-plans/** - Technische Details und Balance-Überlegungen
3. **03_final-items/** - Die fertigen JSON-Dateien, die ins Spiel geladen werden

### Schritt 1: Konzept & Design (→ 01_descriptions/)
1. Bestimme die Item-Kategorie
2. Definiere den Zweck des Items
3. Überlege dir Balance-Aspekte (Wert, Seltenheit, Power-Level)
4. Schreibe eine kreative Beschreibung in `01_descriptions/`
5. Skizziere/Erstelle Icon und Sprite

### Schritt 2: Item-Definition erstellen (→ 02_implementation-plans/ → 03_final-items/)
1. Erstelle einen Implementierungsplan in `02_implementation-plans/`
2. Erstelle die finale JSON-Datei in `03_final-items/`
3. Fülle alle erforderlichen Eigenschaften aus
4. Definiere Effekte und Anforderungen
5. Setze Balance-Werte (HP-Heilung, Damage-Boost, etc.)
6. **Bei Equipment:** Slot zuweisen!

### Schritt 3: Assets hinzufügen
1. Platziere Item-Icon in public/Assets/Items/Icons/
2. Platziere World-Sprite in public/Assets/Items/Sprites/ (falls droppable)
3. Stelle sicher, dass Pfade in der Item-Definition korrekt sind

### Schritt 4: Testing
1. Item ins Inventar hinzufügen (über Debug-Kommando)
2. Testen ob Icon korrekt angezeigt wird
3. Testen ob Effekte funktionieren
4. Balance-Testing

---

## Integration mit bestehendem System

### Inventory-System
- Items werden im Player-State gespeichert
- Inventory-Modal zeigt alle Items
- Items können benutzt, gedroppt oder verkauft werden

### Loot-System
- Items können von Enemies gedroppt werden
- Treasure-Rooms enthalten Items
- Loot-Tables definieren Drop-Wahrscheinlichkeiten

### Combat-Integration
- Items können während Combat benutzt werden
- Bestimmte Items geben Combat-Vorteile
- Buff-System für temporäre Effekte

---

## Naming Conventions

### Item IDs
- Lowercase mit Unterstrichen
- Format: {kategorie}_{slot}_{name} (für Equipment)
- Format: {kategorie}_{name}_{variant} (für andere)
- Beispiele:
  - equipment_helm_lehrmeister
  - equipment_schwert_feder
  - potion_health_small
  - key_dungeon_1

### Asset-Dateien
- Format: {item_id}.png
- Konsistente Größe: 32x32px für Icons, 16x16px für World-Sprites
- PNG mit Transparenz

---

## Nächste Schritte

1. Basis-Item-System implementieren (siehe implementation-plan.md)
2. Erste Test-Items erstellen (Healing Potion, Gold)
3. Inventory-UI implementieren
4. Equipment-UI mit 6 Slots implementieren
5. Loot-System implementieren
6. Item-Usage-System implementieren
7. Weitere Items hinzufügen
