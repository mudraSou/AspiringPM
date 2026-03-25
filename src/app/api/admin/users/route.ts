import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;
  const search = searchParams.get("q") ?? "";
  const filter = searchParams.get("filter") ?? "all"; // all | onboarded | active

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { currentRole: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filter === "onboarded" ? { onboardingCompleted: true } : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        currentRole: true,
        company: true,
        targetPmRole: true,
        onboardingCompleted: true,
        createdAt: true,
        publicProfileSlug: true,
        readinessSnapshots: {
          select: { overallScore: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        streakRecord: {
          select: { currentStreak: true, longestStreak: true },
        },
        stageProgress: {
          where: { status: "completed", subTopicId: null },
          select: { stageId: true },
        },
        _count: {
          select: { questionAttempts: true, activityLogs: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const formatted = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    currentRole: u.currentRole,
    company: u.company,
    targetPmRole: u.targetPmRole,
    onboardingCompleted: u.onboardingCompleted,
    createdAt: u.createdAt,
    publicProfileSlug: u.publicProfileSlug,
    latestScore: u.readinessSnapshots[0]?.overallScore ?? null,
    currentStreak: u.streakRecord?.currentStreak ?? 0,
    stagesCompleted: u.stageProgress.length,
    questionAttempts: u._count.questionAttempts,
    totalActivities: u._count.activityLogs,
  }));

  return NextResponse.json({
    users: formatted,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
