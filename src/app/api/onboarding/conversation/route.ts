import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { checkAIRateLimit } from "@/lib/rate-limit";
import {
  generateAssessmentQuestions,
  scoreAssessment,
  type MCQQuestion,
  type MCQQuestionPublic,
} from "@/lib/agents/assessment-generator";
import { analyzeGaps } from "@/lib/agents/gap-analyzer";

// GET — return existing questions or generate new ones
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const [user, convSession] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, currentRole: true, industry: true, targetPmRole: true },
    }),
    prisma.conversationSession.findFirst({
      where: { userId, sessionType: "onboarding" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user || !convSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const extractedData = convSession.extractedData as {
    gapSkills?: string[];
    questions?: MCQQuestion[];
    answers?: Record<string, string>;
    completed?: boolean;
    score?: number;
  } | null;

  // Already completed
  if (extractedData?.completed) {
    return NextResponse.json({
      questions: stripAnswers(extractedData.questions ?? []),
      answers: extractedData.answers ?? {},
      completed: true,
      score: extractedData.score ?? 0,
    });
  }

  // Questions already generated — return without correct answers
  if (extractedData?.questions?.length) {
    return NextResponse.json({
      questions: stripAnswers(extractedData.questions),
      answers: extractedData.answers ?? {},
      completed: false,
    });
  }

  // Generate questions
  const rl = await checkAIRateLimit(userId);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const allSkills = await prisma.skill.findMany({ select: { id: true, name: true } });
  const allSkillNames: Record<string, string> = {};
  for (const s of allSkills) allSkillNames[s.id] = s.name;

  const questions = await generateAssessmentQuestions({
    targetPmRole: user.targetPmRole ?? "general",
    industry: user.industry ?? "Technology",
    currentRole: user.currentRole ?? "Professional",
    gapSkills: extractedData?.gapSkills ?? [],
    allSkillNames,
    count: 8,
  });

  await prisma.conversationSession.update({
    where: { id: convSession.id },
    data: {
      extractedData: {
        ...extractedData,
        questions,
        answers: {},
        completed: false,
      } as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({
    questions: stripAnswers(questions),
    answers: {},
    completed: false,
  });
}

// POST — submit all answers, score, update gap analysis
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json();
  const answers: Record<string, string> = body.answers;

  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "answers object is required" }, { status: 400 });
  }

  const [user, convSession] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { targetPmRole: true },
    }),
    prisma.conversationSession.findFirst({
      where: { userId, sessionType: "onboarding" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user || !convSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const extractedData = convSession.extractedData as {
    gapSkills?: string[];
    questions?: MCQQuestion[];
    answers?: Record<string, string>;
    completed?: boolean;
  } | null;

  if (!extractedData?.questions?.length) {
    return NextResponse.json({ error: "No questions found. Please refresh." }, { status: 400 });
  }

  if (extractedData.completed) {
    return NextResponse.json({ error: "Assessment already completed" }, { status: 400 });
  }

  const { score, correctCount, signals, breakdown } = scoreAssessment(
    extractedData.questions,
    answers
  );

  const psiEntries = await prisma.experienceEntry.findMany({ where: { userId } });
  const signalText = signals
    .map((s) => `${s.skillId}: ${s.signal} (${s.strength})`)
    .join("\n");

  const { snapshot } = await analyzeGaps({
    userId,
    psiEntries: psiEntries.map((e) => ({
      problemStatement: e.problemStatement,
      solutionDescription: e.solutionDescription,
      impactDescription: e.impactDescription,
      impactMetrics: e.impactMetrics,
      skillTags: e.skillTags,
    })),
    conversationSignals: signalText,
    targetPmRole: user.targetPmRole ?? "general",
    triggeredBy: "onboarding",
  });

  await prisma.conversationSession.update({
    where: { id: convSession.id },
    data: {
      status: "completed",
      extractedData: {
        ...extractedData,
        answers,
        completed: true,
        score,
        correctCount,
        finalSnapshotId: snapshot.id,
      } as unknown as Prisma.InputJsonValue,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { onboardingStep: "analysis" },
  });

  return NextResponse.json({
    score,
    correctCount,
    total: extractedData.questions.length,
    breakdown,
    snapshotId: snapshot.id,
  });
}

function stripAnswers(questions: MCQQuestion[]): MCQQuestionPublic[] {
  return questions.map(({ correctOptionId: _c, explanation: _e, ...q }) => q);
}
