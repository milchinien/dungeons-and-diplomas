import { NextRequest, NextResponse } from 'next/server';
import { getTileset, deleteTileset } from '@/lib/tiletheme/db';
import { withErrorHandler } from '@/lib/api/errorHandler';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const tileset = await getTileset(parseInt(id));

  if (!tileset) {
    return NextResponse.json({ error: 'Tileset not found' }, { status: 404 });
  }

  return NextResponse.json(tileset);
}, 'fetch tileset');

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await deleteTileset(parseInt(id));
  return NextResponse.json({ success: true });
}, 'delete tileset');
