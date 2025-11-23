import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/db';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { validateNonEmptyString } from '@/lib/api/validation';

export const POST = withErrorHandler(async (request: Request) => {
  const { username } = await request.json();

  const usernameResult = validateNonEmptyString(username, 'username');
  if (!usernameResult.success) return usernameResult.error;

  const user = loginUser(usernameResult.value.trim());

  return NextResponse.json({
    id: user.id,
    username: user.username,
    xp: user.xp
  });
}, 'login');
