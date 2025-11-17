import * as Phaser from "phaser";
import CombatScene from "./scenes/CombatScene";
import MainScene from "./scenes/MainScene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  // Use base dimensions (16:9 aspect ratio is common for games)
  width: 1920,
  height: 1080,
  parent: "phaser-game",
  backgroundColor: "#2d2d2d",
  scene: [MainScene, CombatScene],
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
    transparent: false,
    clearBeforeRender: true,
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: false,
    powerPreference: "high-performance",
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
};
