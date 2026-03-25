import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { isAdminEmail } from "@/lib/admin";
import { redirect } from "next/navigation";

const ROLE_LABELS: Record<string, string> = {
  consumer: "Consumer PM", growth: "Growth PM", technical: "Technical PM",
  platform: "Platform PM", ai: "AI PM", general: "General PM",
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

async function getUserDetail(userId: string) {
  const [user, latestSnapshot, stageLevelProgress, recentAttempts, streakRecord, activityLogs, counts] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          currentRole: true,
          company: true,
          yearsOfExperience: true,
          targetPmRole: true,
          onboardingCompleted: true,
          onboardingStep: true,
          createdAt: true,
          publicProfileSlug: true,
          authProvider: true,
        },
      }),
      prisma.readinessSnapshot.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { overallScore: true, categoryScores: true, targetRole: true, createdAt: true },
      }),
      prisma.stageProgress.findMany({
        where: { userId, subTopicId: null },
        include: { stage: { select: { name: true, orderIndex: true, gatePassingScore: true } } },
        orderBy: { stage: { orderIndex: "asc" } },
      }),
      prisma.questionAttempt.findMany({
        where: { userId },
        include: { question: { select: { category: true, difficulty: true, questionText: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.streakRecord.findUnique({
        where: { userId },
        select: { currentStreak: true, longestStreak: true, lastActivityDate: true },
      }),
      prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { activityType: true, activityDate: true, createdAt: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          _count: {
            select: {
              experienceEntries: true,
              jobDescriptions: true,
              resumeVersions: true,
              questionAttempts: true,
              activityLogs: true,
            },
          },
        },
      }),
    ]);

  return { user, latestSnapshot, stageLevelProgress, recentAttempts, streakRecord, activityLogs, counts };
}

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id || !isAdminEmail(session.user.email)) redirect("/dashboard");

  const { user, latestSnapshot, stageLevelProgress, recentAttempts, streakRecord, activityLogs, counts } =
    await getUserDetail(params.id);

  if (!user) notFound();

  const categoryScores = (latestSnapshot?.categoryScores ?? {}) as Record<string, number>;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
        ← All users
      </Link>

      {/* Header */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-full bg-blue-900 flex items-center justify-center text-xl font-bold text-blue-300 flex-shrink-0">
            {user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">{user.name ?? "—"}</h1>
              {user.onboardingCompleted ? (
                <span className="text-xs px-2 py-0.5 bg-green-900/50 text-green-400 border border-green-800 rounded-full">Onboarded</span>
              ) : (
                <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-500 border border-gray-700 rounded-full">Step: {user.onboardingStep}</span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
            <p className="text-gray-500 text-xs mt-1">
              {user.currentRole ?? "No role"}{user.company ? ` · ${user.company}` : ""}
              {user.yearsOfExperience ? ` · ${user.yearsOfExperience} yrs exp` : ""}
              {" · "}{user.authProvider}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            {latestSnapshot && (
              <div>
                <p className={`text-3xl font-bold ${latestSnapshot.overallScore >= 70 ? "text-green-400" : latestSnapshot.overallScore >= 45 ? "text-yellow-400" : "text-red-400"}`}>
                  {latestSnapshot.overallScore}%
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {ROLE_LABELS[latestSnapshot.targetRole] ?? latestSnapshot.targetRole}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6 pt-5 border-t border-gray-800">
          {[
            { label: "Target", value: ROLE_LABELS[user.targetPmRole ?? ""] ?? "—" },
            { label: "Joined", value: new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
            { label: "Streak", value: streakRecord?.currentStreak ? `🔥 ${streakRecord.currentStreak}` : "—" },
            { label: "Stages done", value: stageLevelProgress.filter((s) => s.status === "completed").length },
            { label: "Q Attempts", value: counts?._count.questionAttempts ?? 0 },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-gray-600 uppercase tracking-wide">{item.label}</p>
              <p className="text-sm text-gray-300 font-medium mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        {user.publicProfileSlug && (
          <div className="mt-4">
            <Link
              href={`/profile/${user.publicProfileSlug}`}
              target="_blank"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              View public profile → /profile/{user.publicProfileSlug}
            </Link>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Skill breakdown */}
        {latestSnapshot && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Skill Breakdown</h2>
            <div className="space-y-3">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                const score = categoryScores[key] ?? 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-32 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${score >= 70 ? "bg-green-500" : score >= 45 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold w-8 text-right ${score >= 70 ? "text-green-400" : score >= 45 ? "text-yellow-400" : "text-red-400"}`}>
                      {score}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stage progress */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Stage Progress</h2>
          <div className="space-y-2">
            {stageLevelProgress.map((sp) => {
              const statusConfig = {
                completed: { dot: "bg-green-500", label: "Completed", text: "text-green-400" },
                in_progress: { dot: "bg-yellow-500", label: "In progress", text: "text-yellow-400" },
                not_started: { dot: "bg-gray-700", label: "Not started", text: "text-gray-600" },
              }[sp.status as string] ?? { dot: "bg-gray-700", label: sp.status, text: "text-gray-500" };

              return (
                <div key={sp.id} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConfig.dot}`} />
                    <span className="text-sm text-gray-300">{sp.stage.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    {sp.gateScore !== null && (
                      <span className={`text-xs font-semibold ${(sp.gateScore ?? 0) >= sp.stage.gatePassingScore ? "text-green-400" : "text-red-400"}`}>
                        {sp.gateScore}/{sp.stage.gatePassingScore}
                      </span>
                    )}
                    <span className={`text-xs ${statusConfig.text}`}>{statusConfig.label}</span>
                  </div>
                </div>
              );
            })}
            {stageLevelProgress.length === 0 && (
              <p className="text-sm text-gray-600">No stage progress yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent question attempts */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Question Attempts</h2>
          <div className="space-y-2">
            {recentAttempts.map((qa) => (
              <div key={qa.id} className="flex items-start justify-between py-1.5 border-b border-gray-800 last:border-0 gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 line-clamp-1">{qa.question.questionText}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{qa.question.category} · {'★'.repeat(qa.question.difficulty)}</p>
                </div>
                {qa.aiScore !== null && (
                  <span className={`text-sm font-semibold flex-shrink-0 ${qa.aiScore >= 80 ? "text-green-400" : qa.aiScore >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                    {qa.aiScore}
                  </span>
                )}
              </div>
            ))}
            {recentAttempts.length === 0 && (
              <p className="text-sm text-gray-600">No attempts yet</p>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {activityLogs.map((log, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-gray-800 last:border-0">
                <span className="text-xs text-gray-400 capitalize">{log.activityType.replace(/_/g, " ")}</span>
                <span className="text-xs text-gray-600">
                  {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
            {activityLogs.length === 0 && (
              <p className="text-sm text-gray-600">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
