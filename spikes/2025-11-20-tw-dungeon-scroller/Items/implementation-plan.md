# Item System - Implementation Plan

## Überblick

Dieser Plan beschreibt die technische Implementierung des Item-Systems für Dungeons & Diplomas.

## Architektur

### Komponenten-Übersicht

```
lib/
├── items/
│   ├── types.ts              # Type definitions
│   ├── ItemRegistry.ts       # Item database/registry
│   ├── ItemFactory.ts        # Item instance creation
│   ├── ItemEffectHandler.ts  # Effect execution
│   └── loot/
│       ├── LootTable.ts      # Loot table definitions
│       └── LootGenerator.ts  # Random loot generation
├── inventory/
│   ├── Inventory.ts          # Inventory management
│   ├── InventorySlot.ts      # Slot logic
│   └── ItemStack.ts          # Stackable item logic
components/
├── inventory/
│   ├── InventoryGrid.tsx     # Grid layout
│   ├── InventorySlot.tsx     # Single slot component
│   ├── ItemTooltip.tsx       # Item hover info
│   └── ItemDragPreview.tsx   # Drag & drop preview
data/
└── items/                    # Item definitions (JSON)
public/
└── Assets/
    └── Items/
        ├── Icons/            # Item icons (32x32)
        └── Sprites/          # World sprites (16x16)
```

## Phase 1: Core Item System

### 1.1 Type Definitions (`lib/items/types.ts`)

```typescript
// Item types
export type ItemType = 'consumable' | 'equipment' | 'quest' | 'resource';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemEffectType =
  | 'heal'
  | 'damage_boost'
  | 'xp_boost'
  | 'damage_reduction'
  | 'skip_question'
  | 'reveal_map'
  | 'teleport'
  | 'stat_boost';

export interface ItemEffect {
  type: ItemEffectType;
  value: number;
  duration?: number; // 0 = instant
  target: 'self' | 'enemy' | 'area';
}

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;

  iconPath: string;
  spritePath?: string;

  stackable: boolean;
  maxStack: number;
  weight?: number;
  value: number;

  effects?: ItemEffect[];

  levelRequirement?: number;
  subjectRequirement?: string;

  droppable: boolean;
  tradeable: boolean;
  questItem: boolean;
}

export interface ItemInstance {
  definitionId: string;
  instanceId: string;  // Unique instance ID
  quantity: number;     // For stackable items
  metadata?: Record<string, any>; // Custom data (e.g., durability)
}

export interface InventorySlotData {
  slotIndex: number;
  item: ItemInstance | null;
}
```

### 1.2 Item Registry (`lib/items/ItemRegistry.ts`)

```typescript
export class ItemRegistry {
  private static instance: ItemRegistry;
  private items: Map<string, ItemDefinition>;

  private constructor() {
    this.items = new Map();
  }

  static getInstance(): ItemRegistry {
    if (!ItemRegistry.instance) {
      ItemRegistry.instance = new ItemRegistry();
    }
    return ItemRegistry.instance;
  }

  register(item: ItemDefinition): void {
    this.items.set(item.id, item);
  }

  getItem(id: string): ItemDefinition | undefined {
    return this.items.get(id);
  }

  getAllItems(): ItemDefinition[] {
    return Array.from(this.items.values());
  }

  getItemsByType(type: ItemType): ItemDefinition[] {
    return this.getAllItems().filter(item => item.type === type);
  }

  getItemsByRarity(rarity: ItemRarity): ItemDefinition[] {
    return this.getAllItems().filter(item => item.rarity === rarity);
  }

  loadFromJSON(jsonData: any[]): void {
    jsonData.forEach(item => this.register(item as ItemDefinition));
  }
}
```

### 1.3 Item Factory (`lib/items/ItemFactory.ts`)

```typescript
export class ItemFactory {
  static createInstance(
    definitionId: string,
    quantity: number = 1
  ): ItemInstance | null {
    const registry = ItemRegistry.getInstance();
    const definition = registry.getItem(definitionId);

    if (!definition) {
      console.error(`Item definition not found: ${definitionId}`);
      return null;
    }

    return {
      definitionId,
      instanceId: crypto.randomUUID(),
      quantity: Math.min(quantity, definition.maxStack),
      metadata: {}
    };
  }

  static clone(instance: ItemInstance): ItemInstance {
    return {
      ...instance,
      instanceId: crypto.randomUUID()
    };
  }
}
```

