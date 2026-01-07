/**
 * Slash Animation - Visual melee attack effect that follows the player
 */

export interface SlashState {
  active: boolean;
  timer: number;
  duration: number;
  angle: number; // Direction of the slash in radians
  startAngle: number; // Arc start angle
  endAngle: number; // Arc end angle
}

// Singleton state
let slashState: SlashState = {
  active: false,
  timer: 0,
  duration: 0.15, // 150ms slash animation
  angle: 0,
  startAngle: 0,
  endAngle: 0
};

/**
 * Start a new slash animation
 * @param angle - Direction of the attack in radians (0 = right, PI/2 = down)
 */
export function startSlash(angle: number): void {
  slashState.active = true;
  slashState.timer = 0;
  slashState.angle = angle;

  // Create arc sweep: slash sweeps 120 degrees
  const arcWidth = Math.PI * 0.65; // 117 degrees
  slashState.startAngle = angle - arcWidth / 2;
  slashState.endAngle = angle + arcWidth / 2;
}

/**
 * Update slash animation
 * @param dt - Delta time in seconds
 */
export function updateSlash(dt: number): void {
  if (!slashState.active) return;

  slashState.timer += dt;

  if (slashState.timer >= slashState.duration) {
    slashState.active = false;
  }
}

/**
 * Check if slash is currently active
 */
export function isSlashActive(): boolean {
  return slashState.active;
}

/**
 * Render the slash animation
 * @param ctx - Canvas context
 * @param playerCenterX - Player center X in screen coordinates
 * @param playerCenterY - Player center Y in screen coordinates
 * @param tileSize - Tile size for scaling
 */
export function renderSlash(
  ctx: CanvasRenderingContext2D,
  playerCenterX: number,
  playerCenterY: number,
  tileSize: number
): void {
  if (!slashState.active) return;

  const progress = slashState.timer / slashState.duration;

  // Animation phases:
  // 0-0.3: Slash appears and expands
  // 0.3-1.0: Slash fades out

  const expandPhase = Math.min(progress / 0.3, 1);
  const fadePhase = progress > 0.3 ? (progress - 0.3) / 0.7 : 0;

  // Calculate current sweep angle (arc sweeps during animation)
  const sweepProgress = easeOutQuad(expandPhase);
  const currentStartAngle = slashState.startAngle;
  const currentEndAngle = slashState.startAngle + (slashState.endAngle - slashState.startAngle) * sweepProgress;

  // Radius expands slightly during animation
  const baseRadius = tileSize * 0.9;
  const maxRadius = tileSize * 1.4;
  const radius = baseRadius + (maxRadius - baseRadius) * sweepProgress;

  // Alpha fades out
  const alpha = 1 - easeInQuad(fadePhase);

  ctx.save();

  // Draw multiple slash arcs for thickness effect
  const slashWidth = tileSize * 0.35;

  // Outer glow
  ctx.beginPath();
  ctx.arc(playerCenterX, playerCenterY, radius, currentStartAngle, currentEndAngle);
  ctx.strokeStyle = `rgba(255, 255, 200, ${alpha * 0.3})`;
  ctx.lineWidth = slashWidth + 15;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Main slash arc
  ctx.beginPath();
  ctx.arc(playerCenterX, playerCenterY, radius, currentStartAngle, currentEndAngle);
  ctx.strokeStyle = `rgba(255, 255, 230, ${alpha * 0.8})`;
  ctx.lineWidth = slashWidth + 6;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Bright inner arc
  ctx.beginPath();
  ctx.arc(playerCenterX, playerCenterY, radius, currentStartAngle, currentEndAngle);
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.lineWidth = slashWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Core bright line
  ctx.beginPath();
  ctx.arc(playerCenterX, playerCenterY, radius, currentStartAngle, currentEndAngle);
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.lineWidth = slashWidth * 0.4;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Draw slash trail lines at the edges
  drawSlashEdge(ctx, playerCenterX, playerCenterY, radius, currentStartAngle, alpha, slashWidth);
  drawSlashEdge(ctx, playerCenterX, playerCenterY, radius, currentEndAngle, alpha, slashWidth);

  ctx.restore();
}

/**
 * Draw slash edge accent
 */
function drawSlashEdge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  angle: number,
  alpha: number,
  width: number
): void {
  const innerRadius = radius * 0.5;
  const outerRadius = radius * 1.1;

  const x1 = cx + Math.cos(angle) * innerRadius;
  const y1 = cy + Math.sin(angle) * innerRadius;
  const x2 = cx + Math.cos(angle) * outerRadius;
  const y2 = cy + Math.sin(angle) * outerRadius;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
  ctx.lineWidth = width * 0.5;
  ctx.lineCap = 'round';
  ctx.stroke();
}

/**
 * Easing functions
 */
function easeOutQuad(t: number): number {
  return t * (2 - t);
}

function easeInQuad(t: number): number {
  return t * t;
}
