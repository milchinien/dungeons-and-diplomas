import { NextResponse } from 'next/server';
import { getSessionEloScores } from '@/lib/db';
import { withErrorHandler } from '@/lib/api/errorHandler';

export const GET = withErrorHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing userId parameter' },
      { status: 400 }
    );
  }

  const scores = getSessionEloScores(parseInt(userId, 10));
  return NextResponse.json(scores);
}, 'fetch session ELO');
