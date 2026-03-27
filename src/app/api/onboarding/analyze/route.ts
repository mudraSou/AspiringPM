import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { runAnalysisPipeline } from "@/lib/pipeline/analysis-pipeline";

// Allow up to 60s for the AI pipeline on Vercel
export const maxDuration = 60;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    await runAnalysisPipeline(userId);
    return NextResponse.json({ started: true });
  } catch (err) {
    console.error(`Pipeline failed for user ${userId}:`, err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
