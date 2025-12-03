import { NextResponse } from 'next/server';
import { getDungeonThemes, saveDungeonTheme } from '@/lib/tiletheme/db';
import { withErrorHandler } from '@/lib/api/errorHandler';

export const GET = withErrorHandler(async () => {
  const themes = getDungeonThemes();
  return NextResponse.json(themes);
}, 'fetch dungeon themes');

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();

  const { name, darkThemeId, lightThemeId } = body;

  if (!name || darkThemeId === undefined || lightThemeId === undefined) {
    return NextResponse.json(
      { error: 'Missing required fields: name, darkThemeId, lightThemeId' },
      { status: 400 }
    );
  }

  const id = saveDungeonTheme({
    name,
    darkThemeId,
    lightThemeId
  });

  return NextResponse.json({ id, name, darkThemeId, lightThemeId });
}, 'create dungeon theme');
