import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await prisma.experienceEntry.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      problemStatement: true,
      resumePoint: true,
      priority: true,
      highlighted: true,
      orderIndex: true,
    },
    orderBy: [{ priority: "asc" }, { orderIndex: "asc" }],
  });

  return NextResponse.json({ entries });
}
