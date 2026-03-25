import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { runAnalysisPipeline, setStatus } from "@/lib/pipeline/analysis-pipeline";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Run pipeline in background — don't await (Vercel serverless won't keep connection)
  // Deduplication is handled inside runAnalysisPipeline — safe to call multiple times
  runAnalysisPipeline(userId).catch((err) => {
    console.error(`Pipeline failed for user ${userId}:`, err);
  });

  return NextResponse.json({ started: true });
}
