import { NextRequest, NextResponse } from 'next/server';
import { getTileTheme, updateTileTheme, deleteTileTheme } from '@/lib/tiletheme/db';
import { withErrorHandler } from '@/lib/api/errorHandler';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const theme = await getTileTheme(parseInt(id));

  if (!theme) {
    return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
  }

  return NextResponse.json(theme);
}, 'fetch theme');

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await request.json();

  const theme = await getTileTheme(parseInt(id));
  if (!theme) {
    return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
  }

  await updateTileTheme(parseInt(id), body);

  const updatedTheme = await getTileTheme(parseInt(id));
  return NextResponse.json(updatedTheme);
}, 'update theme');

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await deleteTileTheme(parseInt(id));
  return NextResponse.json({ success: true });
}, 'delete theme');
