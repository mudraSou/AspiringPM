import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      currentRole: true,
      company: true,
      yearsOfExperience: true,
      targetPmRole: true,
      publicProfileSlug: true,
      profileVisibility: true,
      onboardingCompleted: true,
    },
  });

  const highlighted = await prisma.experienceEntry.findMany({
    where: { userId, highlighted: true },
    select: { id: true },
  });

  return NextResponse.json({
    user,
    highlightedIds: highlighted.map((e) => e.id),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json();
  const { slug, visibility, highlightedIds } = body;

  // Validate slug: lowercase letters, numbers, hyphens only
  if (slug !== undefined) {
    const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (clean.length < 3) {
      return NextResponse.json({ error: "Slug must be at least 3 characters" }, { status: 400 });
    }

    // Check uniqueness (excluding current user)
    const existing = await prisma.user.findFirst({
      where: { publicProfileSlug: clean, NOT: { id: userId } },
    });
    if (existing) {
      return NextResponse.json({ error: "That URL is already taken" }, { status: 409 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        publicProfileSlug: clean,
        ...(visibility !== undefined ? { profileVisibility: visibility as Prisma.InputJsonValue } : {}),
      },
    });
  } else if (visibility !== undefined) {
    await prisma.user.update({
      where: { id: userId },
      data: { profileVisibility: visibility as Prisma.InputJsonValue },
    });
  }

  // Update highlighted PSI entries
  if (Array.isArray(highlightedIds)) {
    await prisma.experienceEntry.updateMany({
      where: { userId },
      data: { highlighted: false },
    });
    if (highlightedIds.length > 0) {
      await prisma.experienceEntry.updateMany({
        where: { userId, id: { in: highlightedIds.slice(0, 5) } },
        data: { highlighted: true },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
