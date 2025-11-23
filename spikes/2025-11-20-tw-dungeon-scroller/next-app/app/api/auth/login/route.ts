import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/db';
import { withErrorHandler } from '@/lib/api/errorHandler';

export const POST = withErrorHandler(async (request: Request) => {
  const { username } = await request.json();

  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    );
  }

  const user = loginUser(username.trim());

  return NextResponse.json({
    id: user.id,
    username: user.username,
    xp: user.xp
  });
}, 'login');
