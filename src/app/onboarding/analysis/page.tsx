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

const CATEGORY_LABELS: Record<string, string> = {
  cat_product_thinking: "Product Thinking & Strategy",
  cat_analytical: "Analytical & Data Skills",
  cat_user_research: "User Understanding & Research",
  cat_technical: "Technical Acumen",
  cat_communication: "Communication & Influence",
  cat_execution: "Execution & Delivery",
  cat_business: "Business Acumen",
  cat_leadership: "Leadership & Collaboration",
};

function ScoreBar({ score, label }: { score: number; label: string }) {
  // Positive progression palette: indigo → violet → amber → green
  // Even 0% reads as "journey starting", not failure
  const barColor =
    score >= 70 ? "bg-green-500" :
    score >= 45 ? "bg-amber-400" :
    score >= 20 ? "bg-violet-400" :
    "bg-indigo-400";

  const textColor =
    score >= 70 ? "text-green-600 dark:text-green-400" :
    score >= 45 ? "text-amber-600 dark:text-amber-400" :
    score >= 20 ? "text-violet-600 dark:text-violet-400" :
    "text-indigo-500 dark:text-indigo-400";

  const badge =
    score >= 70 ? { label: "Strong", cls: "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400" } :
    score >= 45 ? { label: "On track", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" } :
    score >= 20 ? { label: "Building", cls: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400" } :
    { label: "Starting", cls: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400" };

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
          <span className={`text-sm font-bold w-9 text-right ${textColor}`}>{score}%</span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${score > 0 ? Math.max(score, 3) : 0}%` }}
        />
      </div>
    </div>
  );
}

export default async function AnalysisPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const userId = session.user.id;

  const [user, snapshot, entries, skillCategories] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, targetPmRole: true, currentRole: true },
    }),
    prisma.readinessSnapshot.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.experienceEntry.findMany({
      where: { userId, priority: { in: ["high", "medium"] } },
      orderBy: [{ priority: "asc" }, { orderIndex: "asc" }],
      take: 8,
    }),
    prisma.skillCategory.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        skills: {
          include: {
            userSkillScores: { where: { userId } },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    }),
  ]);

  // Mark onboarding complete
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompleted: true, onboardingStep: "complete" },
  });

  const categoryScores = snapshot?.categoryScores as Record<string, number> | null;
  const overallScore = snapshot?.overallScore ?? 0;
  const roleLabel = ROLE_LABELS[user?.targetPmRole ?? ""] ?? "PM";

  const sortedCategories = Object.entries(categoryScores ?? {})
    .sort(([, a], [, b]) => a - b)
    .slice(0, 2);

  const highlightedEntries = entries.filter((e) => e.priority === "high").slice(0, 3);

  const scoreColor =
    overallScore >= 70 ? "text-green-600 dark:text-green-400" :
    overallScore >= 45 ? "text-amber-500 dark:text-amber-400" :
    overallScore >= 20 ? "text-violet-600 dark:text-violet-400" :
    "text-indigo-600 dark:text-indigo-400";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Indigo top bar */}
      <div className="w-full h-1 bg-indigo-600" />

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Analysis complete
          </span>
          <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
            Your PM Readiness Analysis
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {user?.name ? `${user.name}, here` : "Here"}&apos;s where you stand as a{" "}
            {user?.currentRole ?? "professional"} targeting {roleLabel} roles.
          </p>
        </div>

        {/* Overall score */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 mb-6 text-center">
          <div className={`text-6xl font-bold mb-2 ${scoreColor}`}>
            {overallScore}%
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Overall {roleLabel} Readiness
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {overallScore >= 70
              ? "You're in a strong position. Focus on closing the remaining gaps and applying."
              : overallScore >= 50
              ? "Solid foundation with clear areas to develop. Your learning path will close these gaps."
              : "This is a starting point. Many successful PMs started here — the path is clear."}
          </div>

          {overallScore >= 70 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Consider applying to roles — you meet the threshold
            </div>
          )}
        </div>

        {/* Skill breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5">Skills breakdown</h2>
          <div className="space-y-4">
            {skillCategories.map((cat) => {
              const catKey = Object.keys(CATEGORY_LABELS).find(
                (k) => CATEGORY_LABELS[k] === cat.name
              );
              const catScoreKey = cat.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
              const score =
                categoryScores?.[catScoreKey] ??
                categoryScores?.[catKey ?? ""] ??
                0;
              return <ScoreBar key={cat.id} score={score} label={cat.name} />;
            })}
          </div>
        </div>

        {/* Focus areas */}
        {sortedCategories.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 p-6 mb-6">
            <h2 className="font-semibold text-amber-900 dark:text-amber-100 mb-3">
              Your 2 focus areas
            </h2>
            <div className="space-y-2">
              {sortedCategories.map(([key, score]) => {
                const label =
                  Object.values(CATEGORY_LABELS).find((v) =>
                    v.toLowerCase().replace(/[^a-z0-9]/g, "_").startsWith(
                      key.replace(/[^a-z0-9]/g, "_").slice(0, 8)
                    )
                  ) ?? key;
                return (
                  <div key={key} className="flex items-center gap-3 text-sm">
                    <span className="text-amber-600 dark:text-amber-400 font-semibold w-10 flex-shrink-0">
                      {score}%
                    </span>
                    <span className="text-amber-800 dark:text-amber-200">
                      {label} — prioritize this in your learning path
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reframed experiences */}
        {highlightedEntries.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Your experience — reframed as PM
              </h2>
              <span className="text-xs text-gray-400">{entries.length} total entries</span>
            </div>
            <div className="space-y-4">
              {highlightedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                >
                  {entry.problemStatement && (
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Problem</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{entry.problemStatement}</p>
                    </div>
                  )}
                  {entry.solutionDescription && (
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Solution</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{entry.solutionDescription}</p>
                    </div>
                  )}
                  {entry.impactDescription && (
                    <div>
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Impact</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{entry.impactDescription}</p>
                    </div>
                  )}
                  {entry.resumePoint && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-xs text-gray-400">Resume bullet: </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">{entry.resumePoint}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-indigo-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Ready to close the gaps?</h2>
          <p className="text-indigo-200 mb-6 text-sm">
            Your personalized learning path is ready. Gated stages, curated resources, AI-evaluated assignments.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-white text-indigo-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors text-sm"
          >
            Go to my dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
