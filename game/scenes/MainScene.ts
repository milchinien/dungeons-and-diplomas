import * as Phaser from "phaser";

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
  }

  create() {
    // Set background color
    this.cameras.main.setBackgroundColor("#2d2d2d");

    // Add welcome text
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Title - starts from top, slides down
    const title = this.add
      .text(centerX, -100, "Dungeons & Diplomas", {
        fontSize: "48px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Subtitle - starts from bottom, slides up
    const subtitle = this.add
      .text(centerX, this.cameras.main.height + 100, "Phaser 3 + Next.js + TypeScript", {
        fontSize: "24px",
        color: "#00d9ff",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Success message - fades in after others
    const successText = this.add
      .text(centerX, centerY + 60, "Project initialization successful! 🎮", {
        fontSize: "18px",
        color: "#4ade80",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // Animate title sliding down
    this.tweens.add({
      targets: title,
      y: centerY - 50,
      alpha: 1,
      duration: 1200,
      ease: "Back.easeOut",
    });

    // Animate subtitle sliding up
    this.tweens.add({
      targets: subtitle,
      y: centerY + 20,
      alpha: 1,
      duration: 1200,
      ease: "Back.easeOut",
      delay: 200,
    });

    // Fade in success message
    this.tweens.add({
      targets: successText,
      alpha: 1,
      duration: 800,
      ease: "Power2",
      delay: 1000,
    });

    // Add pulsing circle - appears after text animations
    const graphics = this.add.graphics();
    graphics.fillStyle(0x00d9ff, 1);
    graphics.fillCircle(centerX, centerY + 120, 20);
    graphics.setAlpha(0);

    // Fade in circle first
    this.tweens.add({
      targets: graphics,
      alpha: 1,
      duration: 600,
      delay: 1400,
      onComplete: () => {
        // Then start pulsing animation
        this.tweens.add({
          targets: graphics,
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
    const startButton = this.add
      .text(centerX, centerY + 180, "Start Combat", {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#4ade80",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    // Fade in button
    this.tweens.add({
      targets: startButton,
      alpha: 1,
      duration: 600,
      delay: 1600,
    });

    // Click handler
    startButton.on("pointerdown", () => {
      this.scene.start("CombatScene");
    });

    // Hover effects
    startButton.on("pointerover", () => {
      startButton.setScale(1.1);
    });

    startButton.on("pointerout", () => {
      startButton.setScale(1.0);
    });
  }
}
