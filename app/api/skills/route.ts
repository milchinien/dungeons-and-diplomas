import { NextResponse } from 'next/server';
import { getAdapter } from '@/lib/db';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { calculateSkillBonuses } from '@/lib/skills/SkillCalculator';

/**
 * GET /api/skills?userId=X
 *
 * Returns user's skill allocations, skill points, and calculated bonuses
 */
export const GET = withErrorHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const userIdStr = searchParams.get('userId');

  if (!userIdStr) {
    return NextResponse.json(
      { error: 'Missing required parameter: userId' },
      { status: 400 }
    );
  }

  const userId = parseInt(userIdStr, 10);
  if (isNaN(userId)) {
    return NextResponse.json(
      { error: 'Invalid userId parameter' },
      { status: 400 }
    );
  }

  const db = await getAdapter();

  // Get user's skills
  const userSkills = await db.getUserSkills(userId);

  // Get user's skill points
  const skillPoints = await db.getUserSkillPoints(userId);

  // Calculate current bonuses
  const bonuses = calculateSkillBonuses(userSkills);

  return NextResponse.json({
    skillPoints,
    skills: userSkills,
    bonuses,
  });
}, 'get user skills');
