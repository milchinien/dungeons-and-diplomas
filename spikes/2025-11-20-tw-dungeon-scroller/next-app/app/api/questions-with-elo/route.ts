import { NextResponse } from 'next/server';
import { getQuestionsWithEloBySubject } from '@/lib/db';
import { withErrorHandler } from '@/lib/api/errorHandler';

export const GET = withErrorHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get('subject');
  const userId = searchParams.get('userId');

  if (!subject || !userId) {
    return NextResponse.json(
      { error: 'Missing subject or userId parameter' },
      { status: 400 }
    );
  }

  const questions = getQuestionsWithEloBySubject(subject, parseInt(userId, 10));
  return NextResponse.json(questions);
}, 'fetch questions with ELO');
