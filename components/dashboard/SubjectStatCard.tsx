'use client';

import { getMasteryLevel } from './types';

interface SubjectStatCardProps {
  subjectName: string;
  averageElo: number;
  children: React.ReactNode;
}

export default function SubjectStatCard({ subjectName, averageElo, children }: SubjectStatCardProps) {
  const subjectMastery = getMasteryLevel(averageElo);

  return (
    <div style={{ marginBottom: '30px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: subjectMastery.bgColor,
        borderRadius: '8px',
        border: `2px solid ${subjectMastery.color}`
      }}>
        <h3 style={{
          color: '#fff',
          margin: 0,
          fontSize: '20px',
          flex: 1
        }}>
          {subjectName}
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: subjectMastery.color,
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#000'
        }}>
          <span style={{ fontSize: '20px' }}>{subjectMastery.icon}</span>
          <span>{subjectMastery.label}</span>
          <span style={{
            marginLeft: '5px',
            padding: '2px 8px',
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
            color: '#fff'
          }}>
            Ø {averageElo}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
