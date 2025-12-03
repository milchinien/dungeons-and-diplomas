import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/errorHandler';

export const POST = withErrorHandler(async () => {
  // Logout is purely client-side (localStorage clear)
  // This endpoint exists for consistency
  return NextResponse.json({ success: true });
}, 'logout');
