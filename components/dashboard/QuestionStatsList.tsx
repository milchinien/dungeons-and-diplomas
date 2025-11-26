'use client';

import { getMasteryLevel } from './types';

interface QuestionStat {
  id: number;
  question: string;
  correct: number;
  wrong: number;
  timeout: number;
  elo: number;
}

interface QuestionStatsListProps {
  questions: QuestionStat[];
}

export default function QuestionStatsList({ questions }: QuestionStatsListProps) {
  return (
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
          {questions.map((q) => {
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
  );
}
