import { NextResponse } from 'next/server';
import { getUserStats } from '@/lib/db/stats';
import { withErrorHandler } from '@/lib/api/errorHandler';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  const stats = await getUserStats(parseInt(userId, 10));

  return NextResponse.json(stats);
}, 'fetch stats');
