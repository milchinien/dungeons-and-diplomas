import * as Phaser from "phaser";
import {
  CombatState,
  MOCK_QUESTION,
  PLAYER_STATS,
  ENEMY_STATS,
} from "@/game/types/combat";
import {
  generatePlayerSprite,
  createPlayerAnimationConfig,
} from "@/game/utils/spriteGenerator";
import {
  loadEnemySprites,
  createEnemyAnimations,
} from "@/game/utils/assetLoader";

/**
 * DungeonScene - A dungeon room with tiled floor and walls
 * Features a player and enemy in a rectangular room layout
 */
export default class DungeonScene extends Phaser.Scene {
  private combatState!: CombatState;

  // Sprites
  private playerSprite!: Phaser.GameObjects.Sprite;
  private enemySprite!: Phaser.GameObjects.Sprite;

  // UI References
  private playerHpBar!: Phaser.GameObjects.Graphics;
  private enemyHpBar!: Phaser.GameObjects.Graphics;
  private playerHpText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;
  private questionText!: Phaser.GameObjects.Text;
  private optionButtons!: Phaser.GameObjects.Rectangle[];
  private optionTexts!: Phaser.GameObjects.Text[];

  // Enemy movement
  private enemyStartX!: number;
  private enemyStartY!: number;

  // Dungeon layout
  private tileSize = 16; // Each tile is 16x16 pixels
  private roomWidth = 40; // 40 tiles wide (much larger)
  private roomHeight = 24; // 24 tiles tall (much larger)
  private offsetX = 20; // Padding from left
  private offsetY = 20; // Padding from top

  constructor() {
    super({ key: "DungeonScene" });
  }

  preload() {
    // Load dungeon tileset (16x16 tiles)
    this.load.spritesheet("dungeon-tileset", "/sprites/dungeon-tileset.png", {
      frameWidth: 16,
      frameHeight: 16,
    });

    // Load enemy sprite sheets
    loadEnemySprites(this);
  }

  create() {
    // Initialize combat state
    this.initializeCombatState();

    // Set background color
    this.cameras.main.setBackgroundColor("#0a0a0a");

    // Draw the dungeon room
    this.drawDungeonRoom();

    // Generate animated player sprite asset
    generatePlayerSprite(this, "player-sprite");

    // Create enemy animations from loaded sprite sheets
    createEnemyAnimations(this);

    // Create game objects
    this.createSprites();
    this.createHPBars();
    this.createQuestionPanel();

    // Setup enemy random movement
    this.startEnemyRandomMovement();

    // Setup resize handler
    this.scale.on("resize", this.handleResize, this);
  }

  /**
   * Draw the dungeon room with tiles from the tileset
   * Based on the dungeon-tileset.png layout
   */
  private drawDungeonRoom() {
    // Tileset frame indices - bottom section has floor and wall tiles
    // Looking at the tileset, the useful tiles appear to be:
    // Frame 448-463: Dark floor tiles (bottom left area)
    // Frame 464-479: Dark brown/red wall tiles
    const FLOOR_TILE_1 = 448; // Dark floor
    const FLOOR_TILE_2 = 449; // Dark floor variant
    const WALL_TILE_1 = 464;  // Reddish brown wall
    const WALL_TILE_2 = 465;  // Darker wall variant

    // Draw floor with alternating tiles
    for (let x = 0; x < this.roomWidth; x++) {
      for (let y = 0; y < this.roomHeight; y++) {
        const tileX = this.offsetX + x * this.tileSize;
        const tileY = this.offsetY + y * this.tileSize;

        // Alternate between two floor tile types
        const frameId = ((x + y) % 2 === 0) ? FLOOR_TILE_1 : FLOOR_TILE_2;

        this.add.sprite(tileX + this.tileSize / 2, tileY + this.tileSize / 2, "dungeon-tileset", frameId);
      }
    }

    // Draw top wall
    for (let x = -1; x < this.roomWidth + 1; x++) {
      const tileX = this.offsetX + x * this.tileSize;
      const tileY = this.offsetY - this.tileSize;
      const frameId = (x % 2 === 0) ? WALL_TILE_1 : WALL_TILE_2;
      this.add.sprite(tileX + this.tileSize / 2, tileY + this.tileSize / 2, "dungeon-tileset", frameId);
    }

    // Draw bottom wall
    for (let x = -1; x < this.roomWidth + 1; x++) {
      const tileX = this.offsetX + x * this.tileSize;
      const tileY = this.offsetY + this.roomHeight * this.tileSize;
      const frameId = (x % 2 === 0) ? WALL_TILE_1 : WALL_TILE_2;
      this.add.sprite(tileX + this.tileSize / 2, tileY + this.tileSize / 2, "dungeon-tileset", frameId);
    }

    // Draw left wall
    for (let y = -1; y < this.roomHeight + 1; y++) {
      const tileX = this.offsetX - this.tileSize;
      const tileY = this.offsetY + y * this.tileSize;
      const frameId = (y % 2 === 0) ? WALL_TILE_1 : WALL_TILE_2;
      this.add.sprite(tileX + this.tileSize / 2, tileY + this.tileSize / 2, "dungeon-tileset", frameId);
    }

    // Draw right wall
    for (let y = -1; y < this.roomHeight + 1; y++) {
      const tileX = this.offsetX + this.roomWidth * this.tileSize;
      const tileY = this.offsetY + y * this.tileSize;
      const frameId = (y % 2 === 0) ? WALL_TILE_1 : WALL_TILE_2;
      this.add.sprite(tileX + this.tileSize / 2, tileY + this.tileSize / 2, "dungeon-tileset", frameId);
    }
  }

