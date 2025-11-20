import { NextResponse } from 'next/server';
import { logAnswer, type AnswerLogEntry } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { user_id, question_id, selected_answer_index, is_correct, answer_time_ms, timeout_occurred } = body;

    // Validation
    if (typeof user_id !== 'number' || user_id <= 0) {
      return NextResponse.json(
        { error: 'Valid user_id is required' },
        { status: 400 }
      );
    }

    if (typeof question_id !== 'number' || question_id <= 0) {
      return NextResponse.json(
        { error: 'Valid question_id is required' },
        { status: 400 }
      );
    }

    if (typeof selected_answer_index !== 'number' || selected_answer_index < 0) {
      return NextResponse.json(
        { error: 'Valid selected_answer_index is required' },
        { status: 400 }
      );
    }

    if (typeof is_correct !== 'boolean') {
      return NextResponse.json(
        { error: 'is_correct must be a boolean' },
        { status: 400 }
      );
    }

    const entry: AnswerLogEntry = {
      user_id,
      question_id,
      selected_answer_index,
      is_correct,
      answer_time_ms: answer_time_ms || undefined,
      timeout_occurred: timeout_occurred || false
    };

    logAnswer(entry);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging answer:', error);
    return NextResponse.json(
      { error: 'Failed to log answer' },
      { status: 500 }
    );
  }
}
