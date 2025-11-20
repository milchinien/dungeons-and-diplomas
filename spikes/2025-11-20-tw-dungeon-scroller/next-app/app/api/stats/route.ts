import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { calculateRoundedElo, calculateProgressiveElo, type AnswerRecord } from '@/lib/scoring/EloCalculator';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Get all answers for this user with question details
    const query = `
      SELECT
        q.id,
        q.subject_key,
        q.subject_name,
        q.question,
        a.is_correct,
        a.timeout_occurred
      FROM answer_log a
      JOIN questions q ON a.question_id = q.id
      WHERE a.user_id = ?
      ORDER BY q.subject_key, q.id, a.answered_at
    `;

    const rows = db.prepare(query).all(userId) as Array<{
      id: number;
      subject_key: string;
      subject_name: string;
      question: string;
      is_correct: number;
      timeout_occurred: number;
    }>;

    // Group by question and build answer history
    const questionStats = new Map<number, {
      id: number;
      subject_key: string;
      subject_name: string;
      question: string;
      answers: AnswerRecord[];
      correct: number;
      wrong: number;
      timeout: number;
    }>();

    for (const row of rows) {
      if (!questionStats.has(row.id)) {
        questionStats.set(row.id, {
          id: row.id,
          subject_key: row.subject_key,
          subject_name: row.subject_name,
          question: row.question,
          answers: [],
          correct: 0,
          wrong: 0,
          timeout: 0
        });
      }

      const stats = questionStats.get(row.id)!;

      // Add answer to history
      stats.answers.push({
        is_correct: row.is_correct === 1,
        timeout_occurred: row.timeout_occurred === 1
      });

      // Update counts
      if (row.timeout_occurred) {
        stats.timeout++;
      } else if (row.is_correct) {
        stats.correct++;
      } else {
        stats.wrong++;
      }
    }

    // Group by subject
    const bySubject: { [key: string]: any } = {};

    questionStats.forEach((stats) => {
      if (!bySubject[stats.subject_key]) {
        bySubject[stats.subject_key] = {
          subject_name: stats.subject_name,
          questions: [],
          question_elos: [] // Store unrounded ELOs for accurate averaging
        };
      }

      // Calculate ELO using progressive algorithm
      const roundedElo = calculateRoundedElo(stats.answers);
      const progressiveElo = calculateProgressiveElo(stats.answers);

      bySubject[stats.subject_key].questions.push({
        id: stats.id,
        question: stats.question,
        correct: stats.correct,
        wrong: stats.wrong,
        timeout: stats.timeout,
        elo: roundedElo
      });

      // Store unrounded ELO for accurate averaging
      bySubject[stats.subject_key].question_elos.push(progressiveElo);
    });

    // Calculate average ELO for each subject (average first, then round)
    Object.keys(bySubject).forEach(key => {
      const subject = bySubject[key];
      const average = subject.question_elos.reduce((sum: number, elo: number) => sum + elo, 0) / subject.question_elos.length;
      subject.average_elo = Math.round(average);
      // Clean up temp field
      delete subject.question_elos;
    });

    return NextResponse.json(bySubject);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
