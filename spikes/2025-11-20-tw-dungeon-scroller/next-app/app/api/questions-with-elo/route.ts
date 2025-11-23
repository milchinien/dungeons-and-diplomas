import { NextResponse } from 'next/server';
import { getQuestionsWithEloBySubject } from '@/lib/db';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { getSearchParams, getRequiredStringParam, getRequiredIntParam } from '@/lib/api/validation';

export const GET = withErrorHandler(async (request: Request) => {
  const searchParams = getSearchParams(request);

  const subjectResult = getRequiredStringParam(searchParams, 'subject');
  if (!subjectResult.success) return subjectResult.error;

  const userIdResult = getRequiredIntParam(searchParams, 'userId');
  if (!userIdResult.success) return userIdResult.error;

  const questions = getQuestionsWithEloBySubject(subjectResult.value, userIdResult.value);
  return NextResponse.json(questions);
}, 'fetch questions with ELO');
