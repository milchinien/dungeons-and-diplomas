import { NextRequest, NextResponse } from 'next/server';
import { getDungeonThemes, saveDungeonTheme } from '@/lib/tiletheme/db';

// GET /api/tilemapeditor/dungeon-themes - List all dungeon themes
export async function GET() {
  try {
    const themes = getDungeonThemes();
    return NextResponse.json(themes);
  } catch (error) {
    console.error('Error fetching dungeon themes:', error);
    return NextResponse.json({ error: 'Failed to fetch dungeon themes' }, { status: 500 });
  }
}

// POST /api/tilemapeditor/dungeon-themes - Create a new dungeon theme
export async function POST(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error('Error creating dungeon theme:', error);
    return NextResponse.json({ error: 'Failed to create dungeon theme' }, { status: 500 });
  }
}
