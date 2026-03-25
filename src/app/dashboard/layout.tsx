import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import SidebarNav from "@/components/dashboard/sidebar-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  const userId = session.user.id;

  const [user, streak, stages, allProgress, subTopicCount, completedSubTopicCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.streakRecord.findUnique({ where: { userId }, select: { currentStreak: true } }),
    prisma.learningStage.findMany({ orderBy: { orderIndex: "asc" }, select: { id: true, name: true, orderIndex: true } }),
    prisma.stageProgress.findMany({ where: { userId, subTopicId: null } }),
    prisma.learningSubTopic.count(),
    prisma.stageProgress.count({ where: { userId, subTopicId: { not: null }, status: "completed" } }),
  ]);

  const progressMap = new Map(allProgress.map((p) => [p.stageId, p.status]));
  const currentStage =
    stages.find((s) => progressMap.get(s.id) === "in_progress") ??
    stages.find((s) => !progressMap.has(s.id));

  const completedStageCount = allProgress.filter(
    (p) => p.status === "completed" || p.status === "skipped"
  ).length;

  const learningPct = subTopicCount > 0
    ? Math.round((completedSubTopicCount / subTopicCount) * 100)
    : 0;

  const stageProgress = stages.length > 0
    ? `Stage ${completedStageCount + 1} of ${stages.length}`
    : undefined;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <SidebarNav
        userName={user?.name}
        streak={streak?.currentStreak ?? 0}
        currentStageName={currentStage?.name ?? null}
        stageProgress={stageProgress}
        learningPct={learningPct}
      />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
