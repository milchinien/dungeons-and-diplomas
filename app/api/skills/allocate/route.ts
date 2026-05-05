import { NextResponse } from 'next/server';
import { getAdapter } from '@/lib/db';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { validateSkillAllocation } from '@/lib/skills/SkillValidator';
import { calculateSkillBonuses } from '@/lib/skills/SkillCalculator';
import { getSkillById } from '@/lib/skills/SkillDefinitions';

/**
 * POST /api/skills/allocate
 *
 * Allocates a skill point to a specific skill
 *
 * Body: { userId: number, skillId: string }
 */
export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  const { userId, skillId } = body;

  // Validate request
  if (!userId || !skillId) {
    return NextResponse.json(
      { error: 'Missing required fields: userId, skillId' },
      { status: 400 }
    );
  }

  // Validate skill exists
  const skillDef = getSkillById(skillId);
  if (!skillDef) {
    return NextResponse.json(
      { error: `Skill "${skillId}" does not exist` },
      { status: 400 }
    );
  }

  const db = await getAdapter();

  // Get current user skills and points
  const userSkills = await db.getUserSkills(userId);
  const skillPoints = await db.getUserSkillPoints(userId);

  // Validate allocation
  const validation = validateSkillAllocation(skillId, userSkills, skillPoints);

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error, success: false },
      { status: 400 }
    );
  }

  // Allocate the skill point
  await db.allocateSkillPoint(userId, skillId);

  // Get updated data
  const updatedSkills = await db.getUserSkills(userId);
  const updatedPoints = await db.getUserSkillPoints(userId);
  const updatedBonuses = calculateSkillBonuses(updatedSkills);

  // Get new level of the skill
  const updatedSkill = updatedSkills.find((s) => s.skillId === skillId);
  const newLevel = updatedSkill?.level ?? 1;

  return NextResponse.json({
    success: true,
    newLevel,
    availablePoints: updatedPoints.availablePoints,
    bonuses: updatedBonuses,
  });
}, 'allocate skill point');
