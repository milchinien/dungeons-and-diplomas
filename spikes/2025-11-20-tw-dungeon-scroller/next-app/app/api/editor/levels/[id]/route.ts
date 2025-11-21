import { NextResponse } from 'next/server';
import { getEditorLevel, deleteEditorLevel, updateEditorLevel } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    const level = getEditorLevel(id);

    if (!level) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }

    return NextResponse.json(level);
  } catch (error) {
    console.error('Error fetching editor level:', error);
    return NextResponse.json({ error: 'Failed to fetch level' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    const body = await request.json();

    updateEditorLevel(id, body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating editor level:', error);
    return NextResponse.json({ error: 'Failed to update level' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    deleteEditorLevel(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting editor level:', error);
    return NextResponse.json({ error: 'Failed to delete level' }, { status: 500 });
  }
}
