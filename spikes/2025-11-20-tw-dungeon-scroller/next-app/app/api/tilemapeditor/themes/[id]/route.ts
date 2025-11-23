import { NextRequest, NextResponse } from 'next/server';
import { getTileTheme, updateTileTheme, deleteTileTheme } from '@/lib/tiletheme/db';

// GET /api/tilemapeditor/themes/[id] - Get a single theme
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const theme = getTileTheme(parseInt(id));

    if (!theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
    }

    return NextResponse.json(theme);
  } catch (error) {
    console.error('Error fetching theme:', error);
    return NextResponse.json({ error: 'Failed to fetch theme' }, { status: 500 });
  }
}

// PUT /api/tilemapeditor/themes/[id] - Update a theme
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const theme = getTileTheme(parseInt(id));
    if (!theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
    }

    updateTileTheme(parseInt(id), body);

    const updatedTheme = getTileTheme(parseInt(id));
    return NextResponse.json(updatedTheme);
  } catch (error) {
    console.error('Error updating theme:', error);
    return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 });
  }
}

// DELETE /api/tilemapeditor/themes/[id] - Delete a theme
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteTileTheme(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting theme:', error);
    return NextResponse.json({ error: 'Failed to delete theme' }, { status: 500 });
  }
}
