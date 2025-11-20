import * as Phaser from "phaser";

export default class MainScene extends Phaser.Scene {
  private title!: Phaser.GameObjects.Text;
  private subtitle!: Phaser.GameObjects.Text;
  private successText!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Text;
  private circle!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: "MainScene" });
  }

  create() {
    // Set background color
    this.cameras.main.setBackgroundColor("#2d2d2d");

    // Create UI elements
    this.createUI();

    // Setup resize handler
    this.scale.on("resize", this.handleResize, this);
  }

  private createUI() {
    // Get current dimensions
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Responsive font sizes
    const isMobile = width < 1024;
    const isSmallScreen = height < 600;
    const titleSize = isMobile || isSmallScreen ? "28px" : "48px";
    const subtitleSize = isMobile || isSmallScreen ? "16px" : "24px";
    const successSize = isMobile || isSmallScreen ? "12px" : "18px";

    // Responsive vertical spacing
    const verticalSpacing = isSmallScreen ? 40 : 60;

    // Title - starts from top, slides down
    this.title = this.add
      .text(centerX, -100, "Dungeons & Diplomas", {
        fontSize: titleSize,
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Subtitle - starts from bottom, slides up
    this.subtitle = this.add
      .text(centerX, this.cameras.main.height + 100, "Phaser 3 + Next.js + TypeScript", {
        fontSize: subtitleSize,
        color: "#00d9ff",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Success message - fades in after others
    this.successText = this.add
      .text(centerX, centerY + verticalSpacing, "Project initialization successful! 🎮", {
        fontSize: successSize,
        color: "#4ade80",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Animate title sliding down
    this.tweens.add({
      targets: this.title,
      y: centerY - verticalSpacing * 0.8,
      alpha: 1,
      duration: 1200,
      ease: "Back.easeOut",
    });

    // Animate subtitle sliding up
    this.tweens.add({
      targets: this.subtitle,
      y: centerY + 20,
      alpha: 1,
      duration: 1200,
      ease: "Back.easeOut",
      delay: 200,
    });

    // Fade in success message
    this.tweens.add({
      targets: this.successText,
      alpha: 1,
      duration: 800,
      ease: "Power2",
      delay: 1000,
    });

    // Add pulsing circle - appears after text animations
    // Position based on available space
    const circleOffset = isSmallScreen ? verticalSpacing * 1.8 : verticalSpacing * 2;
    this.circle = this.add.graphics();
    this.circle.fillStyle(0x00d9ff, 1);
    this.circle.fillCircle(centerX, centerY + circleOffset, 20);
    this.circle.setAlpha(0);

    // Fade in circle first
    this.tweens.add({
      targets: this.circle,
      alpha: 1,
      duration: 600,
      delay: 1400,
      onComplete: () => {
        // Then start pulsing animation
        this.tweens.add({
          targets: this.circle,
          scaleX: 1.5,
          scaleY: 1.5,
          alpha: 0.3,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      },
    });

    // Add "Start Combat" button
    const buttonSize = isMobile || isSmallScreen ? "18px" : "24px";
    const buttonOffset = isSmallScreen ? verticalSpacing * 2.5 : verticalSpacing * 3;
    this.startButton = this.add
      .text(centerX, centerY + buttonOffset, "Start Combat", {
        fontSize: buttonSize,
        color: "#ffffff",
        backgroundColor: "#4ade80",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    // Fade in button
    this.tweens.add({
      targets: this.startButton,
      alpha: 1,
      duration: 600,
      delay: 1600,
    });

    // Click handler
    this.startButton.on("pointerdown", () => {
      this.scene.start("CombatScene");
    });

    // Hover effects
    this.startButton.on("pointerover", () => {
      this.startButton.setScale(1.1);
    });

    this.startButton.on("pointerout", () => {
      this.startButton.setScale(1.0);
    });
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
    const centerX = width / 2;
    const centerY = height / 2;

    // Update camera
    this.cameras.main.setSize(width, height);

    // Responsive font sizes and spacing
    const isMobile = width < 1024;
    const isSmallScreen = height < 600;
    const titleSize = isMobile || isSmallScreen ? "28px" : "48px";
    const subtitleSize = isMobile || isSmallScreen ? "16px" : "24px";
    const successSize = isMobile || isSmallScreen ? "12px" : "18px";
    const buttonSize = isMobile || isSmallScreen ? "18px" : "24px";
    const verticalSpacing = isSmallScreen ? 40 : 60;

    // Reposition and resize all elements
    if (this.title) {
      this.title.setPosition(centerX, centerY - verticalSpacing * 0.8);
      this.title.setFontSize(titleSize);
    }

    if (this.subtitle) {
      this.subtitle.setPosition(centerX, centerY + 20);
      this.subtitle.setFontSize(subtitleSize);
    }

    if (this.successText) {
      this.successText.setPosition(centerX, centerY + verticalSpacing);
      this.successText.setFontSize(successSize);
    }

    if (this.circle) {
      const circleOffset = isSmallScreen ? verticalSpacing * 1.8 : verticalSpacing * 2;
      this.circle.clear();
      this.circle.fillStyle(0x00d9ff, 1);
      this.circle.fillCircle(centerX, centerY + circleOffset, 20);
    }

    if (this.startButton) {
      const buttonOffset = isSmallScreen ? verticalSpacing * 2.5 : verticalSpacing * 3;
      this.startButton.setPosition(centerX, centerY + buttonOffset);
      this.startButton.setFontSize(buttonSize);
    }
  }
}
