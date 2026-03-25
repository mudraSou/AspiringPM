/**
 * Streak Reminder Cron
 *
 * Trigger: daily at 19:00 IST (13:30 UTC) via Vercel Cron or external scheduler.
 *
 * Vercel cron.json example:
 * { "crons": [{ "path": "/api/cron/streak-reminder", "schedule": "30 13 * * *" }] }
 *
 * Finds users who had a streak but haven't logged activity today,
 * and sends a gentle reminder email.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendStreakReminderEmail } from "@/lib/email/send";

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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Users who are onboarded and have an active streak
  const usersAtRisk = await prisma.user.findMany({
    where: {
      onboardingStep: "completed",
      streakRecord: {
        is: { currentStreak: { gt: 0 } },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      streakRecord: {
        select: { currentStreak: true, lastActivityDate: true },
      },
    },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const user of usersAtRisk) {
    const streak = user.streakRecord;
    if (!streak) continue;

    // Skip if already active today
    const lastActivity = streak.lastActivityDate;
    if (lastActivity && lastActivity >= todayStart) continue;

    try {
      await sendStreakReminderEmail(user.email, {
        name: user.name ?? "",
        currentStreak: streak.currentStreak,
      });
      sent++;
    } catch (err) {
      errors.push(`${user.id}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    eligible: usersAtRisk.length,
    sent,
    errors: errors.length > 0 ? errors : undefined,
  });
}
