'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import SubjectStatCard from './dashboard/SubjectStatCard';
import QuestionStatsList from './dashboard/QuestionStatsList';

interface SkillDashboardProps {
  userId: number;
  onClose: () => void;
}

export default function SkillDashboard({ userId, onClose }: SkillDashboardProps) {
  const { stats, loading, error, hasData } = useDashboardData(userId);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10001,
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '2px solid #4CAF50',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ color: '#4CAF50', margin: 0, fontSize: '24px' }}>
            Skill Dashboard
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              fontSize: '16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Schließen
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '20px',
          overflowY: 'auto',
          flex: 1
        }}>
          {loading && (
            <p style={{ color: '#ccc', textAlign: 'center' }}>Lade Statistiken...</p>
          )}

          {error && (
            <p style={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</p>
          )}

          {!loading && !error && !hasData && (
            <p style={{ color: '#ccc', textAlign: 'center' }}>
              Noch keine Fragen beantwortet. Spiele ein paar Runden, um deine Statistiken zu sehen!
            </p>
          )}

          {!loading && !error && hasData && stats && (
            <div>
              {Object.entries(stats).map(([subjectKey, subjectData]) => (
                <SubjectStatCard
                  key={subjectKey}
                  subjectName={subjectData.subject_name}
                  averageElo={subjectData.average_elo}
                >
                  <QuestionStatsList questions={subjectData.questions} />
                </SubjectStatCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
