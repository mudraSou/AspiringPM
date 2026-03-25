import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");

  const [questions, attempts] = await Promise.all([
    prisma.question.findMany({
      where: {
        ...(category && category !== "all" ? { category } : {}),
        ...(difficulty ? { difficulty: parseInt(difficulty) } : {}),
      },
      orderBy: [{ category: "asc" }, { difficulty: "asc" }],
    }),
    prisma.questionAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Index latest attempt per question
  const latestAttempt = new Map<string, { score: number | null; createdAt: Date }>();
  for (const a of attempts) {
    if (!latestAttempt.has(a.questionId)) {
      latestAttempt.set(a.questionId, { score: a.aiScore, createdAt: a.createdAt });
    }
  }

  const result = questions.map((q) => ({
    id: q.id,
    category: q.category,
    subCategory: q.subCategory,
    questionText: q.questionText,
    difficulty: q.difficulty,
    relatedSkills: q.relatedSkills,
    lastAttempt: latestAttempt.get(q.id) ?? null,
  }));

  return NextResponse.json({ questions: result });
}
