import { NextResponse } from 'next/server';

export async function POST() {
  // Logout is purely client-side (localStorage clear)
  // This endpoint exists for consistency
  return NextResponse.json({ success: true });
}
