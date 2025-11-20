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

    // Setup resize handler
    this.scale.on("resize", this.handleResize, this);
  }

  /**
   * Handle window resize - reposition all UI elements
   */
  private handleResize(gameSize: Phaser.Structs.Size) {
    // Guard: Check if scene is ready
    if (!this.cameras || !this.cameras.main) {
      return;
    }

    const width = gameSize.width;
    const height = gameSize.height;

    // Update camera
    this.cameras.main.setSize(width, height);

    // Reposition all elements
    this.repositionSprites();
    this.repositionHPBars();
    this.repositionQuestionPanel();
  }

  /**
   * Reposition sprites based on current screen size
   */
  private repositionSprites() {
    const centerY = this.cameras.main.centerY;
    const width = this.cameras.main.width;

    // Player sprite (left side, 20% from left edge)
    const playerX = width * 0.2;
    this.playerSprite.clear();
    this.playerSprite.fillStyle(0x0099ff, 1);
    this.playerSprite.fillCircle(playerX, centerY, 30);

    // Enemy sprite (right side, 80% from left edge)
    const enemyX = width * 0.8;
    this.enemySprite.clear();
    this.enemySprite.fillStyle(0xff0000, 1);
    this.enemySprite.fillRect(enemyX - 40, centerY - 40, 80, 80);
  }

  /**
   * Reposition HP bars based on current screen size
   */
  private repositionHPBars() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const barWidth = Math.min(200, width * 0.25); // Responsive bar width

    // Responsive margins - use percentage of screen height for top margin
    const topMargin = Math.max(30, height * 0.06); // 6% of height or min 30px
    const sideMargin = Math.max(10, width * 0.02); // 2% of width or min 10px
    const textOffset = Math.max(20, height * 0.03); // Space above bar for text

    // Player HP Bar (top left)
    const playerBarX = sideMargin;
    const playerBarY = topMargin;

    // Update text position
    this.playerHpText.setPosition(playerBarX, playerBarY - textOffset);

    // Redraw HP bar
    this.playerHpBar.clear();
    this.drawHPBarAt(
      this.playerHpBar,
      playerBarX,
      playerBarY,
      barWidth,
      this.combatState.player.currentHp,
      this.combatState.player.maxHp
    );

    // Enemy HP Bar (top right)
    const enemyBarX = width - barWidth - sideMargin;
    const enemyBarY = topMargin;

    // Update text position
    this.enemyHpText.setPosition(enemyBarX, enemyBarY - textOffset);

    // Redraw HP bar
    this.enemyHpBar.clear();
    this.drawHPBarAt(
      this.enemyHpBar,
      enemyBarX,
      enemyBarY,
      barWidth,
      this.combatState.enemy.currentHp,
      this.combatState.enemy.maxHp
    );
  }

  /**
   * Reposition question panel based on current screen size
   */
  private repositionQuestionPanel() {
    const centerX = this.cameras.main.centerX;
    const height = this.cameras.main.height;
    const width = this.cameras.main.width;

    // Responsive sizing
    const isMobile = width < 1024;
    const isSmallScreen = height < 600;

    const buttonWidth = isMobile ? 140 : 180;
    const buttonHeight = isMobile || isSmallScreen ? 35 : 50;
    const spacingX = isMobile ? 160 : 200;
    const spacingY = isMobile || isSmallScreen ? 50 : 70;
    const fontSize = isMobile || isSmallScreen ? "14px" : "18px";
    const questionFontSize = isMobile || isSmallScreen ? "16px" : "20px";

    // Calculate total height needed for question panel:
    // Question text (assume ~30px height) + gap (60px) + 2 rows of buttons
    const questionTextHeight = 40;
    const questionGap = isSmallScreen ? 40 : 60;
    const buttonGridHeight = buttonHeight + spacingY; // 2 rows: first row + spacing + second row
    const totalPanelHeight = questionTextHeight + questionGap + buttonGridHeight;

    // Position from bottom, ensuring all buttons are visible
    const bottomPadding = isSmallScreen ? 10 : 20;
    const panelY = height - totalPanelHeight - bottomPadding;

    // Update question text position
    this.questionText.setPosition(centerX, panelY - 60);
    this.questionText.setFontSize(questionFontSize);

    // Update option buttons layout (2x2 grid)
    const startX = centerX - spacingX / 2;
    const startY = panelY;

    this.combatState.currentQuestion.options.forEach((option, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;

      // Update button position and size
      this.optionButtons[index].setPosition(x, y);
      this.optionButtons[index].setSize(buttonWidth, buttonHeight);

      // Update text position and size
      this.optionTexts[index].setPosition(x, y);
      this.optionTexts[index].setFontSize(fontSize);
    });
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
    const height = this.cameras.main.height;
    const barWidth = Math.min(200, width * 0.25);

    // Responsive margins - use percentage of screen height for top margin
    const topMargin = Math.max(30, height * 0.06); // 6% of height or min 30px
    const sideMargin = Math.max(10, width * 0.02); // 2% of width or min 10px
    const textOffset = Math.max(20, height * 0.03); // Space above bar for text

    // Player HP Bar (top left)
    const playerBarX = sideMargin;
    const playerBarY = topMargin;
    this.playerHpBar = this.drawHPBar(
      playerBarX,
      playerBarY,
      this.combatState.player.currentHp,
      this.combatState.player.maxHp
    );

    this.playerHpText = this.add.text(
      playerBarX,
      playerBarY - textOffset,
      `Player HP: ${this.combatState.player.currentHp}/${this.combatState.player.maxHp}`,
      {
        fontSize: "16px",
        color: "#ffffff",
      }
    );

    // Enemy HP Bar (top right, aligned to right edge)
    const enemyBarX = width - barWidth - sideMargin;
    const enemyBarY = topMargin;
    this.enemyHpBar = this.drawHPBar(
      enemyBarX,
      enemyBarY,
      this.combatState.enemy.currentHp,
      this.combatState.enemy.maxHp
    );

    this.enemyHpText = this.add.text(
      enemyBarX,
      enemyBarY - textOffset,
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
    const width = this.cameras.main.width;
    const barWidth = Math.min(200, width * 0.25);
    const graphics = this.add.graphics();
    this.drawHPBarAt(graphics, x, y, barWidth, currentHp, maxHp);
    return graphics;
  }

  /**
   * Draw HP bar on existing graphics object with custom width
   */
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
    const width = this.cameras.main.width;

    // Responsive sizing
    const isMobile = width < 1024;
    const isSmallScreen = height < 600;

    const questionFontSize = isMobile || isSmallScreen ? "16px" : "20px";

    // Calculate position using same logic as repositionQuestionPanel
    const buttonHeight = isMobile || isSmallScreen ? 35 : 50;
    const spacingY = isMobile || isSmallScreen ? 50 : 70;
    const questionTextHeight = 40;
    const questionGap = isSmallScreen ? 40 : 60;
    const buttonGridHeight = buttonHeight + spacingY;
    const totalPanelHeight = questionTextHeight + questionGap + buttonGridHeight;
    const bottomPadding = isSmallScreen ? 10 : 20;
    const panelY = height - totalPanelHeight - bottomPadding;

    // Question text
    this.questionText = this.add
      .text(
        centerX,
        panelY - 60,
        this.combatState.currentQuestion.question,
        {
          fontSize: questionFontSize,
          color: "#ffffff",
        }
      )
      .setOrigin(0.5);

    // 2x2 Grid for options - responsive sizing
    const buttonWidth = isMobile ? 140 : 180;
    // buttonHeight and spacingY already declared above for position calculation
    const spacingX = isMobile ? 160 : 200;
    const fontSize = isMobile || isSmallScreen ? "14px" : "18px";
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
          fontSize: fontSize,
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
    const height = this.cameras.main.height;
    const spriteX = target === "player" ? width * 0.2 : width * 0.8;
    const spriteY = this.cameras.main.centerY;
    this.showDamageNumber(spriteX, spriteY - 50, damage);

    // Update HP bar and text with responsive positioning
    const barWidth = Math.min(200, width * 0.25); // Responsive bar width
    const topMargin = Math.max(30, height * 0.06); // 6% of height or min 30px
    const sideMargin = Math.max(10, width * 0.02); // 2% of width or min 10px
    const barX = target === "player" ? sideMargin : width - barWidth - sideMargin;
    const barY = topMargin;
    const hpBar = target === "player" ? this.playerHpBar : this.enemyHpBar;
    const hpText = target === "player" ? this.playerHpText : this.enemyHpText;

    // Clear and redraw HP bar using shared drawing function
    hpBar.clear();
    this.drawHPBarAt(hpBar, barX, barY, barWidth, entity.currentHp, entity.maxHp);

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
