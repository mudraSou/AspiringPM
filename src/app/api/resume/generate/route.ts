import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { optimizeResume, calculateAtsScore } from "@/lib/agents/resume-optimizer";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const rl = await checkAIRateLimit(userId);
  if (!rl.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const body = await req.json();
  const { jdId } = body;
  if (!jdId) return NextResponse.json({ error: "jdId required" }, { status: 400 });

  const [user, jd, psiEntries] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, currentRole: true, yearsOfExperience: true, targetPmRole: true, email: true },
    }),
    prisma.jobDescription.findFirst({ where: { id: jdId, userId } }),
    prisma.experienceEntry.findMany({
      where: { userId },
      orderBy: [{ priority: "asc" }, { orderIndex: "asc" }],
      take: 20,
    }),
  ]);

  if (!jd) return NextResponse.json({ error: "JD not found" }, { status: 404 });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const keywords = (jd.extractedKeywords as string[]) ?? [];

  const content = await optimizeResume({
    psiEntries: psiEntries.map((e) => ({
      id: e.id,
      problemStatement: e.problemStatement,
      solutionDescription: e.solutionDescription,
      impactDescription: e.impactDescription,
      resumePoint: e.resumePoint,
      priority: e.priority,
      skillTags: e.skillTags,
    })),
    jobDescription: jd.description,
    extractedKeywords: keywords,
    userProfile: {
      name: user.name ?? "Your Name",
      currentRole: user.currentRole ?? "Professional",
      yearsOfExperience: user.yearsOfExperience,
      targetPmRole: user.targetPmRole ?? "General PM",
    },
  });

  // Build resume text for ATS scoring
  const resumeText = [
    content.summary,
    ...content.selectedEntries.filter((e) => e.included).map((e) => `• ${e.resumePoint}`),
    content.skillsSection.join(", "),
  ].join("\n");

  const atsAnalysis = calculateAtsScore(resumeText, keywords);

  // Get next version number
  const lastVersion = await prisma.resumeVersion.findFirst({
    where: { userId, jdId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const version = (lastVersion?.version ?? 0) + 1;

  const resumeVersion = await prisma.resumeVersion.create({
    data: {
      userId,
      jdId,
      version,
      content: content as unknown as Prisma.InputJsonValue,
      atsScore: atsAnalysis.atsScore,
      atsDetails: atsAnalysis as unknown as Prisma.InputJsonValue,
      aiRationale: content.selectedEntries as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({
    resumeId: resumeVersion.id,
    content,
    atsAnalysis,
    version,
    userProfile: {
      name: user.name ?? "Your Name",
      email: user.email,
      currentRole: user.currentRole,
    },
    jd: { title: jd.title, company: jd.company },
  });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Resume generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
