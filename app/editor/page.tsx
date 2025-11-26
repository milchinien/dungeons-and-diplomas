'use client';

import { useEffect, useState } from 'react';
import EditorCanvas from '@/components/EditorCanvas';

export default function EditorPage() {
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const response = await fetch('/api/subjects');
        if (response.ok) {
          const subjects = await response.json();
          setAvailableSubjects(subjects);
        }
      } catch (error) {
        console.error('Failed to load subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []);

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        color: 'white',
        fontFamily: 'Rajdhani, monospace',
        fontSize: '24px'
      }}>
        Loading Editor...
      </div>
    );
  }

  return <EditorCanvas availableSubjects={availableSubjects} />;
}
