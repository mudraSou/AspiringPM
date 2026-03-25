import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

const ROLE_LABELS: Record<string, string> = {
  consumer: "Consumer PM",
  growth: "Growth PM",
  technical: "Technical PM",
  platform: "Platform PM",
  ai: "AI PM",
  general: "General PM",
};

export default async function SummaryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const userId = session.user.id;

  const [user, experienceCount, entryCount, latestSnapshot, convSession] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, targetPmRole: true },
      }),
      prisma.workExperience.count({ where: { userId } }),
      prisma.experienceEntry.count({ where: { userId } }),
      prisma.readinessSnapshot.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.conversationSession.findFirst({
        where: { userId, sessionType: "onboarding" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  // Count unique skills
  const entries = await prisma.experienceEntry.findMany({
    where: { userId },
    select: { skillTags: true },
  });
  const uniqueSkills = new Set<string>();
  for (const e of entries) {
    const tags = e.skillTags as string[];
    if (Array.isArray(tags)) tags.forEach((t) => uniqueSkills.add(t));
  }

  const extractedData = convSession?.extractedData as {
    gapSkills?: string[];
  } | null;
  const gapCount = extractedData?.gapSkills?.length ?? 0;
  const score = latestSnapshot?.overallScore ?? 0;
  const roleLabel = ROLE_LABELS[user?.targetPmRole ?? ""] ?? "PM";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="w-full h-1 bg-gray-200 dark:bg-gray-800">
        <div className="h-full bg-blue-600" style={{ width: "50%" }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <span className="text-xs font-mono text-blue-600 uppercase tracking-wider">Step 4 of 6</span>
            <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
              Here&apos;s what we found
            </h1>
          </div>

          {/* Stats */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{experienceCount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Work experiences<br />found</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{uniqueSkills.size}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">PM-relevant<br />skills identified</div>
              </div>
              <div>
                <div className={`text-3xl font-bold ${score >= 60 ? "text-green-600" : score >= 40 ? "text-yellow-600" : "text-red-500"}`}>
                  {score}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Initial readiness<br />estimate</div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300">
              We found <strong>{entryCount} PM-relevant experiences</strong> from your resume and identified{" "}
              <strong>{uniqueSkills.size} skills</strong> mapped to the {roleLabel} taxonomy.{" "}
              {gapCount > 0 && (
                <>
                  We also spotted <strong>{gapCount} skill gaps</strong> we&apos;d like to ask you about.
                </>
              )}
            </div>
          </div>

          {/* Score interpretation */}
          <div className={`rounded-2xl border p-5 mb-6 ${
            score >= 60
              ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
              : score >= 40
              ? "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
              : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
          }`}>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {score >= 60
                ? "Strong foundation"
                : score >= 40
                ? "Good starting point"
                : "Lots of room to grow"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {score >= 60
                ? "You already have significant PM-relevant experience. The gaps are addressable — let's find them."
                : score >= 40
                ? "You have transferable experience, but there are real gaps to close. A clear plan will get you there."
                : "This is an initial estimate based only on your resume. The conversation often reveals a lot more — this score will go up."}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              This is an estimate based on your resume alone. It will improve after our conversation.
            </p>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Link
              href="/onboarding/conversation"
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm text-center block touch-target"
            >
              Continue to conversation →
            </Link>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              We&apos;ll ask {gapCount > 0 ? `a few targeted questions about your gaps` : "a few questions to fill in the picture"}.
              Takes about 5–10 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
