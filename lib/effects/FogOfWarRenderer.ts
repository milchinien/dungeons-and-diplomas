// =============================================================================
// Fog of War Renderer - Animated fog effect for exploring rooms
// =============================================================================

interface FogLayer {
  speedX: number;
  speedY: number;
  scale: number;
  opacity: number;
}

/**
 * Renders animated fog overlay for unexplored/exploring rooms
 */
export class FogOfWarRenderer {
  private time: number = 0;
  private enabled: boolean = true;

  // Multiple fog layers with different speeds for organic movement
  private readonly fogLayers: FogLayer[] = [
    { speedX: 0.4, speedY: 0.25, scale: 1.2, opacity: 0.35 },
    { speedX: -0.3, speedY: 0.35, scale: 1.8, opacity: 0.25 },
    { speedX: 0.2, speedY: -0.2, scale: 2.4, opacity: 0.2 }
  ];

  // Colors for fog gradient
  private readonly fogColors = [
    'rgba(15, 15, 25, ',    // Dark blue-black
    'rgba(25, 25, 40, ',    // Slightly lighter
    'rgba(20, 20, 35, '     // Mid tone
  ];

  /**
   * Enable or disable fog rendering
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if fog is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Update fog animation time
   */
  update(dt: number): void {
    this.time += dt;
  }

  /**
   * Get current time for external use
   */
  getTime(): number {
    return this.time;
  }

  /**
   * Render animated fog at a specific tile position
   * @param ctx - Canvas context (already translated by camera)
   * @param worldX - Tile X position in world coordinates
   * @param worldY - Tile Y position in world coordinates
   * @param tileSize - Size of one tile in pixels
   * @param intensity - Fog intensity (0 = clear, 1 = full fog)
   */
  renderFogAtTile(
    ctx: CanvasRenderingContext2D,
    worldX: number,
    worldY: number,
    tileSize: number,
    intensity: number
  ): void {
    if (!this.enabled || intensity <= 0) return;

    const pixelX = worldX * tileSize;
    const pixelY = worldY * tileSize;

    // Clamp intensity
    const clampedIntensity = Math.min(1, Math.max(0, intensity));

    // Base dark layer
    ctx.fillStyle = `rgba(8, 8, 15, ${clampedIntensity * 0.75})`;
    ctx.fillRect(pixelX, pixelY, tileSize, tileSize);

    // Animated fog layers
    for (let i = 0; i < this.fogLayers.length; i++) {
      const layer = this.fogLayers[i];
      const color = this.fogColors[i % this.fogColors.length];

      // Calculate animated offset using sin/cos waves
      const waveX = Math.sin(this.time * layer.speedX + worldY * 0.15) * 0.5 + 0.5;
      const waveY = Math.cos(this.time * layer.speedY + worldX * 0.12) * 0.5 + 0.5;

      // Combined wave for varying opacity
      const wave = (waveX + waveY) * 0.5;

      // Layer opacity varies with wave
      const layerOpacity = layer.opacity * clampedIntensity * (0.6 + wave * 0.4);

      ctx.fillStyle = `${color}${layerOpacity.toFixed(2)})`;
      ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
    }

    // Add subtle "wind streaks" effect
    this.renderWindStreaks(ctx, pixelX, pixelY, tileSize, clampedIntensity, worldX, worldY);
  }

  /**
   * Render wind/mist streaks for extra atmosphere
   */
  private renderWindStreaks(
    ctx: CanvasRenderingContext2D,
    pixelX: number,
    pixelY: number,
    tileSize: number,
    intensity: number,
    tileX: number,
    tileY: number
  ): void {
    // Only render occasionally based on position hash for performance
    const hash = (tileX * 7919 + tileY * 6997) % 100;
    if (hash > 30) return; // Only 30% of tiles get streaks

    ctx.save();

    // Animated position offset
    const streakOffset = Math.sin(this.time * 0.8 + hash * 0.1) * tileSize * 0.3;

    // Create subtle gradient streak
    const gradient = ctx.createLinearGradient(
      pixelX + streakOffset,
      pixelY + tileSize * 0.3,
      pixelX + tileSize + streakOffset,
      pixelY + tileSize * 0.7
    );

    const streakOpacity = intensity * 0.15 * (0.5 + Math.sin(this.time + hash) * 0.5);
    gradient.addColorStop(0, `rgba(60, 60, 80, 0)`);
    gradient.addColorStop(0.5, `rgba(60, 60, 80, ${streakOpacity.toFixed(2)})`);
    gradient.addColorStop(1, `rgba(60, 60, 80, 0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(pixelX, pixelY, tileSize, tileSize);

    ctx.restore();
  }

  /**
   * Render fog over an entire area (for room transitions)
   * @param ctx - Canvas context
   * @param x - Area X in pixels
   * @param y - Area Y in pixels
   * @param width - Area width in pixels
   * @param height - Area height in pixels
   * @param intensity - Fog intensity (0-1)
   * @param tileSize - Tile size for wave calculations
   */
  renderFogArea(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    intensity: number,
    tileSize: number
  ): void {
    if (!this.enabled || intensity <= 0) return;

    const clampedIntensity = Math.min(1, Math.max(0, intensity));

    // Base dark layer for entire area
    ctx.fillStyle = `rgba(8, 8, 15, ${clampedIntensity * 0.8})`;
    ctx.fillRect(x, y, width, height);

    // Animated overlay - single pass for performance
    const wave = Math.sin(this.time * 0.5) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(20, 20, 35, ${clampedIntensity * 0.3 * wave})`;
    ctx.fillRect(x, y, width, height);
  }
}

// Singleton instance
let fogRendererInstance: FogOfWarRenderer | null = null;

/**
 * Get the global fog of war renderer instance
 */
export function getFogOfWarRenderer(): FogOfWarRenderer {
  if (!fogRendererInstance) {
    fogRendererInstance = new FogOfWarRenderer();
  }
  return fogRendererInstance;
}
