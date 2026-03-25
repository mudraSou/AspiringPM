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
  cat_product_thinking: "Product Thinking",
  cat_analytical: "Analytical Skills",
  cat_user_research: "User Research",
  cat_technical: "Technical Acumen",
  cat_communication: "Communication",
  cat_execution: "Execution",
  cat_business: "Business Acumen",
  cat_leadership: "Leadership",
};

function ScoreBar({ score, label, isFocus }: { score: number; label: string; isFocus: boolean }) {
  const color = score >= 70 ? "bg-green-500" : score >= 45 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 dark:text-gray-400 w-36 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-sm font-semibold w-10 text-right ${score >= 70 ? "text-green-600" : score >= 45 ? "text-yellow-600" : "text-red-500"}`}>
        {score}%
      </span>
      {isFocus && (
        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium ml-1">← focus</span>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const userId = session.user.id;

  const [user, snapshot, streakRecord, stages, allProgress, recentActivity] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, targetPmRole: true, onboardingCompleted: true },
    }),
    prisma.readinessSnapshot.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.streakRecord.findUnique({ where: { userId } }),
    prisma.learningStage.findMany({
      orderBy: { orderIndex: "asc" },
      select: { id: true, name: true, orderIndex: true },
    }),
    prisma.stageProgress.findMany({
      where: { userId, subTopicId: null },
    }),
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  if (!user?.onboardingCompleted) redirect("/onboarding/upload");

  const score = snapshot?.overallScore ?? 0;
  const categoryScores = snapshot?.categoryScores as Record<string, number> | null;
  const roleLabel = ROLE_LABELS[user?.targetPmRole ?? ""] ?? "PM";

  const skillRows = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    key,
    label,
    score: categoryScores?.[key] ?? 0,
  }));
  const sortedByScore = [...skillRows].sort((a, b) => a.score - b.score);
  const focusKeys = new Set([sortedByScore[0]?.key, sortedByScore[1]?.key]);

  const progressMap = new Map(allProgress.map((p) => [p.stageId, p.status]));
  const completedCount = allProgress.filter((p) => p.status === "completed").length;
  const currentStage =
    stages.find((s) => progressMap.get(s.id) === "in_progress") ??
    stages.find((s) => !progressMap.has(s.id));

  const activityLabel: Record<string, string> = {
    resource_completed: "Marked a learning resource as done",
    quickcheck_submitted: "Completed a quick check",
    stage_completed: "Completed a learning stage",
    gate_attempted: "Submitted a gate assignment",
  };

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {roleLabel} readiness — here&apos;s where you stand today.
          </p>
        </div>

        {/* Apply now banner */}
        {score >= 70 && (
          <div className="mb-6 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200">
                🎉 You&apos;ve hit {score}% — you&apos;re ready to start applying
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                Your skills meet the threshold for {roleLabel} roles.
              </p>
            </div>
            <Link
              href="/dashboard/resume"
              className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex-shrink-0"
            >
              Build Resume →
            </Link>
          </div>
        )}

        {/* Score + next step */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Readiness Score</div>
            <div className={`text-5xl font-bold mb-1 ${score >= 70 ? "text-green-600" : score >= 45 ? "text-yellow-500" : "text-red-500"}`}>
              {score}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">{roleLabel}</div>
            <Link href="/onboarding/analysis" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              View full breakdown →
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Your Next Step</div>
            {currentStage ? (
              <>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">
                  Stage {currentStage.orderIndex}: {currentStage.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {progressMap.get(currentStage.id) === "in_progress"
                    ? "In progress — continue where you left off"
                    : "Next stage ready to start"}
                </p>
                <Link
                  href="/dashboard/learning"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue Learning →
                </Link>
              </>
            ) : (
              <div>
                <p className="font-semibold text-gray-900 dark:text-white mb-4">
                  {completedCount === stages.length && stages.length > 0
                    ? "All stages complete!"
                    : "Start Stage 1: PM Fundamentals"}
                </p>
                <Link href="/dashboard/learning" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                  {completedCount === stages.length ? "Review Path →" : "Start Learning →"}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Skill breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 dark:text-white">Skill Breakdown</h2>
            <Link href="/onboarding/analysis" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Full analysis →
            </Link>
          </div>
          <div className="space-y-3">
            {skillRows.map((row) => (
              <ScoreBar key={row.key} score={row.score} label={row.label} isFocus={focusKeys.has(row.key)} />
            ))}
          </div>
        </div>

        {/* Learning progress + quick actions */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Learning Progress</h2>
              <span className="text-xs text-gray-400">{completedCount}/{stages.length} stages</span>
            </div>
            <div className="space-y-2">
              {stages.slice(0, 6).map((stage) => {
                const status = progressMap.get(stage.id) ?? "not_started";
                return (
                  <div key={stage.id} className="flex items-center gap-3 text-sm">
                    <span className="w-5 flex-shrink-0 text-base">
                      {status === "completed" ? "✅" : status === "in_progress" ? "◉" : "○"}
                    </span>
                    <span className={`${status === "completed" ? "text-gray-400 line-through" : status === "in_progress" ? "text-gray-900 dark:text-white font-medium" : "text-gray-400 dark:text-gray-600"}`}>
                      {stage.name}
                    </span>
                  </div>
                );
              })}
              {stages.length > 6 && (
                <p className="text-xs text-gray-400 pl-8">+{stages.length - 6} more stages</p>
              )}
            </div>
            <Link href="/dashboard/learning" className="block mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View full path →
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: "/dashboard/resume", icon: "📄", label: "Build Resume for a JD" },
                { href: "/dashboard/questions", icon: "💬", label: "Practice Interview Questions" },
                { href: "/dashboard/profile", icon: "👤", label: "View Public Profile" },
                { href: "/onboarding/analysis", icon: "📊", label: "View Full Analysis" },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300"
                >
                  <span className="text-base">{a.icon}</span>
                  <span>{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        {recentActivity.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((a) => {
                const data = a.activityData as Record<string, unknown> | null;
                const label = activityLabel[a.activityType] ?? a.activityType.replace(/_/g, " ");
                const detail = data?.stageName
                  ? ` — ${data.stageName}`
                  : typeof data?.score === "number"
                  ? ` — Score: ${data.score}/100`
                  : "";
                return (
                  <div key={a.id} className="flex items-start gap-3 text-sm">
                    <span className="text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5">•</span>
                    <div>
                      <span className="text-gray-700 dark:text-gray-300">{label}{detail}</span>
                      <span className="text-gray-400 text-xs ml-2">
                        {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
