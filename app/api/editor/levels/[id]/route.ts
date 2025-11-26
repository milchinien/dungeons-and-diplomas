import { NextResponse } from 'next/server';
import { getEditorLevel, deleteEditorLevel, updateEditorLevel } from '@/lib/db';
import { withErrorHandler } from '@/lib/api/errorHandler';

export const GET = withErrorHandler(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  const id = parseInt(params.id, 10);
  const level = getEditorLevel(id);

  if (!level) {
    return NextResponse.json({ error: 'Level not found' }, { status: 404 });
  }

  return NextResponse.json(level);
}, 'fetch editor level');

export const PUT = withErrorHandler(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  const id = parseInt(params.id, 10);
  const body = await request.json();

  updateEditorLevel(id, body);

  return NextResponse.json({ success: true });
}, 'update editor level');

export const DELETE = withErrorHandler(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  const id = parseInt(params.id, 10);
  deleteEditorLevel(id);

  return NextResponse.json({ success: true });
}, 'delete editor level');
