'use client';

import { useParams } from 'next/navigation';
import RoomLayoutEditor from '@/components/roomeditor/RoomLayoutEditor';

export default function EditRoomPage() {
  const { id } = useParams<{ id: string }>();
  const layoutId = parseInt(id, 10);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#1a1a1a'
    }}>
      <RoomLayoutEditor initialLayoutId={isNaN(layoutId) ? undefined : layoutId} />
    </div>
  );
}
