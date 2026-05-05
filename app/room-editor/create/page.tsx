'use client';

import RoomLayoutEditor from '@/components/roomeditor/RoomLayoutEditor';

export default function CreateRoomPage() {
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