### 1.4 Item Effect Handler (`lib/items/ItemEffectHandler.ts`)

```typescript
export class ItemEffectHandler {
  static applyEffect(
    effect: ItemEffect,
    context: GameContext
  ): void {
    switch (effect.type) {
      case 'heal':
        this.applyHeal(effect, context);
        break;
      case 'damage_boost':
        this.applyDamageBoost(effect, context);
        break;
      case 'xp_boost':
        this.applyXpBoost(effect, context);
        break;
      // ... more effect types
      default:
        console.warn(`Unknown effect type: ${effect.type}`);
    }
  }

  private static applyHeal(effect: ItemEffect, context: GameContext): void {
    const newHP = Math.min(
      context.player.hp + effect.value,
      context.player.maxHP
    );
    context.player.hp = newHP;
    // Trigger heal animation/feedback
  }

  private static applyDamageBoost(effect: ItemEffect, context: GameContext): void {
    // Add temporary buff
    context.player.buffs.push({
      type: 'damage_boost',
      value: effect.value,
      duration: effect.duration || 30,
      startTime: Date.now()
    });
  }

  // ... more effect implementations
}

interface GameContext {
  player: any; // Replace with actual Player type
  enemies: any[]; // Replace with actual Enemy[] type
  dungeon: any; // Replace with actual Dungeon type
}
```

## Phase 2: Inventory System

### 2.1 Inventory Class (`lib/inventory/Inventory.ts`)

```typescript
export class Inventory {
  private slots: InventorySlotData[];
  private readonly maxSlots: number;

  constructor(maxSlots: number = 30) {
    this.maxSlots = maxSlots;
    this.slots = Array.from({ length: maxSlots }, (_, i) => ({
      slotIndex: i,
      item: null
    }));
  }

  addItem(item: ItemInstance): boolean {
    const definition = ItemRegistry.getInstance().getItem(item.definitionId);
    if (!definition) return false;

    // Try to stack with existing items
    if (definition.stackable) {
      const existingSlot = this.findStackableSlot(item.definitionId);
      if (existingSlot && existingSlot.item) {
        const spaceLeft = definition.maxStack - existingSlot.item.quantity;
        const amountToAdd = Math.min(spaceLeft, item.quantity);
        existingSlot.item.quantity += amountToAdd;
        item.quantity -= amountToAdd;

        if (item.quantity === 0) return true;
      }
    }

    // Find empty slot
    const emptySlot = this.findEmptySlot();
    if (emptySlot) {
      emptySlot.item = item;
      return true;
    }

    return false; // Inventory full
  }

  removeItem(slotIndex: number, quantity: number = 1): ItemInstance | null {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.item) return null;

    const removedItem = { ...slot.item, quantity };
    slot.item.quantity -= quantity;

    if (slot.item.quantity <= 0) {
      slot.item = null;
    }

    return removedItem;
  }

  useItem(slotIndex: number, context: GameContext): boolean {
    const slot = this.slots[slotIndex];
    if (!slot || !slot.item) return false;

    const definition = ItemRegistry.getInstance().getItem(slot.item.definitionId);
    if (!definition || !definition.effects) return false;

    // Apply all effects
    definition.effects.forEach(effect => {
      ItemEffectHandler.applyEffect(effect, context);
    });

    // Remove one item from stack
    this.removeItem(slotIndex, 1);
    return true;
  }

  getSlot(index: number): InventorySlotData | null {
    return this.slots[index] || null;
  }

  private findStackableSlot(definitionId: string): InventorySlotData | null {
    return this.slots.find(slot =>
      slot.item &&
      slot.item.definitionId === definitionId &&
      slot.item.quantity < ItemRegistry.getInstance().getItem(definitionId)!.maxStack
    ) || null;
  }

  private findEmptySlot(): InventorySlotData | null {
    return this.slots.find(slot => !slot.item) || null;
  }
}
```

## Phase 3: Loot System

### 3.1 Loot Table (`lib/items/loot/LootTable.ts`)

