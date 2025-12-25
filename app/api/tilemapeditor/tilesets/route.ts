import { NextResponse } from 'next/server';
import { getTilesets, saveTileset } from '@/lib/tiletheme/db';
import { withErrorHandler } from '@/lib/api/errorHandler';

export const GET = withErrorHandler(async () => {
  const tilesets = await getTilesets();
  return NextResponse.json(tilesets);
}, 'fetch tilesets');

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();

  const { name, path, widthTiles, heightTiles } = body;

  if (!name || !path || widthTiles === undefined || heightTiles === undefined) {
    return NextResponse.json(
      { error: 'Missing required fields: name, path, widthTiles, heightTiles' },
      { status: 400 }
    );
  }

  const id = await saveTileset({
    name,
    path,
    widthTiles,
    heightTiles
  });

  return NextResponse.json({ id, name, path, widthTiles, heightTiles });
}, 'create tileset');
