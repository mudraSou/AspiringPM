import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isAdminEmail } from "@/lib/admin";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold tracking-tight text-white">PM Platform <span className="text-xs text-gray-500 font-normal ml-1">Admin</span></span>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">Overview</Link>
              <Link href="/admin/users" className="text-gray-400 hover:text-white transition-colors">Users</Link>
            </div>
          </div>
          <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← Back to app
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  );
}
