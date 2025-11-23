import { useState, useRef } from 'react';
import { loadAllEloScores } from '@/lib/scoring/EloService';
import { logHookError } from '@/lib/hooks';

interface SubjectScore {
  subjectKey: string;
  subjectName: string;
  startElo: number;
  currentElo: number;
  questionsAnswered: number;
}

export function useScoring(userId: number | null) {
  const [sessionScores, setSessionScores] = useState<SubjectScore[]>([]);
  const sessionStartEloRef = useRef<{ [key: string]: number }>({});

  const loadSessionElos = async (id: number) => {
    try {
      const eloScores = await loadAllEloScores(id);
      const startElos: { [key: string]: number } = {};
      const scores: SubjectScore[] = [];

      for (const score of eloScores) {
        startElos[score.subjectKey] = score.averageElo;
        scores.push({
          subjectKey: score.subjectKey,
          subjectName: score.subjectName,
          startElo: score.averageElo,
          currentElo: score.averageElo,
          questionsAnswered: 0
        });
      }

      sessionStartEloRef.current = startElos;
      setSessionScores(scores);
    } catch (error) {
      logHookError('useScoring', error, 'Failed to load session ELO');
    }
  };

  const updateSessionScores = async (subjectKey: string) => {
    if (!userId) return;

    try {
      const eloScores = await loadAllEloScores(userId);

      setSessionScores(prevScores => {
        return prevScores.map(score => {
          const updated = eloScores.find((s) => s.subjectKey === score.subjectKey);
          if (!updated) return score;

          return {
            ...score,
            currentElo: updated.averageElo,
            questionsAnswered: score.subjectKey === subjectKey
              ? score.questionsAnswered + 1
              : score.questionsAnswered
          };
        });
      });
    } catch (error) {
      logHookError('useScoring', error, 'Failed to update session scores');
    }
  };

  return {
    sessionScores,
    sessionStartEloRef,
    loadSessionElos,
    updateSessionScores
  };
}
