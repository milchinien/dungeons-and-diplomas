/**
 * Configuration types for useGameState hook
 *
 * These interfaces enable dependency injection for better testability.
 * Browser APIs can be mocked in tests by providing custom implementations.
 */

import { GameEngine } from '../game/GameEngine';
import { GameRenderer } from '../rendering/GameRenderer';
import { MinimapRenderer } from '../rendering/MinimapRenderer';
import { DungeonManager } from '../game/DungeonManager';
import type { Player } from '../enemy';

// ============================================================================
// Scheduler Interface (requestAnimationFrame abstraction)
// ============================================================================

export interface FrameScheduler {
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (handle: number) => void;
}

/**
 * Default scheduler using browser's requestAnimationFrame
 */
export const defaultFrameScheduler: FrameScheduler = {
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (handle) => cancelAnimationFrame(handle)
};

// ============================================================================
// Event Target Interface (window event listener abstraction)
// ============================================================================

export interface EventTarget {
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
}

/**
 * Default event target using browser's window
 */
export const defaultEventTarget: EventTarget = {
  addEventListener: (type, listener) => window.addEventListener(type, listener),
  removeEventListener: (type, listener) => window.removeEventListener(type, listener)
};

// ============================================================================
// Window Dimensions Interface
// ============================================================================

export interface WindowDimensions {
  getWidth: () => number;
  getHeight: () => number;
}

/**
 * Default window dimensions using browser's window
 */
export const defaultWindowDimensions: WindowDimensions = {
  getWidth: () => window.innerWidth,
  getHeight: () => window.innerHeight
};

// ============================================================================
// Factory Interfaces
// ============================================================================

export type GameEngineFactory = () => GameEngine;
export type GameRendererFactory = () => GameRenderer;
export type MinimapRendererFactory = () => MinimapRenderer;
export type DungeonManagerFactory = (player: Player) => DungeonManager;

/**
 * Default factories for production use
 */
export const defaultFactories = {
  gameEngine: () => new GameEngine(),
  gameRenderer: () => new GameRenderer(),
  minimapRenderer: () => new MinimapRenderer(),
  dungeonManager: (player: Player) => new DungeonManager(player)
};

// ============================================================================
// Game State Configuration
// ============================================================================

/**
 * Configuration for useGameState hook
 * All properties are optional - defaults are used for production
 */
export interface GameStateConfig {
  /** Factory for creating GameEngine instance */
  gameEngineFactory?: GameEngineFactory;
  /** Factory for creating GameRenderer instance */
  gameRendererFactory?: GameRendererFactory;
  /** Factory for creating MinimapRenderer instance */
  minimapRendererFactory?: MinimapRendererFactory;
  /** Factory for creating DungeonManager instance */
  dungeonManagerFactory?: DungeonManagerFactory;
  /** Scheduler for animation frames */
  scheduler?: FrameScheduler;
  /** Event target for keyboard and resize events */
  eventTarget?: EventTarget;
  /** Window dimensions provider */
  windowDimensions?: WindowDimensions;
}

/**
 * Merge user config with defaults
 */
export function resolveConfig(config: GameStateConfig = {}): Required<GameStateConfig> {
  return {
    gameEngineFactory: config.gameEngineFactory ?? defaultFactories.gameEngine,
    gameRendererFactory: config.gameRendererFactory ?? defaultFactories.gameRenderer,
    minimapRendererFactory: config.minimapRendererFactory ?? defaultFactories.minimapRenderer,
    dungeonManagerFactory: config.dungeonManagerFactory ?? defaultFactories.dungeonManager,
    scheduler: config.scheduler ?? defaultFrameScheduler,
    eventTarget: config.eventTarget ?? defaultEventTarget,
    windowDimensions: config.windowDimensions ?? defaultWindowDimensions
  };
}
