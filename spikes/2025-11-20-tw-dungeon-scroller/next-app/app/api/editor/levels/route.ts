import { NextResponse } from 'next/server';
import { getEditorLevels, saveEditorLevel } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get('userId');
    const userId = userIdParam ? parseInt(userIdParam, 10) : undefined;

    const levels = getEditorLevels(userId);

    return NextResponse.json(levels);
  } catch (error) {
    console.error('Error fetching editor levels:', error);
    return NextResponse.json({ error: 'Failed to fetch levels' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
      created_by: body.created_by,
      notes: body.notes
    });

    return NextResponse.json({ id: levelId, success: true });
  } catch (error) {
    console.error('Error saving editor level:', error);
    return NextResponse.json({ error: 'Failed to save level' }, { status: 500 });
  }
}
