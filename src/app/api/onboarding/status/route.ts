import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getStatus } from "@/lib/pipeline/analysis-pipeline";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getStatus(session.user.id);

  if (!status) {
    return NextResponse.json(
      { step: "reading_resume", progress: 0, message: "Starting..." },
      { status: 200 }
    );
  }

  return NextResponse.json(status);
}
