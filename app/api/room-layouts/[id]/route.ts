import { NextResponse } from 'next/server';
import { getRoomLayoutById, updateRoomLayout, deleteRoomLayout } from '@/lib/db/roomLayouts';

/**
 * GET /api/room-layouts/[id]
 * Gets a single room layout by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const layout = getRoomLayoutById(id);

    if (!layout) {
      return NextResponse.json(
        { error: 'Layout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(layout);
  } catch (error: any) {
    console.error('Error in GET /api/room-layouts/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/room-layouts/[id]
 * Updates an existing room layout
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const layout = updateRoomLayout(id, body);
    return NextResponse.json(layout);
  } catch (error: any) {
    console.error('Error in PUT /api/room-layouts/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update layout' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/room-layouts/[id]
 * Deletes a room layout
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const success = deleteRoomLayout(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Layout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/room-layouts/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete layout' },
      { status: 500 }
    );
  }
}
