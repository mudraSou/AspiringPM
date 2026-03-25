import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    onboardedUsers,
    activeToday,
    activeThisWeek,
    newThisMonth,
    avgScoreResult,
    totalStages,
    stageCompletions,
    totalQuestionAttempts,
    avgQuestionScore,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { onboardingCompleted: true } }),
    prisma.activityLog.groupBy({
      by: ["userId"],
      where: { activityDate: { gte: todayStart } },
    }).then((r) => r.length),
    prisma.activityLog.groupBy({
      by: ["userId"],
      where: { activityDate: { gte: weekStart } },
    }).then((r) => r.length),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.readinessSnapshot.aggregate({
      _avg: { overallScore: true },
    }),
    prisma.learningStage.count(),
    prisma.stageProgress.count({
      where: { status: "completed", subTopicId: null },
    }),
    prisma.questionAttempt.count(),
    prisma.questionAttempt.aggregate({
      _avg: { aiScore: true },
    }),
  ]);

  // Stage completion breakdown
  const stageBreakdown = await prisma.learningStage.findMany({
    select: { id: true, name: true, orderIndex: true },
    orderBy: { orderIndex: "asc" },
  });

  const stageCounts = await prisma.stageProgress.groupBy({
    by: ["stageId"],
    where: { status: "completed", subTopicId: null },
    _count: { stageId: true },
  });

  const stageCountMap = Object.fromEntries(stageCounts.map((s) => [s.stageId, s._count.stageId]));

  return NextResponse.json({
    users: {
      total: totalUsers,
      onboarded: onboardedUsers,
      activeToday,
      activeThisWeek,
      newThisMonth,
      onboardingRate: totalUsers > 0 ? Math.round((onboardedUsers / totalUsers) * 100) : 0,
    },
    scores: {
      avgReadiness: Math.round(avgScoreResult._avg.overallScore ?? 0),
      avgQuestionScore: Math.round(avgQuestionScore._avg.aiScore ?? 0),
      totalQuestionAttempts,
    },
    learning: {
      totalStages,
      totalStageCompletions: stageCompletions,
      stages: stageBreakdown.map((s) => ({
        id: s.id,
        name: s.name,
        order: s.orderIndex,
        completions: stageCountMap[s.id] ?? 0,
      })),
    },
  });
}
