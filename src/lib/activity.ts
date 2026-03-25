/**
 * Activity logging + streak update utility.
 * Call after any meaningful user action (stage complete, gate submit, etc.)
 */

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export async function logActivity(
  userId: string,
  activityType: string,
  activityData?: Record<string, unknown>
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.activityLog.create({
    data: { userId, activityType, activityData: activityData as Prisma.InputJsonValue | undefined },
  });

  // Update streak
  const streak = await prisma.streakRecord.findUnique({ where: { userId } });

  if (!streak) {
    await prisma.streakRecord.create({
      data: { userId, currentStreak: 1, longestStreak: 1, lastActivityDate: today },
    });
    return;
  }

  const last = streak.lastActivityDate;
  const daysSinceLast = last
    ? Math.floor((today.getTime() - new Date(last).getTime()) / 86400000)
    : 999;

  if (daysSinceLast === 0) return; // already logged today

  const newStreak = daysSinceLast === 1 ? streak.currentStreak + 1 : 1;
  await prisma.streakRecord.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, streak.longestStreak),
      lastActivityDate: today,
    },
  });
}
