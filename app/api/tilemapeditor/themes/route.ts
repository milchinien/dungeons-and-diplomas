import { NextResponse } from 'next/server';
import { getTileThemes, saveTileTheme } from '@/lib/tiletheme/db';
import { withErrorHandler } from '@/lib/api/errorHandler';

export const GET = withErrorHandler(async () => {
  const themes = await getTileThemes();
  return NextResponse.json(themes);
}, 'fetch themes');

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();

  const { name, floor, wall, door } = body;

  if (!name) {
    return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
  }

  const id = await saveTileTheme({
    name,
    floor: floor || { default: [] },
    wall: wall || {},
    door: door || {}
  });

  return NextResponse.json({
    id,
    name,
    floor: floor || { default: [] },
    wall: wall || {},
    door: door || {}
  });
}, 'create theme');
