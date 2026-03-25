import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const userId = params.id;

  const [user, snapshots, stageProgress, questionAttempts, activityLogs, streakRecord] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          currentRole: true,
          company: true,
          yearsOfExperience: true,
          targetPmRole: true,
          onboardingCompleted: true,
          onboardingStep: true,
          createdAt: true,
          publicProfileSlug: true,
          authProvider: true,
          _count: {
            select: {
              experienceEntries: true,
              jobDescriptions: true,
              resumeVersions: true,
              questionAttempts: true,
              activityLogs: true,
            },
          },
        },
      }),
      prisma.readinessSnapshot.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { overallScore: true, categoryScores: true, targetRole: true, triggeredBy: true, createdAt: true },
      }),
      prisma.stageProgress.findMany({
        where: { userId },
        include: {
          stage: { select: { name: true, orderIndex: true } },
          subTopic: { select: { name: true } },
        },
        orderBy: [{ stage: { orderIndex: "asc" } }],
      }),
      prisma.questionAttempt.findMany({
        where: { userId },
        include: {
          question: { select: { category: true, difficulty: true, questionText: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { activityType: true, activityDate: true, createdAt: true },
      }),
      prisma.streakRecord.findUnique({
        where: { userId },
        select: { currentStreak: true, longestStreak: true, lastActivityDate: true },
      }),
    ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Stage-level progress only (no subtopic)
  const stageLevelProgress = stageProgress.filter((sp) => sp.subTopicId === null);
  const subTopicProgress = stageProgress.filter((sp) => sp.subTopicId !== null);

  return NextResponse.json({
    user,
    streakRecord,
    snapshots,
    stageLevelProgress: stageLevelProgress.map((sp) => ({
      stageName: sp.stage.name,
      stageOrder: sp.stage.orderIndex,
      status: sp.status,
      gateScore: sp.gateScore,
      completedAt: sp.completedAt,
    })),
    subTopicProgress: subTopicProgress.map((sp) => ({
      stageName: sp.stage.name,
      subTopicName: sp.subTopic?.name,
      status: sp.status,
      quickCheckScore: sp.quickCheckScore,
    })),
    recentAttempts: questionAttempts.map((qa) => ({
      category: qa.question.category,
      difficulty: qa.question.difficulty,
      question: qa.question.questionText.slice(0, 100),
      score: qa.aiScore,
      createdAt: qa.createdAt,
    })),
    recentActivity: activityLogs,
  });
}