  private initializeCombatState() {
    this.combatState = {
      player: {
        name: PLAYER_STATS.name,
        currentHp: PLAYER_STATS.maxHp,
        maxHp: PLAYER_STATS.maxHp,
        damage: PLAYER_STATS.damage,
      },
      enemy: {
        name: ENEMY_STATS.name,
        currentHp: ENEMY_STATS.maxHp,
        maxHp: ENEMY_STATS.maxHp,
        damage: ENEMY_STATS.damage,
      },
      currentQuestion: MOCK_QUESTION,
      isAnswerSelected: false,
    };
  }

  private createSprites() {
    // Player sprite (left side of room)
    const playerX = this.offsetX + this.tileSize * 5;
    const playerY = this.offsetY + this.roomHeight * this.tileSize * 0.5;

    this.playerSprite = this.add.sprite(playerX, playerY, "player-sprite_0");
    this.playerSprite.setScale(1.5);
    this.playerSprite.setOrigin(0.5, 0.5);

    // Create animation if it doesn't exist
    if (!this.anims.exists("player-idle")) {
      this.anims.create({
        key: "player-idle",
        frames: [
          { key: "player-sprite_0" },
          { key: "player-sprite_1" },
          { key: "player-sprite_2" },
          { key: "player-sprite_3" },
          { key: "player-sprite_4" },
          { key: "player-sprite_5" },
        ],
        frameRate: 8,
        repeat: -1,
      });
    }

    this.playerSprite.play("player-idle");

    // Enemy sprite (right side of room)
    const enemyX = this.offsetX + this.roomWidth * this.tileSize - this.tileSize * 5;
    const enemyY = this.offsetY + this.roomHeight * this.tileSize * 0.5;

    this.enemySprite = this.add.sprite(enemyX, enemyY, "enemy-skeleton", 0);
    this.enemySprite.setScale(0.7);
    this.enemySprite.setOrigin(0.5, 0.5);

    // Store start position for movement boundaries
    this.enemyStartX = enemyX;
    this.enemyStartY = enemyY;

    // Play skeleton idle animation
    this.enemySprite.play("skeleton-idle");
  }

  private createHPBars() {
    const barWidth = 120;
    const barHeight = 20;
    const topMargin = 20;
    const sideMargin = 20;

    // Player HP Bar (top left)
    this.playerHpBar = this.add.graphics();
    this.playerHpText = this.add.text(sideMargin, topMargin - 25, "", {
      fontSize: "14px",
      color: "#ffffff",
    });
    this.drawHPBarAt(
      this.playerHpBar,
      sideMargin,
      topMargin,
      barWidth,
      this.combatState.player.currentHp,
      this.combatState.player.maxHp
    );
    this.playerHpText.setText(
      `Player: ${this.combatState.player.currentHp}/${this.combatState.player.maxHp}`
    );

    // Enemy HP Bar (top right)
    this.enemyHpBar = this.add.graphics();
    this.enemyHpText = this.add.text(
      this.cameras.main.width - sideMargin - barWidth,
      topMargin - 25,
      "",
      {
        fontSize: "14px",
        color: "#ffffff",
      }
    );
    this.drawHPBarAt(
      this.enemyHpBar,
      this.cameras.main.width - sideMargin - barWidth,
      topMargin,
      barWidth,
      this.combatState.enemy.currentHp,
      this.combatState.enemy.maxHp
    );
    this.enemyHpText.setText(
      `${this.combatState.enemy.name}: ${this.combatState.enemy.currentHp}/${this.combatState.enemy.maxHp}`
    );
  }

