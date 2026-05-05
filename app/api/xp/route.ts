import { NextResponse } from 'next/server';
import { addXp, getUserById, getAdapter, type XpLogEntry } from '@/lib/db';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { getLevelFromXp } from '@/lib/scoring/LevelCalculator';
import { calculateSkillPointsFromLevel } from '@/lib/skills/SkillCalculator';

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  const { user_id, xp_amount, reason, enemy_level } = body;

  if (!user_id || xp_amount === undefined || !reason) {
    return NextResponse.json(
      { error: 'Missing required fields: user_id, xp_amount, reason' },
      { status: 400 }
    );
  }

  const entry: XpLogEntry = {
    user_id,
    xp_amount,
    reason,
    enemy_level
  };

  // Get user's XP before and after
  const userBefore = await getUserById(user_id);
  if (!userBefore) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  const xpBefore = userBefore.xp;
  const levelBefore = getLevelFromXp(xpBefore);

  await addXp(entry);

  // Get updated user data
  const userAfter = await getUserById(user_id);
  if (!userAfter) {
    return NextResponse.json(
      { error: 'User not found after XP gain' },
      { status: 500 }
    );
  }

  const xpAfter = userAfter.xp;
  const levelAfter = getLevelFromXp(xpAfter);

  // Check if player leveled up
  let leveledUp = false;
  let newSkillPoints = 0;

  if (levelAfter > levelBefore) {
    leveledUp = true;

    // Calculate skill points based on new level
    const totalSkillPoints = calculateSkillPointsFromLevel(levelAfter);

    // Update skill_points table
    const db = await getAdapter();
    await db.updateSkillPoints(user_id, totalSkillPoints);

    // Get updated skill points
    const skillPoints = await db.getUserSkillPoints(user_id);
    newSkillPoints = skillPoints.availablePoints;
  }

  return NextResponse.json({
    success: true,
    user: userAfter,
    leveledUp,
    newLevel: levelAfter,
    skillPointsAvailable: newSkillPoints,
  });
}, 'add XP');
