import { NextResponse } from 'next/server';
import {
  saveHighscore,
  getTopHighscores,
  getUserHighscores,
  getScoreRank,
  isPersonalBest,
  calculateScore
} from '@/lib/db';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { validatePositiveInt } from '@/lib/api/validation';

/**
 * GET /api/highscores
 * Get top highscores or user-specific highscores
 * Query params:
 *   - limit: number of results (default: 10)
 *   - userId: filter by user (optional)
 */
export const GET = withErrorHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const userIdParam = searchParams.get('userId');

  const limit = limitParam ? parseInt(limitParam, 10) : 10;

  if (userIdParam) {
    const userIdResult = validatePositiveInt(parseInt(userIdParam, 10), 'userId');
    if (!userIdResult.success) return userIdResult.error;

    const highscores = await getUserHighscores(userIdResult.value, limit);
    return NextResponse.json({ highscores });
  }

  const highscores = await getTopHighscores(limit);
  return NextResponse.json({ highscores });
}, 'get-highscores');

/**
 * POST /api/highscores
 * Save a new highscore
 * Body: { user_id, enemies_defeated, rooms_explored, xp_gained, max_combo, play_time_seconds }
 */
export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();

  const {
    user_id,
    enemies_defeated = 0,
    rooms_explored = 0,
    xp_gained = 0,
    max_combo = 0,
    play_time_seconds = 0
  } = body;

  // Validate user_id
  const userIdResult = validatePositiveInt(user_id, 'user_id');
  if (!userIdResult.success) return userIdResult.error;

  // Calculate score
  const score = calculateScore({
    xpGained: xp_gained,
    enemiesDefeated: enemies_defeated,
    roomsExplored: rooms_explored,
    maxCombo: max_combo
  });

  // Check if this is a personal best
  const isNewPersonalBest = await isPersonalBest(userIdResult.value, score);

  // Save the highscore
  const highscore = await saveHighscore({
    user_id: userIdResult.value,
    score,
    enemies_defeated,
    rooms_explored,
    xp_gained,
    max_combo,
    play_time_seconds
  });

  // Get the rank of this score
  const rank = await getScoreRank(score);

  return NextResponse.json({
    highscore,
    rank,
    isNewPersonalBest,
    score
  });
}, 'save-highscore');