  private drawHPBarAt(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    barWidth: number,
    currentHp: number,
    maxHp: number
  ) {
    const barHeight = 20;
    const hpPercentage = Math.max(0, currentHp / maxHp);

    // Background (grey)
    graphics.fillStyle(0x555555, 1);
    graphics.fillRect(x, y, barWidth, barHeight);

    // Foreground (green/red based on HP percentage)
    const barColor = hpPercentage > 0.3 ? 0x00ff00 : 0xff0000;
    graphics.fillStyle(barColor, 1);
    graphics.fillRect(x, y, barWidth * hpPercentage, barHeight);

    // Border
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeRect(x, y, barWidth, barHeight);
  }

  private createQuestionPanel() {
    const centerX = this.cameras.main.centerX;
    const height = this.cameras.main.height;

    // Question text
    this.questionText = this.add
      .text(
        centerX,
        height - 200,
        this.combatState.currentQuestion.question,
        {
          fontSize: "16px",
          color: "#ffffff",
          wordWrap: { width: 400 },
        }
      )
      .setOrigin(0.5);

    // Options grid
    const buttonWidth = 140;
    const buttonHeight = 40;
    const spacingX = 160;
    const spacingY = 60;
    const startX = centerX - spacingX / 2;
    const startY = height - 120;

    this.optionButtons = [];
    this.optionTexts = [];

    this.combatState.currentQuestion.options.forEach((option, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;

      // Button background
      const bg = this.add
        .rectangle(x, y, buttonWidth, buttonHeight, 0x333333)
        .setStrokeStyle(2, 0xffffff)
        .setInteractive({ useHandCursor: true });

      // Button text
      const text = this.add
        .text(x, y, option, {
          fontSize: "13px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      // Click handler
      bg.on("pointerdown", () => this.handleAnswerClick(index));

      // Hover effects
      bg.on("pointerover", () => {
        bg.setFillStyle(0x444444);
      });

      bg.on("pointerout", () => {
        bg.setFillStyle(0x333333);
      });

      this.optionButtons.push(bg);
      this.optionTexts.push(text);
    });
  }

  private handleAnswerClick(optionIndex: number) {
    // Prevent double-click
    if (this.combatState.isAnswerSelected) {
      return;
    }

    this.combatState.isAnswerSelected = true;

    // Disable all buttons
    this.optionButtons.forEach((btn) => {
      btn.disableInteractive();
    });

    // Check if correct
    const isCorrect =
      optionIndex === this.combatState.currentQuestion.correctIndex;

    if (isCorrect) {
      // Correct answer - green flash
      this.optionButtons[optionIndex].setStrokeStyle(4, 0x00ff00);
      this.tweens.add({
        targets: this.optionButtons[optionIndex],
        alpha: 0.6,
        yoyo: true,
        duration: 200,
        repeat: 1,
      });

      // Player attacks enemy
      this.time.delayedCall(600, () => {
        this.updateHP("enemy", this.combatState.player.damage);
      });
    } else {
      // Wrong answer - red flash on selected, green on correct
      this.optionButtons[optionIndex].setStrokeStyle(4, 0xff0000);
      this.optionButtons[this.combatState.currentQuestion.correctIndex].setStrokeStyle(
        4,
        0x00ff00
      );

      this.tweens.add({
        targets: this.optionButtons[optionIndex],
        alpha: 0.6,
        yoyo: true,
        duration: 200,
        repeat: 1,
      });

      // Enemy attacks player
      this.time.delayedCall(600, () => {
        this.updateHP("player", this.combatState.enemy.damage);
      });
    }
  }

  private updateHP(target: "player" | "enemy", damage: number) {
    const entity =
      target === "player" ? this.combatState.player : this.combatState.enemy;

    // Reduce HP
    entity.currentHp = Math.max(0, entity.currentHp - damage);

    // Show damage number
    const spriteX = target === "player" ? this.playerSprite.x : this.enemySprite.x;
    const spriteY = target === "player" ? this.playerSprite.y : this.enemySprite.y;
    this.showDamageNumber(spriteX, spriteY - 30, damage);

    // Update HP bar
    const barWidth = 120;
    const topMargin = 20;
    const sideMargin = 20;
    const barX =
      target === "player" ? sideMargin : this.cameras.main.width - sideMargin - barWidth;
    const barY = topMargin;
    const hpBar = target === "player" ? this.playerHpBar : this.enemyHpBar;
    const hpText = target === "player" ? this.playerHpText : this.enemyHpText;

    // Clear and redraw HP bar
    hpBar.clear();
    this.drawHPBarAt(hpBar, barX, barY, barWidth, entity.currentHp, entity.maxHp);

    // Update text
    hpText.setText(
      target === "player"
        ? `Player: ${entity.currentHp}/${entity.maxHp}`
        : `${entity.name}: ${entity.currentHp}/${entity.maxHp}`
    );

    // Check combat end after a short delay
    this.time.delayedCall(800, () => {
      this.checkCombatEnd();
    });
  }

  private showDamageNumber(x: number, y: number, damage: number) {
    const damageText = this.add
      .text(x, y, `-${damage}`, {
        fontSize: "24px",
        color: "#ff0000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: damageText,
      y: y - 40,
      alpha: 0,
      duration: 1000,
      ease: "Power2",
      onComplete: () => damageText.destroy(),
    });
  }

  private checkCombatEnd() {
    if (this.combatState.player.currentHp <= 0) {
      this.showDefeatScreen();
    } else if (this.combatState.enemy.currentHp <= 0) {
      this.showVictoryScreen();
    } else {
      // Continue combat - reset for next question
      this.combatState.isAnswerSelected = false;

      // Reset button styles and re-enable
      this.optionButtons.forEach((btn) => {
        btn.setStrokeStyle(2, 0xffffff);
        btn.setAlpha(1);
        btn.setInteractive({ useHandCursor: true });
      });
    }
  }

  private showVictoryScreen() {
    // Overlay
    const overlay = this.add
      .rectangle(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        this.cameras.main.width,
        this.cameras.main.height,
        0x000000,
        0.7
      )
      .setOrigin(0.5);

    // Victory text
    const victoryText = this.add
      .text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        "Victory!",
        {
          fontSize: "48px",
          color: "#00ff00",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5);

    // Fade in animation
    overlay.setAlpha(0);
    victoryText.setAlpha(0);

    this.tweens.add({
      targets: [overlay, victoryText],
      alpha: 1,
      duration: 500,
      ease: "Power2",
    });

    // Auto-restart after 2 seconds
    this.time.delayedCall(2000, () => {
      this.scene.restart();
    });
  }

  private showDefeatScreen() {
    // Overlay
    const overlay = this.add
      .rectangle(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        this.cameras.main.width,
        this.cameras.main.height,
        0x000000,
        0.7
      )
      .setOrigin(0.5);

    // Defeat text
    const defeatText = this.add
      .text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        "Defeat!",
        {
          fontSize: "48px",
          color: "#ff0000",
          fontStyle: "bold",
        }
      )
      .setOrigin(0.5);

    // Fade in animation
    overlay.setAlpha(0);
    defeatText.setAlpha(0);

    this.tweens.add({
      targets: [overlay, defeatText],
      alpha: 1,
      duration: 500,
      ease: "Power2",
    });

    // Auto-restart after 2 seconds
    this.time.delayedCall(2000, () => {
      this.scene.restart();
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    if (!this.cameras || !this.cameras.main) {
      return;
    }

    const width = gameSize.width;
    const height = gameSize.height;

    this.cameras.main.setSize(width, height);
  }

  private startEnemyRandomMovement() {
    const scheduleNextMovement = () => {
      this.performEnemyRandomMovement();
      const nextInterval = Phaser.Math.Between(3000, 5000);
      this.time.delayedCall(nextInterval, scheduleNextMovement);
    };

    scheduleNextMovement();
  }

  private performEnemyRandomMovement() {
    // Define movement boundaries within the room (wider range for larger room)
    const minX = this.offsetX + this.roomWidth * this.tileSize * 0.55;
    const maxX = this.offsetX + this.roomWidth * this.tileSize * 0.95;
    const minY = this.offsetY + this.roomHeight * this.tileSize * 0.2;
    const maxY = this.offsetY + this.roomHeight * this.tileSize * 0.8;

    // Random target position
    const targetX = Phaser.Math.Between(minX, maxX);
    const targetY = Phaser.Math.Between(minY, maxY);

    // Determine direction for sprite flip
    const moveDistance = targetX - this.enemySprite.x;
    if (Math.abs(moveDistance) > 10) {
      this.enemySprite.setFlip(moveDistance < 0, false);
    }

    // Play walking animation
    this.enemySprite.play("skeleton-walk", true);

    // Animate movement
    this.tweens.add({
      targets: this.enemySprite,
      x: targetX,
      y: targetY,
      duration: 2000,
      ease: "Linear",
      onComplete: () => {
        // Return to idle animation when movement complete
        this.enemySprite.play("skeleton-idle", true);
      },
    });
  }
}
