import { NextResponse } from 'next/server';
import { getAllQuestions } from '@/lib/db';
import { withErrorHandler } from '@/lib/api/errorHandler';

export const GET = withErrorHandler(async () => {
  const questions = await getAllQuestions();
  return NextResponse.json(questions);
}, 'fetch questions');
