import { NextRequest, NextResponse } from 'next/server';
import { getDungeonTheme, updateDungeonTheme, deleteDungeonTheme } from '@/lib/tiletheme/db';

// GET /api/tilemapeditor/dungeon-themes/[id] - Get a single dungeon theme
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const theme = getDungeonTheme(parseInt(id));

    if (!theme) {
      return NextResponse.json({ error: 'Dungeon theme not found' }, { status: 404 });
    }

    return NextResponse.json(theme);
  } catch (error) {
    console.error('Error fetching dungeon theme:', error);
    return NextResponse.json({ error: 'Failed to fetch dungeon theme' }, { status: 500 });
  }
}

// PUT /api/tilemapeditor/dungeon-themes/[id] - Update a dungeon theme
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const theme = getDungeonTheme(parseInt(id));
    if (!theme) {
      return NextResponse.json({ error: 'Dungeon theme not found' }, { status: 404 });
    }

    updateDungeonTheme(parseInt(id), body);

    const updatedTheme = getDungeonTheme(parseInt(id));
    return NextResponse.json(updatedTheme);
  } catch (error) {
    console.error('Error updating dungeon theme:', error);
    return NextResponse.json({ error: 'Failed to update dungeon theme' }, { status: 500 });
  }
}

// DELETE /api/tilemapeditor/dungeon-themes/[id] - Delete a dungeon theme
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteDungeonTheme(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dungeon theme:', error);
    return NextResponse.json({ error: 'Failed to delete dungeon theme' }, { status: 500 });
  }
}
