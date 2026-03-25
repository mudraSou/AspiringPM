import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "bg-blue-950/40 border-blue-800" : "bg-gray-900 border-gray-800"}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${accent ? "text-blue-400" : "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

async function getStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    onboardedUsers,
    newThisMonth,
    activeTodayGroups,
    activeWeekGroups,
    avgScoreResult,
    totalAttempts,
    avgAttemptScore,
    stageBreakdown,
    stageCounts,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { onboardingCompleted: true } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.activityLog.groupBy({ by: ["userId"], where: { activityDate: { gte: todayStart } } }),
    prisma.activityLog.groupBy({ by: ["userId"], where: { activityDate: { gte: weekStart } } }),
    prisma.readinessSnapshot.aggregate({ _avg: { overallScore: true } }),
    prisma.questionAttempt.count(),
    prisma.questionAttempt.aggregate({ _avg: { aiScore: true } }),
    prisma.learningStage.findMany({
      select: { id: true, name: true, orderIndex: true },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.stageProgress.groupBy({
      by: ["stageId"],
      where: { status: "completed", subTopicId: null },
      _count: { stageId: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        currentRole: true,
        onboardingCompleted: true,
        createdAt: true,
        readinessSnapshots: {
          select: { overallScore: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  const stageCountMap = Object.fromEntries(stageCounts.map((s) => [s.stageId, s._count.stageId]));

  return {
    totalUsers,
    onboardedUsers,
    newThisMonth,
    activeToday: activeTodayGroups.length,
    activeWeek: activeWeekGroups.length,
    onboardingRate: totalUsers > 0 ? Math.round((onboardedUsers / totalUsers) * 100) : 0,
    avgReadiness: Math.round(avgScoreResult._avg.overallScore ?? 0),
    totalAttempts,
    avgAttemptScore: Math.round(avgAttemptScore._avg.aiScore ?? 0),
    stages: stageBreakdown.map((s) => ({
      id: s.id,
      name: s.name,
      completions: stageCountMap[s.id] ?? 0,
    })),
    recentUsers,
  };
}

export default async function AdminOverviewPage() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Platform health at a glance</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers} sub={`+${stats.newThisMonth} this month`} />
        <StatCard label="Onboarded" value={`${stats.onboardingRate}%`} sub={`${stats.onboardedUsers} users`} accent />
        <StatCard label="Active Today" value={stats.activeToday} sub={`${stats.activeWeek} this week`} />
        <StatCard label="Avg Readiness" value={`${stats.avgReadiness}%`} sub={`${stats.totalAttempts} Q attempts`} />
      </div>

      {/* Two-column: stage funnel + recent users */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Stage completion funnel */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Stage Completion Funnel</h2>
          <div className="space-y-3">
            {stats.stages.map((stage) => {
              const pct = stats.onboardedUsers > 0
                ? Math.round((stage.completions / stats.onboardedUsers) * 100)
                : 0;
              return (
                <div key={stage.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400 truncate pr-2">{stage.name}</span>
                    <span className="text-gray-500 flex-shrink-0">{stage.completions} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent signups */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Signups</h2>
            <Link href="/admin/users" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
          </div>
          <div className="space-y-3">
            {stats.recentUsers.map((u) => (
              <Link
                key={u.id}
                href={`/admin/users/${u.id}`}
                className="flex items-center justify-between py-1.5 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-300 flex-shrink-0">
                    {u.name?.[0]?.toUpperCase() ?? u.email[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{u.name ?? u.email}</p>
                    <p className="text-xs text-gray-500 truncate">{u.currentRole ?? "No role set"}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  {u.readinessSnapshots[0] ? (
                    <span className={`text-sm font-semibold ${u.readinessSnapshots[0].overallScore >= 70 ? "text-green-400" : u.readinessSnapshots[0].overallScore >= 45 ? "text-yellow-400" : "text-gray-500"}`}>
                      {u.readinessSnapshots[0].overallScore}%
                    </span>
                  ) : (
                    <span className="text-xs text-gray-600">{u.onboardingCompleted ? "no score" : "not done"}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
