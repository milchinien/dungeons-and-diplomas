import { NextResponse } from 'next/server';
import { getRoomLayouts, createRoomLayout } from '@/lib/db/roomLayouts';
import type { LayoutFilterOptions } from '@/lib/roomlayouts/types';

/**
 * GET /api/room-layouts
 * Gets all room layouts with optional filters
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: LayoutFilterOptions = {};

    if (searchParams.has('roomType')) {
      filters.roomType = searchParams.get('roomType')!;
    }
    if (searchParams.has('minWidth')) {
      filters.minWidth = parseInt(searchParams.get('minWidth')!);
    }
    if (searchParams.has('maxWidth')) {
      filters.maxWidth = parseInt(searchParams.get('maxWidth')!);
    }
    if (searchParams.has('minHeight')) {
      filters.minHeight = parseInt(searchParams.get('minHeight')!);
    }
    if (searchParams.has('maxHeight')) {
      filters.maxHeight = parseInt(searchParams.get('maxHeight')!);
    }
    if (searchParams.has('difficulty')) {
      filters.difficulty = parseInt(searchParams.get('difficulty')!);
    }
    if (searchParams.has('doorSide')) {
      filters.doorSide = searchParams.get('doorSide') as any;
    }

    const layouts = getRoomLayouts(filters);

    return NextResponse.json(layouts);
  } catch (error: any) {
    console.error('Error in GET /api/room-layouts:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/room-layouts
 * Creates a new room layout
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const layout = createRoomLayout(body);
    return NextResponse.json(layout, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/room-layouts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create layout' },
      { status: 400 }
    );
  }
}
