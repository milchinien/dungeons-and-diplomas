# Phase 1 - Task 1: Basic Combat Scene

> **Deprecated / archiviert (Stand 2026-05-04):** Diese Task beschreibt einen fruehen Phaser-basierten Basic-Combat-PoC. Der aktuelle Root-Code nutzt Custom Canvas Rendering und enthaelt bereits Quiz-Combat, Enemy-AI, Trashmobs, Items, XP und Highscores. Die Task wurde aus `03_InProgress` nach `04_Archive/Deprecated` verschoben, damit `03_InProgress` nur noch echte laufende Arbeit enthaelt.

## Description

Implementiere den einfachsten spielbaren Combat-Flow mit einer hardcodierten Multiple-Choice-Aufgabe. Der Spieler kann eine Antwort wählen, erhält Feedback (richtig/falsch), und es gibt einen simplen Kampf-Mechanismus mit einem Gegner bis einer der beiden bei 0 HP ist.

## Context

### Current State

- Next.js + Phaser 3 + TypeScript Setup ist komplett (Phase 0 abgeschlossen)
- `MainScene.ts` zeigt aktuell nur eine Welcome-Nachricht
- Keine Combat-Logik vorhanden
- Keine UI für Aufgaben oder HP-Anzeige

### Related Documents

- `docs/Tasks/01_Plans/Implementation_Roadmap.md` - Phase 1, Story 1.1
- `docs/Tasks/01_Plans/MVP_Definition.md` - Combat-System Details (Zeile 46-66)
- `docs/spec/Tech_Stack.md` - Phaser Integration

### Goal

Ein **minimal funktionaler Kampf** von Anfang bis Ende:
1. Spieler sieht Gegner + HP Bars
2. Multiple-Choice-Aufgabe erscheint
3. Spieler wählt Antwort → Richtig/Falsch Feedback
4. Damage wird angewendet (Spieler oder Gegner)
5. Kampf endet wenn einer bei 0 HP ist → Gewinn/Verlust-Screen

---

## Requirements

### Functional

#### Combat Flow

1. **Scene Start:**
   - Spieler betritt Combat Scene
   - Gegner erscheint (statisches Sprite, kann Placeholder sein)
   - HP Bars werden angezeigt (Spieler + Gegner)

2. **Question Display:**
   - Multiple-Choice-Aufgabe wird angezeigt (4 Optionen)
   - Hardcoded Mock-Data (JSON im Code):
     ```typescript
     {
       question: "Was ist 5 + 3?",
       options: ["6", "7", "8", "9"],
       correctIndex: 2
     }
     ```

3. **Player Input:**
   - Spieler klickt auf eine der 4 Optionen
   - Visuelles Feedback: Gewählte Option wird highlighted

4. **Answer Evaluation:**
   - **Richtige Antwort:**
     - Visuelles Feedback: Grüner Flash/Border um gewählte Option
     - Spieler greift an → Gegner verliert HP
     - Damage-Zahl erscheint über Gegner (z.B. "-10")
   - **Falsche Antwort:**
     - Visuelles Feedback: Roter Flash/Border um gewählte Option + grüne Markierung der korrekten Antwort
     - Gegner greift an → Spieler verliert HP
     - Damage-Zahl erscheint über Spieler (z.B. "-7")

5. **Combat End Condition:**
   - Kampf läuft bis einer bei 0 HP ist
   - **Spieler gewinnt:** "Victory!"-Screen (einfacher Text)
   - **Spieler verliert:** "Defeat!"-Screen (einfacher Text)
   - Nach 2 Sekunden: Scene restartet (für Testing)

#### Stats (Hardcoded für MVP)

- **Spieler:**
  - Start HP: 25
  - Damage: 10
- **Gegner (Balanced Type):**
  - Start HP: 20
  - Damage: 7

### Technical

#### File Structure

Erstelle/Modifiziere folgende Dateien:

```
/game/scenes/
  ├── CombatScene.ts          (NEU - Haupt-Kampf-Scene)
  └── MainScene.ts            (BEARBEITEN - Button zum Starten von CombatScene)

/game/types/
  └── combat.ts               (NEU - TypeScript Interfaces)

/game/config.ts               (BEARBEITEN - CombatScene zur Scene-Liste hinzufügen)
```

