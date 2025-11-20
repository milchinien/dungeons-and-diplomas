'use client';

import { useEffect, useState } from 'react';

interface QuestionStats {
  id: number;
  question: string;
  correct: number;
  wrong: number;
  timeout: number;
  elo: number;
}

interface SubjectStats {
  subject_name: string;
  average_elo: number;
  questions: QuestionStats[];
}

// Helper function to get mastery level
function getMasteryLevel(elo: number): { label: string; color: string; icon: string; bgColor: string } {
  // Perfect mastery: 9.5+ rounds to 10, display as gold
  if (Math.round(elo) >= 10) {
    return {
      label: '👑 Perfekt',
      color: '#FFD700',
      icon: '👑',
      bgColor: 'rgba(255, 215, 0, 0.1)'
    };
  } else if (elo >= 8) {
    return {
      label: '⚔️ Meister',
      color: '#4CAF50',
      icon: '⚔️',
      bgColor: 'rgba(76, 175, 80, 0.1)'
    };
  } else if (elo >= 5) {
    return {
      label: '🛡️ Fortgeschritten',
      color: '#2196F3',
      icon: '🛡️',
      bgColor: 'rgba(33, 150, 243, 0.1)'
    };
  } else {
    return {
      label: '⚠️ Anfänger',
      color: '#ff9800',
      icon: '⚠️',
      bgColor: 'rgba(255, 152, 0, 0.1)'
    };
  }
}

interface StatsData {
  [key: string]: SubjectStats;
}

interface SkillDashboardProps {
  userId: number;
  onClose: () => void;
}

export default function SkillDashboard({ userId, onClose }: SkillDashboardProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/stats?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to load stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError('Fehler beim Laden der Statistiken');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  const hasData = stats && Object.keys(stats).length > 0;

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

          {!loading && !error && hasData && (
            <div>
              {Object.entries(stats).map(([subjectKey, subjectData]) => {
                const subjectMastery = getMasteryLevel(subjectData.average_elo);
                return (
                  <div key={subjectKey} style={{ marginBottom: '30px' }}>
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
                        {subjectData.subject_name}
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
                          Ø {subjectData.average_elo}
                        </span>
                      </div>
                    </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #333' }}>
                          <th style={{
                            textAlign: 'left',
                            padding: '10px',
                            color: '#aaa',
                            fontWeight: 'normal'
                          }}>Frage</th>
                          <th style={{
                            textAlign: 'center',
                            padding: '10px',
                            color: '#aaa',
                            fontWeight: 'normal',
                            minWidth: '80px'
                          }}>Richtig</th>
                          <th style={{
                            textAlign: 'center',
                            padding: '10px',
                            color: '#aaa',
                            fontWeight: 'normal',
                            minWidth: '80px'
                          }}>Falsch</th>
                          <th style={{
                            textAlign: 'center',
                            padding: '10px',
                            color: '#aaa',
                            fontWeight: 'normal',
                            minWidth: '80px'
                          }}>Timeout</th>
                          <th style={{
                            textAlign: 'center',
                            padding: '10px',
                            color: '#aaa',
                            fontWeight: 'normal',
                            minWidth: '80px'
                          }}>ELO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectData.questions.map((q) => {
                          const questionMastery = getMasteryLevel(q.elo);
                          const isPerfect = Math.round(q.elo) >= 10;
                          return (
                            <tr
                              key={q.id}
                              style={{
                                borderBottom: '1px solid #2a2a2a',
                                backgroundColor: isPerfect
                                  ? 'rgba(255, 215, 0, 0.15)'
                                  : questionMastery.bgColor,
                                position: 'relative',
                                boxShadow: isPerfect
                                  ? '0 0 20px rgba(255, 215, 0, 0.5), inset 0 0 20px rgba(255, 215, 0, 0.1)'
                                  : 'none'
                              }}
                            >
                              <td style={{
                                padding: '4px 10px',
                                color: isPerfect ? '#FFD700' : '#ddd',
                                fontWeight: isPerfect ? 'bold' : 'normal'
                              }}>{q.question}</td>
                              <td style={{
                                padding: '4px 10px',
                                textAlign: 'center',
                                color: '#4CAF50',
                                fontWeight: 'bold'
                              }}>{q.correct}</td>
                              <td style={{
                                padding: '4px 10px',
                                textAlign: 'center',
                                color: '#f44336',
                                fontWeight: 'bold'
                              }}>{q.wrong}</td>
                              <td style={{
                                padding: '4px 10px',
                                textAlign: 'center',
                                color: '#ff9800',
                                fontWeight: 'bold'
                              }}>{q.timeout}</td>
                              <td style={{
                                padding: '4px 10px',
                                textAlign: 'center'
                              }}>
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 10px',
                                  backgroundColor: isPerfect ? '#FFD700' : questionMastery.color,
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  color: '#000',
                                  boxShadow: isPerfect ? '0 0 10px rgba(255, 215, 0, 0.8)' : 'none'
                                }}>
                                  <span style={{ fontSize: '16px' }}>
                                    {isPerfect ? '👑' : questionMastery.icon}
                                  </span>
                                  <span>{q.elo}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
