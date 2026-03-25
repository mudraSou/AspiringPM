import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { checkAIRateLimit } from "@/lib/rate-limit";
import { extractJDKeywords } from "@/lib/agents/resume-optimizer";
import { Prisma } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jds = await prisma.jobDescription.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, company: true, createdAt: true },
  });

  return NextResponse.json({ jds });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const rl = await checkAIRateLimit(userId);
  if (!rl.success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const body = await req.json();
  const { description, title, company } = body;
  if (!description?.trim()) return NextResponse.json({ error: "JD description required" }, { status: 400 });

  // Limit to 3 JDs
  const count = await prisma.jobDescription.count({ where: { userId } });
  if (count >= 3) {
    return NextResponse.json({ error: "Maximum 3 JDs allowed. Delete one first." }, { status: 400 });
  }

  const keywords = await extractJDKeywords(description);

  const jd = await prisma.jobDescription.create({
    data: {
      userId,
      description,
      title: title?.trim() || null,
      company: company?.trim() || null,
      extractedKeywords: keywords as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ jd });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.jobDescription.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
