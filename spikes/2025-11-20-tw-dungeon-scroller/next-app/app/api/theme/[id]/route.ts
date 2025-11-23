import { NextRequest, NextResponse } from 'next/server';
import { getTileTheme, getTilesets } from '@/lib/tiletheme/db';

// GET /api/theme/[id] - Get a tile theme with its tilesets
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
  } catch (error) {
    console.error('Error fetching theme:', error);
    return NextResponse.json({ error: 'Failed to fetch theme' }, { status: 500 });
  }
}
