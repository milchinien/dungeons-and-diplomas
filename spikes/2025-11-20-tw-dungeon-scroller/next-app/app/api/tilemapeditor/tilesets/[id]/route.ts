import { NextRequest, NextResponse } from 'next/server';
import { getTileset, deleteTileset } from '@/lib/tiletheme/db';

// GET /api/tilemapeditor/tilesets/[id] - Get a single tileset
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tileset = getTileset(parseInt(id));

    if (!tileset) {
      return NextResponse.json({ error: 'Tileset not found' }, { status: 404 });
    }

    return NextResponse.json(tileset);
  } catch (error) {
    console.error('Error fetching tileset:', error);
    return NextResponse.json({ error: 'Failed to fetch tileset' }, { status: 500 });
  }
}

// DELETE /api/tilemapeditor/tilesets/[id] - Delete a tileset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteTileset(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tileset:', error);
    return NextResponse.json({ error: 'Failed to delete tileset' }, { status: 500 });
  }
}
