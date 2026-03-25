import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const profileSchema = z.object({
  currentRole: z.string().min(1).max(200),
  company: z.string().max(200).optional(),
  yearsOfExperience: z.enum(["0-1", "1-2", "2-3", "3-5", "5+"]),
  industry: z.string().min(1).max(100),
  targetPmRole: z.enum(["consumer", "growth", "technical", "platform", "ai", "general"]),
  preparationStage: z.enum(["exploring", "studying", "preparing", "applying"]),
  jobDescriptions: z.array(z.string().max(5000)).max(3).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { jobDescriptions, ...profileData } = parsed.data;

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...profileData,
      onboardingStep: "processing",
    },
  });

  // Store job descriptions (up to 3)
  if (jobDescriptions?.length) {
    const validJDs = jobDescriptions.filter((jd) => jd.trim().length > 0);
    await Promise.all(
      validJDs.map((jd) =>
        prisma.jobDescription.create({
          data: {
            userId,
            description: jd.trim(),
            source: "onboarding",
          },
        })
      )
    );
  }

  return NextResponse.json({ success: true });
}