#### TypeScript Interfaces

Definiere klare Types in `/game/types/combat.ts`:

```typescript
export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface CombatEntity {
  name: string;
  currentHp: number;
  maxHp: number;
  damage: number;
}

export interface CombatState {
  player: CombatEntity;
  enemy: CombatEntity;
  currentQuestion: Question;
  isAnswerSelected: boolean;
}
```

#### UI Components (Phaser Text/Graphics)

Implementiere folgende UI-Elemente in `CombatScene.ts`:

1. **HP Bars:**
   - Position: Oben links (Spieler), oben rechts (Gegner)
   - Darstellung: Rectangle Graphics (Hintergrund + Foreground)
   - Text: "Player HP: 25/25" und "Enemy HP: 20/20"

2. **Enemy Sprite:**
   - Position: Rechte Bildschirmhälfte, vertikal zentriert
   - Darstellung: Placeholder Rectangle oder einfaches Circle Graphics
   - Farbe: Rot (#ff0000)
   - Größe: 80x80 Pixel

3. **Player Sprite:**
   - Position: Linke Bildschirmhälfte, vertikal zentriert
   - Darstellung: Placeholder Circle Graphics
   - Farbe: Blau (#0099ff)
   - Größe: 60x60 Pixel

4. **Question Panel:**
   - Position: Unten, zentriert
   - Hintergrund: Dunkles Panel (Rectangle mit Border)
   - Question Text: Zentriert über Optionen
   - 4 Option Buttons: 2x2 Grid Layout

5. **Damage Numbers:**
   - Floating Text Animation (Tween nach oben + Fade Out)
   - Farbe: Rot (#ff0000) für Damage
   - Font-Size: 32px

6. **Combat Result Screen:**
   - Fullscreen Overlay (semi-transparent schwarz)
   - Text: "Victory!" oder "Defeat!"
   - Font-Size: 64px
   - Auto-Close nach 2 Sekunden

#### Game Flow Logic

Implementiere in `CombatScene.ts`:

1. **create():**
   - Initialisiere Combat State (Player + Enemy stats)
   - Rendere UI (HP Bars, Sprites, Question Panel)
   - Lade erste Frage (hardcoded Mock-Data)

2. **handleAnswerClick(optionIndex: number):**
   - Disable alle Buttons (prevent double-click)
   - Evaluate Antwort (correctIndex check)
   - Zeige visuelles Feedback (Color Flash)
   - Wende Damage an (updateHP)
   - Zeige Damage-Number-Animation
   - Check Combat End → wenn nicht: lade nächste Frage (gleiche Frage nochmal für MVP)

3. **updateHP(target: 'player' | 'enemy', damage: number):**
   - Reduziere HP
   - Update HP Bar Graphics (Tween für smooth animation)
   - Update HP Text
   - Trigger checkCombatEnd()

4. **checkCombatEnd():**
   - If Player HP <= 0 → showDefeatScreen()
   - If Enemy HP <= 0 → showVictoryScreen()
   - Else → enableAnswerButtons() (nächste Runde)

5. **showVictoryScreen() / showDefeatScreen():**
   - Zeige Overlay + Text
   - Timer: 2 Sekunden → scene.restart()

### Constraints

- **Kein Timer-System** (kommt in Story 1.2)
- **Nur eine Frage** hardcoded (kein Question-Pool)
- **Kein Raumauswahl-System** (kommt in Story 1.3)
- **Keine echten Assets** (Placeholder Graphics sind OK)
- **Kein Sound** (kommt in Phase 5)
- Code muss TypeScript strict mode passieren
- UI muss responsive sein (800x600 Canvas)

---

## Implementation Guide

### Step-by-Step Plan

#### 1. Types & Mock Data erstellen

**Datei:** `/game/types/combat.ts`

```typescript
export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface CombatEntity {
  name: string;
  currentHp: number;
  maxHp: number;
  damage: number;
}

export interface CombatState {
  player: CombatEntity;
  enemy: CombatEntity;
  currentQuestion: Question;
  isAnswerSelected: boolean;
}

// Mock data for testing
export const MOCK_QUESTION: Question = {
  question: "Was ist 5 + 3?",
  options: ["6", "7", "8", "9"],
  correctIndex: 2,
};

export const PLAYER_STATS = {
  name: "Player",
  maxHp: 25,
  damage: 10,
};

export const ENEMY_STATS = {
  name: "Goblin",
  maxHp: 20,
  damage: 7,
};
```

#### 2. CombatScene erstellen

**Datei:** `/game/scenes/CombatScene.ts`

**Struktur:**

```typescript
import * as Phaser from "phaser";
import { CombatState, MOCK_QUESTION, PLAYER_STATS, ENEMY_STATS } from "@/game/types/combat";

export default class CombatScene extends Phaser.Scene {
  private combatState!: CombatState;

  // UI References
  private playerHpBar!: Phaser.GameObjects.Graphics;
  private enemyHpBar!: Phaser.GameObjects.Graphics;
  private playerHpText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;
  private playerSprite!: Phaser.GameObjects.Graphics;
  private enemySprite!: Phaser.GameObjects.Graphics;
  private questionText!: Phaser.GameObjects.Text;
  private optionButtons!: Phaser.GameObjects.Text[];

  constructor() {
    super({ key: "CombatScene" });
  }

  create() {
    // TODO: Initialize combat state
    // TODO: Draw background
    // TODO: Create player/enemy sprites
    // TODO: Create HP bars
    // TODO: Create question panel
    // TODO: Load first question
  }

  private initializeCombatState() {
    // TODO: Set up player and enemy stats
  }

  private createSprites() {
    // TODO: Draw player sprite (left side)
    // TODO: Draw enemy sprite (right side)
  }

  private createHPBars() {
    // TODO: Create HP bar graphics and text
  }

  private createQuestionPanel() {
    // TODO: Create question text
    // TODO: Create 4 option buttons in 2x2 grid
    // TODO: Add click handlers
  }

  private handleAnswerClick(optionIndex: number) {
    // TODO: Disable buttons
    // TODO: Check if correct
    // TODO: Apply damage
    // TODO: Show feedback
    // TODO: Check combat end
  }

  private updateHP(target: 'player' | 'enemy', damage: number) {
    // TODO: Reduce HP
    // TODO: Update HP bar graphics
    // TODO: Update HP text
    // TODO: Check combat end
  }

  private showDamageNumber(x: number, y: number, damage: number) {
    // TODO: Create floating damage text
    // TODO: Tween animation (move up + fade out)
  }

  private checkCombatEnd() {
    // TODO: Check win/loss conditions
  }

  private showVictoryScreen() {
    // TODO: Create overlay
    // TODO: Show "Victory!" text
    // TODO: Auto-restart after 2s
  }

  private showDefeatScreen() {
    // TODO: Create overlay
    // TODO: Show "Defeat!" text
    // TODO: Auto-restart after 2s
  }
}
```

**Wichtige Implementierungs-Details:**

**HP Bar Drawing:**
```typescript
private drawHPBar(
  x: number,
  y: number,
  currentHp: number,
  maxHp: number
): Phaser.GameObjects.Graphics {
  const barWidth = 200;
  const barHeight = 20;
  const hpPercentage = currentHp / maxHp;

  const graphics = this.add.graphics();

  // Background (grey)
  graphics.fillStyle(0x555555, 1);
  graphics.fillRect(x, y, barWidth, barHeight);

  // Foreground (green)
  graphics.fillStyle(0x00ff00, 1);
  graphics.fillRect(x, y, barWidth * hpPercentage, barHeight);

  // Border
  graphics.lineStyle(2, 0xffffff, 1);
  graphics.strokeRect(x, y, barWidth, barHeight);

  return graphics;
}
```

**Option Button Layout (2x2 Grid):**
```typescript
private createQuestionPanel() {
  const centerX = this.cameras.main.centerX;
  const panelY = this.cameras.main.height - 180;

  // Question text
  this.questionText = this.add.text(
    centerX,
    panelY - 60,
    this.combatState.currentQuestion.question,
    { fontSize: "20px", color: "#ffffff" }
  ).setOrigin(0.5);

  // 2x2 Grid für Optionen
  const buttonWidth = 180;
  const buttonHeight = 50;
  const spacingX = 200;
  const spacingY = 70;
  const startX = centerX - spacingX / 2;
  const startY = panelY;

  this.optionButtons = [];

  this.combatState.currentQuestion.options.forEach((option, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = startX + col * spacingX;
    const y = startY + row * spacingY;

    // Button background
    const bg = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0x333333)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true });

    // Button text
    const text = this.add.text(x, y, option, {
      fontSize: "18px",
      color: "#ffffff",
    }).setOrigin(0.5);

    // Click handler
    bg.on("pointerdown", () => this.handleAnswerClick(index));

    this.optionButtons.push(text);
  });
}
```

**Damage Number Animation:**
```typescript
private showDamageNumber(x: number, y: number, damage: number) {
  const damageText = this.add.text(x, y, `-${damage}`, {
    fontSize: "32px",
    color: "#ff0000",
    fontStyle: "bold",
  }).setOrigin(0.5);

  this.tweens.add({
    targets: damageText,
    y: y - 50,
    alpha: 0,
    duration: 1000,
    ease: "Power2",
    onComplete: () => damageText.destroy(),
  });
}
```

#### 3. MainScene Update

**Datei:** `/game/scenes/MainScene.ts`

Füge einen "Start Combat"-Button hinzu:

```typescript
// In create() nach den bestehenden Animationen:

const startButton = this.add.text(
  centerX,
  centerY + 180,
  "Start Combat",
  {
    fontSize: "24px",
    color: "#ffffff",
    backgroundColor: "#4ade80",
    padding: { x: 20, y: 10 },
  }
)
  .setOrigin(0.5)
  .setInteractive({ useHandCursor: true });

startButton.on("pointerdown", () => {
  this.scene.start("CombatScene");
});

// Hover effect
startButton.on("pointerover", () => {
  startButton.setScale(1.1);
});

startButton.on("pointerout", () => {
  startButton.setScale(1.0);
});
```

#### 4. Config Update

**Datei:** `/game/config.ts`

```typescript
import CombatScene from "./scenes/CombatScene";
import MainScene from "./scenes/MainScene";

export const gameConfig: Phaser.Types.Core.GameConfiguration = {
  type: Phaser.AUTO,
  parent: "phaser-game",
  width: 800,
  height: 600,
  backgroundColor: "#2d2d2d",
  scene: [MainScene, CombatScene], // CombatScene hinzufügen
};
```

---

## Deliverables

- ✅ `/game/types/combat.ts` - Type Definitions + Mock Data
- ✅ `/game/scenes/CombatScene.ts` - Vollständige Combat Scene Implementation
- ✅ `/game/scenes/MainScene.ts` - Updated mit "Start Combat" Button
- ✅ `/game/config.ts` - CombatScene registriert
- ✅ Funktionierender Combat von Start bis Ende
- ✅ Visuelles Feedback für richtige/falsche Antworten
- ✅ HP Bars mit Damage-Animationen
- ✅ Victory/Defeat Screens

---

## Acceptance Criteria

### Functional Tests

- [ ] `pnpm dev` startet ohne TypeScript-Fehler
- [ ] MainScene zeigt "Start Combat" Button
- [ ] Click auf Button → CombatScene startet
- [ ] CombatScene zeigt:
  - [ ] Spieler-Sprite (links, blau)
  - [ ] Gegner-Sprite (rechts, rot)
  - [ ] HP Bars für beide (oben)
  - [ ] Frage-Text ("Was ist 5 + 3?")
  - [ ] 4 anklickbare Optionen in 2x2 Grid
- [ ] Click auf **richtige Antwort (Option 3: "8")**:
  - [ ] Grünes visuelles Feedback
  - [ ] Gegner HP sinkt um 10
  - [ ] Damage-Number "-10" erscheint über Gegner
  - [ ] HP Bar animiert sich
- [ ] Click auf **falsche Antwort**:
  - [ ] Rotes visuelles Feedback auf gewählter Option
  - [ ] Grünes Feedback auf korrekter Option
  - [ ] Spieler HP sinkt um 7
  - [ ] Damage-Number "-7" erscheint über Spieler
- [ ] **Combat Ende:**
  - [ ] Nach 3 richtigen Antworten: Gegner bei 0 HP → "Victory!" Screen
  - [ ] Nach 4 falschen Antworten: Spieler bei 0 HP → "Defeat!" Screen
  - [ ] Screen verschwindet nach 2 Sekunden
  - [ ] Combat startet neu (gleiche Scene)

### Code Quality

- [ ] TypeScript Compiler: `pnpm type-check` ohne Fehler
- [ ] ESLint: `pnpm lint` ohne kritische Warnungen
- [ ] Alle Functions haben klare Verantwortlichkeiten (Single Responsibility)
- [ ] Kommentare auf Englisch
- [ ] Code ist lesbar und wartbar

### Performance

- [ ] Keine FPS-Drops während Combat
- [ ] Animationen sind smooth (60 FPS)
- [ ] Keine Memory Leaks (Scene cleanup funktioniert)

---

## Testing Instructions (für Junior Devs)

1. **Setup:**
   ```bash
   git checkout -b feature/phase1-task1-basic-combat
   pnpm install
   pnpm dev
   ```

2. **Browser öffnen:** `http://localhost:3000`

3. **Test Flow:**
   - Click "Start Combat"
   - Beantworte Fragen (mal richtig, mal falsch)
   - Achte auf:
     - HP Bars ändern sich?
     - Damage Numbers erscheinen?
     - Combat endet bei 0 HP?
     - Victory/Defeat Screen wird angezeigt?

4. **Type Check:**
   ```bash
   pnpm type-check
   ```

5. **Lint Check:**
   ```bash
   pnpm lint
   ```

6. **Wenn alles funktioniert:**
   ```bash
   git add .
   git commit -m "feat: implement basic combat scene with hardcoded question"
   git push origin feature/phase1-task1-basic-combat
   ```

7. **Pull Request erstellen auf GitHub**

---

## Known Limitations (wird in späteren Tasks behoben)

- ⏳ Kein Timer-System (kommt in Phase 1, Task 2)
- ⏳ Nur eine Frage (Question Pool kommt in Phase 3)
- ⏳ Kein Raumauswahl-System (kommt in Phase 1, Task 3)
- ⏳ Placeholder Graphics (echte Assets in Phase 5)
- ⏳ Combat startet automatisch neu (Run-System kommt später)

---

## Notes für LLM (Claude/GPT bei Implementation)

Wenn du diese Task implementierst:

1. **Starte mit den Types** (`/game/types/combat.ts`) - das gibt dir klare Struktur
2. **Implementiere CombatScene Schritt für Schritt:**
   - Erst Sprites + HP Bars (visuell sichtbar machen)
   - Dann Question Panel (UI funktional)
   - Dann Combat Logic (Answer Handling)
   - Dann End Conditions (Victory/Defeat)
3. **Teste nach jedem Schritt** im Browser (hot reload funktioniert)
4. **Nutze Phaser's Tween-System** für alle Animationen (smooth und performant)
5. **Achte auf Phaser's Coordinate System:**
   - Origin (0,0) = top-left
   - `.setOrigin(0.5)` = zentriert
   - `this.cameras.main.centerX/Y` für Screen-Center
6. **Graphics vs. Sprites:**
   - Für Placeholder: `this.add.graphics()` (kein Asset nötig)
   - Später: `this.add.sprite()` (für echte Assets)
7. **Button Interactivity:**
   - `.setInteractive()` macht Game Objects klickbar
   - `useHandCursor: true` für bessere UX
   - Event: `"pointerdown"` für Click

**Wichtig:** Diese Task ist bewusst SIMPLE gehalten. Keine Over-Engineering! Das Ziel ist ein funktionierender Proof-of-Concept, kein perfektes System.

---

## Status

📋 **Ready for Implementation** - Detaillierte Anleitung vorhanden, kann direkt umgesetzt werden
