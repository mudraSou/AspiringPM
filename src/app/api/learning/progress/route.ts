import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { evaluateAssignment } from "@/lib/agents/assignment-evaluator";
import { analyzeGaps } from "@/lib/agents/gap-analyzer";
import { logActivity } from "@/lib/activity";
import { Prisma } from "@prisma/client";
import { sendGatePassEmail } from "@/lib/email/send";
import {
  generateQuickCheckMCQ,
  scoreQuickCheck,
  stripAnswers,
  type QCQuestion,
} from "@/lib/agents/quickcheck-generator";

export async function POST(req: NextRequest) {
  try {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json();
  const { action, stageId } = body;

  if (!action || !stageId) {
    return NextResponse.json({ error: "Missing action or stageId" }, { status: 400 });
  }

  // ─── COMPLETE RESOURCE ────────────────────────────────────────────────────
  if (action === "complete_resource") {
    const { subTopicId, resourceIndex } = body;
    if (!subTopicId || resourceIndex === undefined) {
      return NextResponse.json({ error: "Missing subTopicId or resourceIndex" }, { status: 400 });
    }

    // Get or create sub-topic progress row
    const existing = await prisma.stageProgress.findUnique({
      where: { userId_stageId_subTopicId: { userId, stageId, subTopicId } },
    });

    const completed: string[] = (existing?.resourcesCompleted as string[]) ?? [];
    const resourceKey = String(resourceIndex);
    if (!completed.includes(resourceKey)) completed.push(resourceKey);

    // Check if all resources are done (to auto-complete if no quick check)
    const subTopic = await prisma.learningSubTopic.findUnique({
      where: { id: subTopicId },
      select: { resources: true, quickCheckPrompt: true },
    });
    const resources = subTopic?.resources as unknown[];
    const allResourcesDone = resources?.every((_, i) => completed.includes(String(i)));
    const hasQuickCheck = !!subTopic?.quickCheckPrompt;
    const newStatus = allResourcesDone && !hasQuickCheck ? "completed" : "in_progress";

    await prisma.stageProgress.upsert({
      where: { userId_stageId_subTopicId: { userId, stageId, subTopicId } },
      update: {
        resourcesCompleted: completed as unknown as Prisma.InputJsonValue,
        status: newStatus,
        ...(newStatus === "completed" ? { completedAt: new Date() } : {}),
      },
      create: {
        userId,
        stageId,
        subTopicId,
        resourcesCompleted: completed as unknown as Prisma.InputJsonValue,
        status: newStatus,
        ...(newStatus === "completed" ? { completedAt: new Date() } : {}),
      },
    });

    await logActivity(userId, "resource_completed", { stageId, subTopicId, resourceIndex });

    return NextResponse.json({ status: newStatus, resourcesCompleted: completed });
  }

  // ─── GET QUICK CHECK (generate fresh MCQ) ────────────────────────────────
  if (action === "get_quickcheck") {
    const { subTopicId } = body;
    if (!subTopicId) {
      return NextResponse.json({ error: "Missing subTopicId" }, { status: 400 });
    }

    const rl = await checkAIRateLimit(userId);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const [subTopic, existing] = await Promise.all([
      prisma.learningSubTopic.findUnique({
        where: { id: subTopicId },
        select: { name: true, description: true, stage: { select: { name: true } } },
      }),
      prisma.stageProgress.findUnique({
        where: { userId_stageId_subTopicId: { userId, stageId, subTopicId } },
        select: { quickCheckAttempts: true },
      }),
    ]);

    if (!subTopic) {
      return NextResponse.json({ error: "Sub-topic not found" }, { status: 404 });
    }

    const attemptNumber = (existing?.quickCheckAttempts ?? 0) + 1;

    const questions = await generateQuickCheckMCQ({
      subTopicName: subTopic.name,
      stageName: subTopic.stage.name,
      subTopicDescription: subTopic.description,
      attemptNumber,
    });

    // Store full questions (with correct answers) server-side
    await prisma.stageProgress.upsert({
      where: { userId_stageId_subTopicId: { userId, stageId, subTopicId } },
      update: {
        quickCheckQuestions: questions as unknown as Prisma.InputJsonValue,
        quickCheckAttempts: attemptNumber,
      },
      create: {
        userId,
        stageId,
        subTopicId,
        quickCheckQuestions: questions as unknown as Prisma.InputJsonValue,
        quickCheckAttempts: attemptNumber,
      },
    });

    // Return questions WITHOUT correct answers
    return NextResponse.json({ questions: stripAnswers(questions), attemptNumber });
  }

  // ─── SUBMIT QUICK CHECK (score MCQ answers) ───────────────────────────────
  if (action === "submit_quickcheck") {
    const { subTopicId, answers } = body;
    if (!subTopicId || !answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Missing subTopicId or answers" }, { status: 400 });
    }

    const progress = await prisma.stageProgress.findUnique({
      where: { userId_stageId_subTopicId: { userId, stageId, subTopicId } },
      select: { quickCheckQuestions: true },
    });

    if (!progress?.quickCheckQuestions) {
      return NextResponse.json({ error: "No active quick check — call get_quickcheck first" }, { status: 400 });
    }

    const storedQuestions = progress.quickCheckQuestions as unknown as QCQuestion[];
    const { score, correctCount, passed, results } = scoreQuickCheck(storedQuestions, answers);

    const feedback = passed
      ? `You got ${correctCount}/3 correct — great work!`
      : `You got ${correctCount}/3 correct. Review the explanations and try again.`;

    await prisma.stageProgress.update({
      where: { userId_stageId_subTopicId: { userId, stageId, subTopicId } },
      data: {
        quickCheckScore: score,
        quickCheckFeedback: feedback,
        ...(passed ? { status: "completed", completedAt: new Date() } : {}),
      },
    });

    await logActivity(userId, "quickcheck_submitted", { stageId, subTopicId, score, passed });

    return NextResponse.json({ score, feedback, passed, results });
  }

  // ─── SUBMIT GATE ASSIGNMENT ───────────────────────────────────────────────
  if (action === "submit_gate") {
    const { submission } = body;
    if (!submission?.trim()) {
      return NextResponse.json({ error: "Submission is required" }, { status: 400 });
    }

    const rl = await checkAIRateLimit(userId);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const [stage, user] = await Promise.all([
      prisma.learningStage.findUnique({ where: { id: stageId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, targetPmRole: true, industry: true },
      }),
    ]);

    if (!stage?.gateAssignmentPrompt) {
      return NextResponse.json({ error: "Stage has no gate assignment" }, { status: 400 });
    }

    const rubric = (stage.gateAssignmentRubric as { criteria: Array<{ name: string; weight: number; description: string }> }).criteria ?? [];

    const evaluation = await evaluateAssignment({
      assignmentPrompt: stage.gateAssignmentPrompt,
      rubric,
      submission,
      passingScore: stage.gatePassingScore,
      userContext: {
        targetPmRole: user?.targetPmRole ?? "general",
        industry: user?.industry ?? "Technology",
      },
    });

    // Save gate progress (subTopicId: null = stage-level record)
    const existingGate = await prisma.stageProgress.findFirst({
      where: { userId, stageId, subTopicId: { equals: null } },
    });

    const gateData = {
      gateSubmission: submission,
      gateScore: evaluation.totalScore,
      gateFeedback: JSON.stringify(evaluation),
      gateSubmittedAt: new Date(),
      gateEvaluatedAt: new Date(),
      status: evaluation.passed ? "completed" : "in_progress",
      ...(evaluation.passed ? { completedAt: new Date() } : {}),
    };

    if (existingGate) {
      await prisma.stageProgress.update({ where: { id: existingGate.id }, data: gateData });
    } else {
      await prisma.stageProgress.create({ data: { userId, stageId, ...gateData } });
    }

    // If passed, trigger readiness re-analysis + email
    if (evaluation.passed) {
      await logActivity(userId, "stage_completed", {
        stageId,
        stageName: stage.name,
        score: evaluation.totalScore,
      });

      // Send gate-pass email (fire-and-forget)
      if (user?.email) {
        prisma.learningStage
          .findFirst({
            where: { orderIndex: { gt: stage.orderIndex } },
            orderBy: { orderIndex: "asc" },
            select: { name: true },
          })
          .then((nextStage) => {
            sendGatePassEmail(user.email!, {
              name: user.name ?? "",
              stageName: stage.name,
              score: evaluation.totalScore,
              strengths: evaluation.strengths ?? [],
              nextStageName: nextStage?.name ?? null,
            });
          })
          .catch(() => {
            // Non-critical
          });
      }

      const [psiEntries, targetPmRole] = await Promise.all([
        prisma.experienceEntry.findMany({ where: { userId } }),
        user?.targetPmRole ?? "general",
      ]);

      // Re-run gap analyzer to update readiness score
      await analyzeGaps({
        userId,
        psiEntries: psiEntries.map((e) => ({
          problemStatement: e.problemStatement,
          solutionDescription: e.solutionDescription,
          impactDescription: e.impactDescription,
          impactMetrics: e.impactMetrics,
          skillTags: e.skillTags,
        })),
        conversationSignals: `Completed stage: ${stage.name} with score ${evaluation.totalScore}/100`,
        targetPmRole,
        triggeredBy: "stage_completion",
      });
    } else {
      await logActivity(userId, "gate_attempted", {
        stageId,
        score: evaluation.totalScore,
        passed: false,
      });
    }

    return NextResponse.json({
      score: evaluation.totalScore,
      passed: evaluation.passed,
      overallFeedback: evaluation.overallFeedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      criteriaResults: evaluation.criteriaResults,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
