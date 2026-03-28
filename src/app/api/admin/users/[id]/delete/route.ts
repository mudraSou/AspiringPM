import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.activityLog.deleteMany({ where: { userId: id } });
  await prisma.streakRecord.deleteMany({ where: { userId: id } });
  await prisma.questionAttempt.deleteMany({ where: { userId: id } });
  await prisma.resumeVersion.deleteMany({ where: { userId: id } });
  await prisma.jobDescription.deleteMany({ where: { userId: id } });
  await prisma.stageProgress.deleteMany({ where: { userId: id } });
  await prisma.userLearningPath.deleteMany({ where: { userId: id } });
  await prisma.userSkillScore.deleteMany({ where: { userId: id } });
  await prisma.readinessSnapshot.deleteMany({ where: { userId: id } });
  await prisma.conversationSession.deleteMany({ where: { userId: id } });
  await prisma.experienceEntry.deleteMany({ where: { userId: id } });
  await prisma.workExperience.deleteMany({ where: { userId: id } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: id } });
  await prisma.session.deleteMany({ where: { userId: id } });
  await prisma.account.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
