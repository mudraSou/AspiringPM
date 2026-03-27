import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  await prisma.experienceEntry.deleteMany({ where: { userId } });
  await prisma.workExperience.deleteMany({ where: { userId } });
  await prisma.conversationSession.deleteMany({ where: { userId } });
  await prisma.readinessSnapshot.deleteMany({ where: { userId } });
  await prisma.userSkillScore.deleteMany({ where: { userId } });
  await prisma.userLearningPath.deleteMany({ where: { userId } });
  await prisma.stageProgress.deleteMany({ where: { userId } });

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboardingStep: "upload",
      onboardingCompleted: false,
      targetPmRole: null,
      currentRole: null,
      industry: null,
    },
  });

  return NextResponse.json({ success: true });
}
