import { NextResponse } from 'next/server';
import { addGold, getUserGold, type GoldLogEntry } from '@/lib/db';
import { withErrorHandler } from '@/lib/api/errorHandler';

/**
 * GET /api/gold?userId=X
 * Returns current gold balance for a user
 */
export const GET = withErrorHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const userIdParam = searchParams.get('userId');

  if (!userIdParam) {
    return NextResponse.json(
      { error: 'Missing required parameter: userId' },
      { status: 400 }
    );
  }

  const userId = parseInt(userIdParam, 10);
  if (isNaN(userId)) {
    return NextResponse.json(
      { error: 'Invalid userId parameter' },
      { status: 400 }
    );
  }

  const gold = await getUserGold(userId);

  return NextResponse.json({ gold });
}, 'get user gold');

/**
 * POST /api/gold
 * Add gold to a user and log the transaction
 */
export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  const { user_id, gold_amount, reason, enemy_level, item_sold } = body;

  if (!user_id || gold_amount === undefined || !reason) {
    return NextResponse.json(
      { error: 'Missing required fields: user_id, gold_amount, reason' },
      { status: 400 }
    );
  }

  const entry: GoldLogEntry = {
    user_id,
    gold_amount,
    reason,
    enemy_level,
    item_sold
  };

  await addGold(entry);

  // Return new balance
  const newBalance = await getUserGold(user_id);

  return NextResponse.json({
    success: true,
    new_balance: newBalance
  });
}, 'add gold');
