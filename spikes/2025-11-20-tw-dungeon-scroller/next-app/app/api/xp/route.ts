import { NextResponse } from 'next/server';
import { addXp, getUserById, type XpLogEntry } from '@/lib/db';
import { withErrorHandler } from '@/lib/api/errorHandler';

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

  addXp(entry);

  // Return updated user data
  const user = getUserById(user_id);

  return NextResponse.json({
    success: true,
    user
  });
}, 'add XP');
