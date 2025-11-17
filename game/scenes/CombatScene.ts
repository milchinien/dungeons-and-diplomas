import * as Phaser from "phaser";
import {
  CombatState,
  MOCK_QUESTION,
  PLAYER_STATS,
  ENEMY_STATS,
} from "@/game/types/combat";

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
  private optionButtons!: Phaser.GameObjects.Rectangle[];
  private optionTexts!: Phaser.GameObjects.Text[];

  constructor() {
    super({ key: "CombatScene" });
  }

  create() {
    // Initialize combat state
    this.initializeCombatState();

    // Draw background
    this.cameras.main.setBackgroundColor("#1a1a1a");

    // Create game objects
    this.createSprites();
    this.createHPBars();
    this.createQuestionPanel();
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
    const centerY = this.cameras.main.centerY;
    const width = this.cameras.main.width;

    // Player sprite (left side, 20% from left edge, blue circle)
    const playerX = width * 0.2;
    this.playerSprite = this.add.graphics();
    this.playerSprite.fillStyle(0x0099ff, 1);
    this.playerSprite.fillCircle(playerX, centerY, 30);

    // Enemy sprite (right side, 80% from left edge, red rectangle)
    const enemyX = width * 0.8;
    this.enemySprite = this.add.graphics();
    this.enemySprite.fillStyle(0xff0000, 1);
    this.enemySprite.fillRect(enemyX - 40, centerY - 40, 80, 80);
  }

  private createHPBars() {
    const width = this.cameras.main.width;
    const barWidth = 200;

    // Player HP Bar (top left)
    const playerBarX = 20;
    const playerBarY = 20;
    this.playerHpBar = this.drawHPBar(
      playerBarX,
      playerBarY,
      this.combatState.player.currentHp,
      this.combatState.player.maxHp
    );

    this.playerHpText = this.add.text(
      playerBarX,
      playerBarY - 20,
      `Player HP: ${this.combatState.player.currentHp}/${this.combatState.player.maxHp}`,
      {
        fontSize: "16px",
        color: "#ffffff",
      }
    );

    // Enemy HP Bar (top right, aligned to right edge)
    const enemyBarX = width - barWidth - 20;
    const enemyBarY = 20;
    this.enemyHpBar = this.drawHPBar(
      enemyBarX,
      enemyBarY,
      this.combatState.enemy.currentHp,
      this.combatState.enemy.maxHp
    );

    this.enemyHpText = this.add.text(
      enemyBarX,
      enemyBarY - 20,
      `${this.combatState.enemy.name} HP: ${this.combatState.enemy.currentHp}/${this.combatState.enemy.maxHp}`,
      {
        fontSize: "16px",
        color: "#ffffff",
      }
    );
  }

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

  private createQuestionPanel() {
    const centerX = this.cameras.main.centerX;
    const height = this.cameras.main.height;

    // Position question panel in bottom 25% of screen
    const panelY = height * 0.8;

    // Question text
    this.questionText = this.add
      .text(
        centerX,
        panelY - 60,
        this.combatState.currentQuestion.question,
        {
          fontSize: "20px",
          color: "#ffffff",
        }
      )
      .setOrigin(0.5);

    // 2x2 Grid for options
    const buttonWidth = 180;
    const buttonHeight = 50;
    const spacingX = 200;
    const spacingY = 70;
    const startX = centerX - spacingX / 2;
    const startY = panelY;

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
          fontSize: "18px",
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
      this.optionButtons[this.combatState.currentQuestion.correctIndex].setStrokeStyle(4, 0x00ff00);

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
    const width = this.cameras.main.width;
    const spriteX = target === "player" ? width * 0.2 : width * 0.8;
    const spriteY = this.cameras.main.centerY;
    this.showDamageNumber(spriteX, spriteY - 50, damage);

    // Update HP bar and text
    const barWidth = 200;
    const barX = target === "player" ? 20 : width - barWidth - 20;
    const barY = 20;
    const hpBar = target === "player" ? this.playerHpBar : this.enemyHpBar;
    const hpText = target === "player" ? this.playerHpText : this.enemyHpText;

    // Clear and redraw HP bar
    hpBar.clear();
    const barHeight = 20;
    const hpPercentage = entity.currentHp / entity.maxHp;

    // Background (grey)
    hpBar.fillStyle(0x555555, 1);
    hpBar.fillRect(barX, barY, barWidth, barHeight);

    // Foreground (green/red based on HP)
    const barColor = hpPercentage > 0.3 ? 0x00ff00 : 0xff0000;
    hpBar.fillStyle(barColor, 1);
    hpBar.fillRect(barX, barY, barWidth * hpPercentage, barHeight);

    // Border
    hpBar.lineStyle(2, 0xffffff, 1);
    hpBar.strokeRect(barX, barY, barWidth, barHeight);

    // Update text
    hpText.setText(
      target === "player"
        ? `Player HP: ${entity.currentHp}/${entity.maxHp}`
        : `${entity.name} HP: ${entity.currentHp}/${entity.maxHp}`
    );

    // Check combat end after a short delay
    this.time.delayedCall(800, () => {
      this.checkCombatEnd();
    });
  }

  private showDamageNumber(x: number, y: number, damage: number) {
    const damageText = this.add
      .text(x, y, `-${damage}`, {
        fontSize: "32px",
        color: "#ff0000",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: damageText,
      y: y - 50,
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
          fontSize: "64px",
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
          fontSize: "64px",
          color: "#ff0000ff",
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
}
