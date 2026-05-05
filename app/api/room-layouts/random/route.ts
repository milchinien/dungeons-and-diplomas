import { NextResponse } from 'next/server';
import { getRandomRoomLayout } from '@/lib/db/roomLayouts';
import type { LayoutFilterOptions } from '@/lib/roomlayouts/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/room-layouts/random
 * Gets a random room layout matching filters
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: LayoutFilterOptions = {};

    if (searchParams.has('roomType')) {
      filters.roomType = searchParams.get('roomType')!;
    }
    if (searchParams.has('doorSide')) {
      filters.doorSide = searchParams.get('doorSide') as any;
    }
    if (searchParams.has('difficulty')) {
      filters.difficulty = parseInt(searchParams.get('difficulty')!);
    }

    const layout = getRandomRoomLayout(filters);

    if (!layout) {
      return NextResponse.json(
        { error: 'No layouts found matching filters' },
        { status: 404 }
      );
    }

    return NextResponse.json(layout);
  } catch (error: any) {
    console.error('Error in GET /api/room-layouts/random:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
