import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import DashboardNav from "@/components/dashboard/dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [user, streak] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } }),
    prisma.streakRecord.findUnique({ where: { userId: session.user.id }, select: { currentStreak: true } }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardNav userName={user?.name} streak={streak?.currentStreak ?? 0} />
      {children}
    </div>
  );
}
