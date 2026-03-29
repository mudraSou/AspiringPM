import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import LearningProgressCard from "@/components/dashboard/LearningProgressCard";
import { RetakeAssessmentButton } from "@/components/dashboard/RetakeAssessmentButton";
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

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const gap = circ - filled;
  const color =
    score >= 70 ? "stroke-green-500" : score >= 45 ? "stroke-amber-400" : "stroke-indigo-500";
  const textColor =
    score >= 70 ? "text-green-600" : score >= 45 ? "text-amber-500" : "text-indigo-600";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="136" height="136" viewBox="0 0 136 136">
          <circle cx="68" cy="68" r={r} fill="none" className="stroke-gray-100 dark:stroke-gray-800" strokeWidth="10" />
          {score > 0 && (
            <circle
              cx="68" cy="68" r={r}
              fill="none"
              className={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${gap}`}
              strokeDashoffset={circ / 4}
              style={{ transition: "stroke-dasharray 1s ease-out" }}
            />
          )}
          <text x="68" y="62" textAnchor="middle" className="fill-gray-900 dark:fill-white" fontSize="26" fontWeight="700">
            {score}%
          </text>
          <text x="68" y="78" textAnchor="middle" className="fill-gray-400" fontSize="9" letterSpacing="1.5">
            READINESS
          </text>
        </svg>
      </div>
      <p className={`text-xs font-semibold ${textColor}`}>
        {score >= 70 ? "Ready to apply" : score >= 45 ? "On track" : "Building foundations"}
      </p>
    </div>
  );
}

function SkillCard({
  label,
  score,
  isFocus,
}: {
  label: string;
  score: number;
  isFocus: boolean;
}) {
  const bg =
    score >= 70
      ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30"
      : score >= 45
      ? "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30"
      : "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30";
  const scoreColor =
    score >= 70 ? "text-green-700 dark:text-green-400" : score >= 45 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
  const barColor = score >= 70 ? "bg-green-500" : score >= 45 ? "bg-amber-400" : "bg-rose-400";

  return (
    <div className={`relative rounded-xl border p-3 ${bg} transition-all`}>
      {isFocus && (
        <span className="absolute top-2.5 right-2.5 text-[9px] font-bold tracking-wide text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded-full uppercase">
          Focus
        </span>
      )}
      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 pr-10">{label}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
        </div>
        <span className={`text-sm font-bold w-9 text-right ${scoreColor}`}>{score}%</span>
      </div>
    </div>
  );
}

const activityLabel: Record<string, string> = {
  resource_completed: "Marked a learning resource as done",
  quickcheck_submitted: "Completed a quick check",
  stage_completed: "Completed a learning stage",
  gate_attempted: "Submitted a gate assignment",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const userId = session.user.id;

  const [user, snapshot, streakRecord, stages, allProgress, subTopicCount, completedSubTopicCount, recentActivity] = await Promise.all([
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
    prisma.learningSubTopic.count(),
    prisma.stageProgress.count({
      where: { userId, subTopicId: { not: null }, status: "completed" },
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
  const firstName = user?.name?.split(" ")[0] ?? "";
  const streak = streakRecord?.currentStreak ?? 0;

  const skillRows = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    key,
    label,
    score: categoryScores?.[key] ?? 0,
  }));
  const sortedByScore = [...skillRows].sort((a, b) => a.score - b.score);
  const focusKeys = new Set([sortedByScore[0]?.key, sortedByScore[1]?.key]);

  const progressMap = new Map(allProgress.map((p) => [p.stageId, p.status]));
  const completedCount = allProgress.filter((p) => p.status === "completed" || p.status === "skipped").length;
  const learningPct = subTopicCount > 0 ? Math.round((completedSubTopicCount / subTopicCount) * 100) : 0;
  const currentStage =
    stages.find((s) => progressMap.get(s.id) === "in_progress") ??
    stages.find((s) => !progressMap.has(s.id));

  // Days-to-milestone estimate: rough heuristic (1 sub-topic/day avg)
  const nextMilestonePct = [25, 50, 75, 100].find((m) => m > learningPct) ?? 100;
  const subTopicsToMilestone = Math.round(((nextMilestonePct - learningPct) / 100) * subTopicCount);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {firstName ? `Hey ${firstName} 👋` : "Welcome back"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-lg">
              {learningPct === 0
                ? `Your ${roleLabel} journey starts here. Let's build something real.`
                : learningPct < 50
                ? `You're ${learningPct}% through your ${roleLabel} path. ${subTopicsToMilestone} sub-topics to the ${nextMilestonePct}% milestone.`
                : learningPct < 100
                ? `${learningPct}% complete — you're in the top candidates for ${roleLabel} roles.`
                : `Path complete. Time to land that ${roleLabel} role.`}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-full">
                <span className="text-sm">🔥</span>
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{streak} day streak</span>
              </div>
            )}
            {score >= 70 && (
              <Link
                href="/dashboard/resume"
                className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Apply Now →
              </Link>
            )}
          </div>
        </div>

        {/* Retake assessment */}
        <div className="mt-3">
          <RetakeAssessmentButton />
        </div>

        {/* Progress strip */}
        {learningPct > 0 && (
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                style={{ width: `${learningPct}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium w-16 text-right">
              {completedSubTopicCount}/{subTopicCount} done
            </span>
          </div>
        )}
      </div>

      {/* ── 3-column grid ────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5 mb-6">

        {/* Col 1: Readiness score */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Readiness Score</p>
          <ScoreRing score={score} />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">{roleLabel}</p>

          {/* Next step CTA */}
          <div className="w-full mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Next step</p>
            {currentStage ? (
              <>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Stage {currentStage.orderIndex}: {currentStage.name}
                </p>
                <Link
                  href="/dashboard/learning"
                  className="w-full inline-flex items-center justify-center gap-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Continue Learning →
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  {completedCount === stages.length && stages.length > 0 ? "All stages complete!" : "Start Stage 1"}
                </p>
                <Link
                  href="/dashboard/learning"
                  className="w-full inline-flex items-center justify-center bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  {completedCount === stages.length ? "Review Path →" : "Start Learning →"}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Col 2: Skill breakdown (actionable cards) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Skill Breakdown</h2>
            <Link href="/onboarding/analysis" className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline">
              Full analysis →
            </Link>
          </div>
          <div className="space-y-2">
            {skillRows.map((row, i) => (
              <SkillCard
                key={row.key}
                label={row.label}
                score={row.score}
                isFocus={focusKeys.has(row.key)}
              />
            ))}
          </div>
        </div>

        {/* Col 3: Learning progress */}
        <LearningProgressCard
          completedCount={completedCount}
          totalStages={stages.length}
          learningPct={learningPct}
          completedSubTopics={completedSubTopicCount}
          totalSubTopics={subTopicCount}
          stages={stages}
          progressMap={Object.fromEntries(progressMap)}
          currentStageName={currentStage?.name ?? null}
        />
      </div>

      {/* ── Bottom row: Recent activity (full width) ───────── */}
      <div className="grid gap-5">

        {/* Recent activity */}
        {recentActivity.length > 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">Recent Activity</h2>
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
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />
                    <div className="min-w-0">
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{label}{detail}</span>
                      <span className="text-gray-400 text-xs ml-2">
                        {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center justify-center text-center gap-2">
            <p className="text-2xl">🚀</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No activity yet</p>
            <p className="text-xs text-gray-400">Complete your first learning stage to see progress here.</p>
            <Link
              href="/dashboard/learning"
              className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              Start learning →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
