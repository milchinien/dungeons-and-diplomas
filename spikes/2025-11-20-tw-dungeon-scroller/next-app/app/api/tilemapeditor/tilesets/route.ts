import { NextRequest, NextResponse } from 'next/server';
import { getTilesets, saveTileset } from '@/lib/tiletheme/db';

// GET /api/tilemapeditor/tilesets - List all tilesets
export async function GET() {
  try {
    const tilesets = getTilesets();
    return NextResponse.json(tilesets);
  } catch (error) {
    console.error('Error fetching tilesets:', error);
    return NextResponse.json({ error: 'Failed to fetch tilesets' }, { status: 500 });
  }
}

// POST /api/tilemapeditor/tilesets - Create a new tileset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, path, widthTiles, heightTiles } = body;

    if (!name || !path || widthTiles === undefined || heightTiles === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, path, widthTiles, heightTiles' },
        { status: 400 }
      );
    }

    const id = saveTileset({
      name,
      path,
      widthTiles,
      heightTiles
    });

    return NextResponse.json({ id, name, path, widthTiles, heightTiles });
  } catch (error) {
    console.error('Error creating tileset:', error);
    return NextResponse.json({ error: 'Failed to create tileset' }, { status: 500 });
  }
}