```typescript
export interface LootEntry {
  itemId: string;
  weight: number;      // Higher = more common
  quantityMin: number;
  quantityMax: number;
  rarityBonus?: number; // Affects actual drop chance
}

export interface LootTable {
  id: string;
  entries: LootEntry[];
  guaranteedDrops?: string[]; // Always drop these
  dropCount: { min: number; max: number }; // How many items to drop
}

export class LootTableRegistry {
  private static tables = new Map<string, LootTable>();

  static register(table: LootTable): void {
    this.tables.set(table.id, table);
  }

  static getTable(id: string): LootTable | undefined {
    return this.tables.get(id);
  }
}
```

### 3.2 Loot Generator (`lib/items/loot/LootGenerator.ts`)

```typescript
export class LootGenerator {
  static generate(tableId: string, luck: number = 0): ItemInstance[] {
    const table = LootTableRegistry.getTable(tableId);
    if (!table) return [];

    const loot: ItemInstance[] = [];

    // Add guaranteed drops
    if (table.guaranteedDrops) {
      table.guaranteedDrops.forEach(itemId => {
        const item = ItemFactory.createInstance(itemId, 1);
        if (item) loot.push(item);
      });
    }

    // Random drops
    const dropCount = this.randomInt(table.dropCount.min, table.dropCount.max);
    for (let i = 0; i < dropCount; i++) {
      const entry = this.selectEntry(table.entries, luck);
      if (entry) {
        const quantity = this.randomInt(entry.quantityMin, entry.quantityMax);
        const item = ItemFactory.createInstance(entry.itemId, quantity);
        if (item) loot.push(item);
      }
    }

    return loot;
  }

  private static selectEntry(entries: LootEntry[], luck: number): LootEntry | null {
    const totalWeight = entries.reduce((sum, e) =>
      sum + e.weight * (1 + (e.rarityBonus || 0) * luck), 0);

    let random = Math.random() * totalWeight;

    for (const entry of entries) {
      const adjustedWeight = entry.weight * (1 + (entry.rarityBonus || 0) * luck);
      random -= adjustedWeight;
      if (random <= 0) return entry;
    }

    return null;
  }

  private static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
```

## Phase 4: UI Components

### 4.1 Inventory Modal Component

```typescript
// components/inventory/InventoryModal.tsx
export function InventoryModal({
  inventory,
  onClose,
  onUseItem
}: InventoryModalProps) {
  return (
    <div className="inventory-modal">
      <div className="inventory-header">
        <h2>Inventar</h2>
        <button onClick={onClose}>×</button>
      </div>
      <InventoryGrid
        inventory={inventory}
        onSlotClick={onUseItem}
      />
    </div>
  );
}
```

### 4.2 Inventory Grid Component

```typescript
// components/inventory/InventoryGrid.tsx
export function InventoryGrid({ inventory, onSlotClick }: Props) {
  return (
    <div className="inventory-grid">
      {Array.from({ length: inventory.maxSlots }).map((_, i) => (
        <InventorySlot
          key={i}
          slotData={inventory.getSlot(i)}
          onClick={() => onSlotClick(i)}
        />
      ))}
    </div>
  );
}
```

### 4.3 Inventory Slot Component

```typescript
// components/inventory/InventorySlot.tsx
export function InventorySlot({ slotData, onClick }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!slotData || !slotData.item) {
    return <div className="slot empty" onClick={onClick} />;
  }

  const definition = ItemRegistry.getInstance().getItem(
    slotData.item.definitionId
  );

  return (
    <div
      className={`slot filled rarity-${definition?.rarity}`}
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <img src={definition?.iconPath} alt={definition?.name} />
      {slotData.item.quantity > 1 && (
        <span className="quantity">{slotData.item.quantity}</span>
      )}
      {showTooltip && definition && (
        <ItemTooltip definition={definition} />
      )}
    </div>
  );
}
```

## Phase 5: Integration mit bestehendem Game

### 5.1 Player State erweitern

```typescript
// In GameCanvas.tsx oder GameState
const [playerInventory] = useState(() => new Inventory(30));

// Item pickup
function handleItemPickup(itemInstance: ItemInstance) {
  const success = playerInventory.addItem(itemInstance);
  if (success) {
    // Show pickup notification
    showNotification(`${itemInstance.definitionId} erhalten!`);
  } else {
    // Inventory full
    showNotification('Inventar voll!');
  }
}
```

