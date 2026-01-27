'use client';

import RoomLayoutEditor from '@/components/roomeditor/RoomLayoutEditor';

/**
 * Room Layout Editor Page
 *
 * Visual editor for creating and editing room layouts that will be used
 * by the dungeon generation system. Provides a tile-based canvas for
 * drawing rooms, placing doors, and configuring room properties.
 */
export default function RoomEditorPage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#1a1a1a'
    }}>
      <RoomLayoutEditor />
    </div>
  );
}
