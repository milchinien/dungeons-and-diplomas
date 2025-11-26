import { NextResponse } from 'next/server';
import { getSessionEloScores } from '@/lib/db';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { getSearchParams, getRequiredIntParam } from '@/lib/api/validation';

export const GET = withErrorHandler(async (request: Request) => {
  const searchParams = getSearchParams(request);

  const userIdResult = getRequiredIntParam(searchParams, 'userId');
  if (!userIdResult.success) return userIdResult.error;

  const scores = getSessionEloScores(userIdResult.value);
  return NextResponse.json(scores);
}, 'fetch session ELO');
