import { NextResponse } from 'next/server';
import { logAnswer, type AnswerLogEntry } from '@/lib/db';
import { withErrorHandler } from '@/lib/api/errorHandler';
import {
  validatePositiveInt,
  validateAnswerIndex,
  validateBoolean
} from '@/lib/api/validation';

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();

  const { user_id, question_id, selected_answer_index, is_correct, answer_time_ms, timeout_occurred } = body;

  // Validation using centralized validators
  const userIdResult = validatePositiveInt(user_id, 'user_id');
  if (!userIdResult.success) return userIdResult.error;

  const questionIdResult = validatePositiveInt(question_id, 'question_id');
  if (!questionIdResult.success) return questionIdResult.error;

  const answerIndexResult = validateAnswerIndex(selected_answer_index, 'selected_answer_index');
  if (!answerIndexResult.success) return answerIndexResult.error;

  const isCorrectResult = validateBoolean(is_correct, 'is_correct');
  if (!isCorrectResult.success) return isCorrectResult.error;

  const entry: AnswerLogEntry = {
    user_id: userIdResult.value,
    question_id: questionIdResult.value,
    selected_answer_index: answerIndexResult.value,
    is_correct: isCorrectResult.value,
    answer_time_ms: answer_time_ms || undefined,
    timeout_occurred: timeout_occurred || false
  };

  await logAnswer(entry);

  return NextResponse.json({ success: true });
}, 'log answer');
