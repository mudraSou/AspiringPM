import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { username: string } }
) {
  const slug = params.username;

  // Allow lookup by slug or userId (fallback)
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ publicProfileSlug: slug }, { id: slug }],
      onboardingCompleted: true,
    },
    select: {
      id: true,
      name: true,
      currentRole: true,
      company: true,
      yearsOfExperience: true,
      targetPmRole: true,
      publicProfileSlug: true,
      profileVisibility: true,
      onboardingCompleted: true,
      createdAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const userId = user.id;
  const visibility = user.profileVisibility as {
    skills: boolean;
    experiences: boolean;
    assignments: boolean;
    activity: boolean;
  };

  const [snapshot, highlightedEntries, stageProgress, activityLogs, streakRecord] = await Promise.all([
    prisma.readinessSnapshot.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { overallScore: true, categoryScores: true },
    }),
    visibility.experiences
      ? prisma.experienceEntry.findMany({
          where: { userId, highlighted: true },
          orderBy: { orderIndex: "asc" },
          take: 5,
        })
      : Promise.resolve([]),
    visibility.assignments
      ? prisma.stageProgress.findMany({
          where: { userId, status: "completed", subTopicId: null, gateScore: { not: null } },
          include: { stage: { select: { name: true } } },
          orderBy: { completedAt: "desc" },
          take: 6,
        })
      : Promise.resolve([]),
    visibility.activity
      ? prisma.activityLog.findMany({
          where: { userId },
          select: { activityDate: true },
          orderBy: { activityDate: "desc" },
          take: 500,
        })
      : Promise.resolve([]),
    prisma.streakRecord.findUnique({
      where: { userId },
      select: { currentStreak: true, longestStreak: true },
    }),
  ]);

  // Check if all stages are completed (for verification badge)
  const totalStages = await prisma.learningStage.count();
  const completedStages = await prisma.stageProgress.count({
    where: { userId, status: "completed", subTopicId: null },
  });
  const isVerified = totalStages > 0 && completedStages >= totalStages;

  // Activity heatmap — count activities per day for last 90 days
  const activityMap: Record<string, number> = {};
  for (const log of activityLogs) {
    const day = new Date(log.activityDate).toISOString().split("T")[0];
    activityMap[day] = (activityMap[day] ?? 0) + 1;
  }

  const totalActivities = activityLogs.length;

  return NextResponse.json({
    profile: {
      name: user.name,
      currentRole: user.currentRole,
      company: user.company,
      yearsOfExperience: user.yearsOfExperience,
      targetPmRole: user.targetPmRole,
      slug: user.publicProfileSlug ?? user.id,
      isVerified,
    },
    skills: visibility.skills
      ? { overallScore: snapshot?.overallScore ?? 0, categoryScores: snapshot?.categoryScores ?? {} }
      : null,
    experiences: visibility.experiences ? highlightedEntries : [],
    assignments: visibility.assignments
      ? stageProgress.map((sp) => ({
          stageName: sp.stage.name,
          score: sp.gateScore,
          completedAt: sp.completedAt,
        }))
      : [],
    activity: visibility.activity
      ? { activityMap, totalActivities, currentStreak: streakRecord?.currentStreak ?? 0, longestStreak: streakRecord?.longestStreak ?? 0 }
      : null,
  });
}
