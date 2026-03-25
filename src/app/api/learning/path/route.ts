import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const [stages, allProgress, snapshot] = await Promise.all([
    prisma.learningStage.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        subTopics: { orderBy: { orderIndex: "asc" } },
      },
    }),
    prisma.stageProgress.findMany({ where: { userId } }),
    prisma.readinessSnapshot.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { overallScore: true, categoryScores: true },
    }),
  ]);

  // Index progress by stageId+subTopicId
  const progressMap = new Map<string, (typeof allProgress)[number]>();
  for (const p of allProgress) {
    const key = p.subTopicId ? `${p.stageId}:${p.subTopicId}` : p.stageId;
    progressMap.set(key, p);
  }

  // Determine unlock status — stage N unlocked if stage N-1 completed
  const result = stages.map((stage, idx) => {
    const stageProgress = progressMap.get(stage.id);
    const isCompleted = stageProgress?.status === "completed";
    const isUnlocked = idx === 0 || stages[idx - 1]
      ? progressMap.get(stages[idx - 1]?.id ?? "")?.status === "completed" || idx === 0
      : false;

    const subTopicProgress: Record<string, {
      status: string;
      resourcesCompleted: string[];
      quickCheckScore: number | null;
      quickCheckFeedback: string | null;
    }> = {};

    for (const st of stage.subTopics) {
      const p = progressMap.get(`${stage.id}:${st.id}`);
      subTopicProgress[st.id] = {
        status: p?.status ?? "not_started",
        resourcesCompleted: (p?.resourcesCompleted as string[]) ?? [],
        quickCheckScore: p?.quickCheckScore ?? null,
        quickCheckFeedback: p?.quickCheckFeedback ?? null,
      };
    }

    const QC_PASSING_SCORE = 50;
    const allSubTopicsDone =
      stage.subTopics.length === 0 ||
      stage.subTopics.every((st) => {
        const p = subTopicProgress[st.id];
        if (p?.status !== "completed") return false;
        if (!st.quickCheckPrompt) return true;
        return p.quickCheckScore !== null && p.quickCheckScore >= QC_PASSING_SCORE;
      });

    return {
      id: stage.id,
      name: stage.name,
      description: stage.description,
      orderIndex: stage.orderIndex,
      estimatedHoursMin: stage.estimatedHoursMin,
      estimatedHoursMax: stage.estimatedHoursMax,
      gateAssignmentPrompt: stage.gateAssignmentPrompt,
      gateAssignmentRubric: stage.gateAssignmentRubric,
      gatePassingScore: stage.gatePassingScore,
      skipIfScoreAbove: stage.skipIfScoreAbove,
      subTopics: stage.subTopics.map((st) => ({
        id: st.id,
        name: st.name,
        description: st.description,
        orderIndex: st.orderIndex,
        resources: st.resources,
        quickCheckPrompt: st.quickCheckPrompt,
        optionalIfSkilled: st.optionalIfSkilled,
      })),
      progress: {
        status: stageProgress?.status ?? "not_started",
        gateScore: stageProgress?.gateScore ?? null,
        gateFeedback: stageProgress?.gateFeedback ?? null,
        gateSubmittedAt: stageProgress?.gateSubmittedAt ?? null,
      },
      subTopicProgress,
      isUnlocked: isUnlocked || isCompleted,
      canAttemptGate: allSubTopicsDone,
    };
  });

  return NextResponse.json({
    stages: result,
    overallScore: snapshot?.overallScore ?? 0,
  });
}
