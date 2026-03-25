import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const [user, experienceCount, entryCount, latestSnapshot, convSession] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, targetPmRole: true },
      }),
      prisma.workExperience.count({ where: { userId } }),
      prisma.experienceEntry.count({ where: { userId } }),
      prisma.readinessSnapshot.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.conversationSession.findFirst({
        where: { userId, sessionType: "onboarding" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  // Count unique skills tagged across all entries
  const entries = await prisma.experienceEntry.findMany({
    where: { userId },
    select: { skillTags: true },
  });
  const uniqueSkills = new Set<string>();
  for (const e of entries) {
    const tags = e.skillTags as string[];
    if (Array.isArray(tags)) tags.forEach((t) => uniqueSkills.add(t));
  }

  const extractedData = convSession?.extractedData as {
    gapSkills?: string[];
    suggestedQuestions?: string[];
  } | null;

  return NextResponse.json({
    name: user?.name,
    targetPmRole: user?.targetPmRole,
    experienceCount,
    psiEntryCount: entryCount,
    uniqueSkillCount: uniqueSkills.size,
    initialScore: latestSnapshot?.overallScore ?? 0,
    topGaps: extractedData?.gapSkills ?? [],
    hasConversationData: !!convSession,
    sessionId: convSession?.id,
  });
}
