import { NextResponse } from 'next/server';
import { getEditorLevels, saveEditorLevel } from '@/lib/db';
import { withErrorHandler } from '@/lib/api/errorHandler';

export const GET = withErrorHandler(async (request: Request) => {
  const url = new URL(request.url);
  const userIdParam = url.searchParams.get('userId');
  const userId = userIdParam ? parseInt(userIdParam, 10) : undefined;

  const levels = getEditorLevels(userId);

  return NextResponse.json(levels);
}, 'fetch editor levels');

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();

  // Validate required fields
  if (!body.name || body.structure_seed === undefined ||
      body.decoration_seed === undefined || body.spawn_seed === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const levelId = saveEditorLevel({
    name: body.name,
    structure_seed: body.structure_seed,
    decoration_seed: body.decoration_seed,
    spawn_seed: body.spawn_seed,
    width: body.width ?? 100,
    height: body.height ?? 100,
    algorithm: body.algorithm ?? 1,
    created_by: body.created_by,
    notes: body.notes
  });

  return NextResponse.json({ id: levelId, success: true });
}, 'save editor level');
