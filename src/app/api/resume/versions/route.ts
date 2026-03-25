import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const versions = await prisma.resumeVersion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      jd: { select: { title: true, company: true } },
    },
  });

  return NextResponse.json({ versions });
}
