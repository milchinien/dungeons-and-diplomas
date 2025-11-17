"use client";

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { gameConfig } from "@/game/config";

export default function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    // Initialize Phaser game only on client-side
    if (typeof window !== "undefined" && !gameRef.current) {
      gameRef.current = new Phaser.Game(gameConfig);
    }

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <div id="phaser-game" style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