### 5.2 Enemy Loot Drops

```typescript
// In Enemy death handler
function handleEnemyDeath(enemy: Enemy) {
  const loot = LootGenerator.generate('enemy_basic', playerLuckStat);

  loot.forEach(item => {
    // Drop item in world or add directly to inventory
    if (autoPickup) {
      playerInventory.addItem(item);
    } else {
      spawnItemInWorld(item, enemy.x, enemy.y);
    }
  });
}
```

### 5.3 Database Integration (Optional)

```typescript
// lib/db/inventory.ts
export function saveInventory(username: string, inventory: Inventory) {
  const db = getDatabase();
  const serialized = JSON.stringify(inventory.serialize());

  db.prepare(`
    INSERT OR REPLACE INTO player_inventory (username, inventory_data)
    VALUES (?, ?)
  `).run(username, serialized);
}

export function loadInventory(username: string): Inventory | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT inventory_data FROM player_inventory WHERE username = ?
  `).get(username);

  if (row) {
    return Inventory.deserialize(JSON.parse(row.inventory_data));
  }
  return null;
}
```

## Phase 6: Erste Test-Items

### 6.1 Item Definitions erstellen

Erstelle `data/items/consumables.json`:

```json
[
  {
    "id": "potion_health_small",
    "name": "Kleiner Heiltrank",
    "description": "Stellt 25 HP wieder her",
    "type": "consumable",
    "rarity": "common",
    "iconPath": "/Assets/Items/Icons/potion_health_small.png",
    "stackable": true,
    "maxStack": 10,
    "value": 10,
    "effects": [
      {
        "type": "heal",
        "value": 25,
        "duration": 0,
        "target": "self"
      }
    ],
    "droppable": true,
    "tradeable": true,
    "questItem": false
  },
  {
    "id": "gold_coin",
    "name": "Goldmünze",
    "description": "Wertvolle Währung",
    "type": "resource",
    "rarity": "common",
    "iconPath": "/Assets/Items/Icons/gold_coin.png",
    "stackable": true,
    "maxStack": 999,
    "value": 1,
    "droppable": true,
    "tradeable": true,
    "questItem": false
  }
]
```

### 6.2 Items beim Start laden

```typescript
// In app/layout.tsx or _app.tsx
useEffect(() => {
  async function loadItems() {
    const response = await fetch('/data/items/consumables.json');
    const items = await response.json();
    ItemRegistry.getInstance().loadFromJSON(items);
  }
  loadItems();
}, []);
```

## Testing-Strategie

### Unit Tests
- ItemRegistry: Register/get items
- ItemFactory: Create instances
- Inventory: Add/remove items
- LootGenerator: Generate loot

### Integration Tests
- Item pickup in game
- Item usage during combat
- Inventory UI interaction
- Loot drops from enemies

### Debug Commands
```typescript
// Add debug commands for testing
window.DEBUG_addItem = (id: string, quantity: number) => {
  const item = ItemFactory.createInstance(id, quantity);
  if (item) playerInventory.addItem(item);
};

window.DEBUG_clearInventory = () => {
  playerInventory.clear();
};
```

## Timeline & Prioritäten

### Sprint 1 (Core System)
- [ ] Type definitions
- [ ] ItemRegistry
- [ ] ItemFactory
- [ ] Basic Inventory class

### Sprint 2 (UI)
- [ ] InventoryModal component
- [ ] InventoryGrid component
- [ ] InventorySlot component
- [ ] ItemTooltip component

### Sprint 3 (Effects & Loot)
- [ ] ItemEffectHandler
- [ ] LootTable system
- [ ] LootGenerator
- [ ] Integration with Enemy deaths

### Sprint 4 (Polish & Testing)
- [ ] Database integration
- [ ] Item pickup animation
- [ ] Item drop in world
- [ ] Balance testing
- [ ] More items

## Offene Fragen

1. Sollen Items in der Welt als Sprites dargestellt werden oder als simple Pickups?
2. Brauchen wir ein Equipment-System mit Slots (Weapon, Armor, etc.)?
3. Soll es einen Shop geben wo Items gekauft werden können?
4. Wie soll das Drag & Drop funktionieren? (Inventory -> Hotbar, etc.)
5. Crafting-System in diesem Spike oder später?
