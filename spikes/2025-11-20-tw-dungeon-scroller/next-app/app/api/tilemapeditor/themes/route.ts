import { NextRequest, NextResponse } from 'next/server';
import { getTileThemes, saveTileTheme } from '@/lib/tiletheme/db';

// GET /api/tilemapeditor/themes - List all tile themes
export async function GET() {
  try {
    const themes = getTileThemes();
    return NextResponse.json(themes);
  } catch (error) {
    console.error('Error fetching themes:', error);
    return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 });
  }
}

// POST /api/tilemapeditor/themes - Create a new tile theme
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, floor, wall, door } = body;

    if (!name) {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
    }

    const id = saveTileTheme({
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
  } catch (error) {
    console.error('Error creating theme:', error);
    return NextResponse.json({ error: 'Failed to create theme' }, { status: 500 });
  }
}
