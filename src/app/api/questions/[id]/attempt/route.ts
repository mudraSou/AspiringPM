import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { evaluateQuestionAnswer } from "@/lib/agents/question-evaluator";
import { logActivity } from "@/lib/activity";
import { Prisma } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const rl = await checkAIRateLimit(userId);
  if (!rl.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const { answer } = await req.json();
  if (!answer?.trim()) return NextResponse.json({ error: "Answer is required" }, { status: 400 });

  const question = await prisma.question.findUnique({ where: { id: params.id } });
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const rawCriteria = question.evaluationCriteria;
  const evaluationCriteria = Array.isArray(rawCriteria) ? rawCriteria as Array<{ criterion: string; weight: number }> : [];

  const evaluation = await evaluateQuestionAnswer({
    questionText: question.questionText,
    evaluationCriteria,
    minExpectations: question.minExpectations,
    sampleAnswerPoints: question.sampleAnswerPoints,
    answer,
  });

  const attempt = await prisma.questionAttempt.create({
    data: {
      userId,
      questionId: question.id,
      answerText: answer,
      aiScore: evaluation.score,
      aiFeedback: evaluation.overallFeedback,
      criteriaResults: evaluation.criteriaResults as unknown as Prisma.InputJsonValue,
    },
  });

  await logActivity(userId, "question_attempted", {
    questionId: question.id,
    category: question.category,
    score: evaluation.score,
  });

  return NextResponse.json({
    attemptId: attempt.id,
    score: evaluation.score,
    overallFeedback: evaluation.overallFeedback,
    criteriaResults: evaluation.criteriaResults,
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
    modelAnswerHints: evaluation.modelAnswerHints,
  });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Evaluation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
