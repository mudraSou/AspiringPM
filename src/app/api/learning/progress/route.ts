import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { evaluateAssignment } from "@/lib/agents/assignment-evaluator";
import { analyzeGaps } from "@/lib/agents/gap-analyzer";
import { logActivity } from "@/lib/activity";
import { Prisma } from "@prisma/client";
import { sendGatePassEmail } from "@/lib/email/send";

export async function POST(req: NextRequest) {
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

  // ─── SUBMIT QUICK CHECK ───────────────────────────────────────────────────
  if (action === "submit_quickcheck") {
    const { subTopicId, response } = body;
    if (!subTopicId || !response?.trim()) {
      return NextResponse.json({ error: "Missing subTopicId or response" }, { status: 400 });
    }

    const rl = await checkAIRateLimit(userId);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    // Quick checks are pass/fail based on length + basic content check
    // Simple heuristic: >= 50 chars = pass (avoids AI cost for lightweight checks)
    const passed = response.trim().length >= 50;
    const score = passed ? 80 : 30;
    const feedback = passed
      ? "Good summary — you've captured the key idea."
      : "Your response is too brief. Try to summarize the main takeaway in 2-3 sentences.";

    await prisma.stageProgress.upsert({
      where: { userId_stageId_subTopicId: { userId, stageId, subTopicId } },
      update: {
        quickCheckResponse: response,
        quickCheckScore: score,
        quickCheckFeedback: feedback,
        ...(passed ? { status: "completed", completedAt: new Date() } : {}),
      },
      create: {
        userId,
        stageId,
        subTopicId,
        quickCheckResponse: response,
        quickCheckScore: score,
        quickCheckFeedback: feedback,
        status: passed ? "completed" : "in_progress",
        ...(passed ? { completedAt: new Date() } : {}),
      },
    });

    await logActivity(userId, "quickcheck_submitted", { stageId, subTopicId, score });

    return NextResponse.json({ score, feedback, passed });
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
}
