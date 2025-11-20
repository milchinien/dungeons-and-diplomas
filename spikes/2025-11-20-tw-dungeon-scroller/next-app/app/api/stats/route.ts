import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

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

    // Group by question and calculate stats
    const questionStats = new Map<number, {
      id: number;
      subject_key: string;
      subject_name: string;
      question: string;
      correct: number;
      wrong: number;
      timeout: number;
      elo: number;
    }>();

    for (const row of rows) {
      if (!questionStats.has(row.id)) {
        questionStats.set(row.id, {
          id: row.id,
          subject_key: row.subject_key,
          subject_name: row.subject_name,
          question: row.question,
          correct: 0,
          wrong: 0,
          timeout: 0,
          elo: 5 // Initial ELO
        });
      }

      const stats = questionStats.get(row.id)!;

      if (row.timeout_occurred) {
        stats.timeout++;
        // Timeout counts as wrong for ELO (sanftere Formel)
        stats.elo = Math.floor((stats.elo - (stats.elo - 1) / 4) * 10) / 10;
      } else if (row.is_correct) {
        stats.correct++;
        // Sanftere Formel für Aufstieg
        stats.elo = Math.ceil((stats.elo + (10 - stats.elo) / 3) * 10) / 10;
      } else {
        stats.wrong++;
        // Sanftere Formel für Abstieg
        stats.elo = Math.floor((stats.elo - (stats.elo - 1) / 4) * 10) / 10;
      }
    }

    // Group by subject
    const bySubject: { [key: string]: any } = {};

    questionStats.forEach((stats) => {
      if (!bySubject[stats.subject_key]) {
        bySubject[stats.subject_key] = {
          subject_name: stats.subject_name,
          questions: [],
          total_elo: 0,
          question_count: 0
        };
      }

      const roundedElo = Math.round(stats.elo);

      bySubject[stats.subject_key].questions.push({
        id: stats.id,
        question: stats.question,
        correct: stats.correct,
        wrong: stats.wrong,
        timeout: stats.timeout,
        elo: roundedElo
      });

      // Accumulate for average
      bySubject[stats.subject_key].total_elo += roundedElo;
      bySubject[stats.subject_key].question_count += 1;
    });

    // Calculate average ELO for each subject
    Object.keys(bySubject).forEach(key => {
      const subject = bySubject[key];
      subject.average_elo = Math.round(subject.total_elo / subject.question_count);
      // Clean up temp fields
      delete subject.total_elo;
      delete subject.question_count;
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
