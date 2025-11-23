import { NextRequest, NextResponse } from 'next/server';
import { getTileTheme, getTilesets } from '@/lib/tiletheme/db';
import { withErrorHandler } from '@/lib/api/errorHandler';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const themeId = parseInt(id, 10);

  if (isNaN(themeId)) {
    return NextResponse.json({ error: 'Invalid theme ID' }, { status: 400 });
  }

  const theme = getTileTheme(themeId);

  if (!theme) {
    return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
  }

  // Also return tilesets so the client can load the images
  const tilesets = getTilesets();

  return NextResponse.json({ theme, tilesets });
}, 'fetch theme');
