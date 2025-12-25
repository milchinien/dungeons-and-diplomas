import { NextRequest, NextResponse } from 'next/server';
import { getDungeonTheme, updateDungeonTheme, deleteDungeonTheme } from '@/lib/tiletheme/db';
import { withErrorHandler } from '@/lib/api/errorHandler';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const theme = await getDungeonTheme(parseInt(id));

  if (!theme) {
    return NextResponse.json({ error: 'Dungeon theme not found' }, { status: 404 });
  }

  return NextResponse.json(theme);
}, 'fetch dungeon theme');

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();

  const theme = await getDungeonTheme(parseInt(id));
  if (!theme) {
    return NextResponse.json({ error: 'Dungeon theme not found' }, { status: 404 });
  }

  await updateDungeonTheme(parseInt(id), body);

  const updatedTheme = await getDungeonTheme(parseInt(id));
  return NextResponse.json(updatedTheme);
}, 'update dungeon theme');

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await deleteDungeonTheme(parseInt(id));
  return NextResponse.json({ success: true });
}, 'delete dungeon theme');
