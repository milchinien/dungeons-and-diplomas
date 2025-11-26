import { NextResponse } from 'next/server';
import { getAllSubjects } from '@/lib/db';
import { withErrorHandler } from '@/lib/api/errorHandler';

export const GET = withErrorHandler(async () => {
  const subjects = getAllSubjects();
  return NextResponse.json(subjects);
}, 'fetch subjects');
