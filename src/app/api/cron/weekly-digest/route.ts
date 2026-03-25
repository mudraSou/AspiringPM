/**
 * Weekly Digest Cron
 *
 * Trigger: every Sunday at 10:00 IST (04:30 UTC) via Vercel Cron or external scheduler.
 *
 * Vercel cron.json:
 * { "crons": [{ "path": "/api/cron/weekly-digest", "schedule": "30 4 * * 0" }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendWeeklyDigestEmail } from "@/lib/email/send";

export const runtime = "nodejs";
export const maxDuration = 60;

function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const activeUsers = await prisma.user.findMany({
    where: {
      onboardingStep: "completed",
      activityLogs: {
        some: { createdAt: { gte: thirtyDaysAgo } },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      streakRecord: {
        select: { currentStreak: true },
      },
      readinessSnapshots: {
        orderBy: { createdAt: "desc" },
        take: 2,
        select: { overallScore: true, createdAt: true },
      },
      stageProgress: {
        where: { status: "completed", subTopicId: null },
        select: { stageId: true },
      },
      questionAttempts: {
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { id: true },
      },
      userSkillScores: {
        orderBy: { overallScore: "asc" },
        take: 4,
        select: {
          overallScore: true,
          skill: { select: { name: true } },
        },
      },
    },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const user of activeUsers) {
    const latestSnapshot = user.readinessSnapshots[0];
    const previousSnapshot = user.readinessSnapshots[1];

    if (!latestSnapshot) continue;

    const currentScore = latestSnapshot.overallScore;
    const scoreChange = previousSnapshot
      ? Math.round(latestSnapshot.overallScore - previousSnapshot.overallScore)
      : 0;

    // Skills with score < 60 are gap areas
    const topGapSkills = user.userSkillScores
      .filter((s) => s.overallScore < 60)
      .map((s) => s.skill.name);

    try {
      await sendWeeklyDigestEmail(user.email, {
        name: user.name ?? "",
        currentScore,
        scoreChange,
        stagesCompleted: user.stageProgress.length,
        questionsAttempted: user.questionAttempts.length,
        currentStreak: user.streakRecord?.currentStreak ?? 0,
        topGapSkills,
      });
      sent++;
    } catch (err) {
      errors.push(`${user.id}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    eligible: activeUsers.length,
    sent,
    errors: errors.length > 0 ? errors : undefined,
  });
}
