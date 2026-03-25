"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const ROLE_LABELS: Record<string, string> = {
  consumer: "Consumer PM", growth: "Growth PM", technical: "Technical PM",
  platform: "Platform PM", ai: "AI PM", general: "General PM",
};

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  currentRole: string | null;
  company: string | null;
  targetPmRole: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  latestScore: number | null;
  currentStreak: number;
  stagesCompleted: number;
  questionAttempts: number;
  totalActivities: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), filter });
    if (search) params.set("q", search);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, filter, search]);

  useEffect(() => { load(); }, [load]);

  // Reset page on filter/search change
  function applySearch(val: string) { setSearch(val); setPage(1); }
  function applyFilter(val: string) { setFilter(val); setPage(1); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => applySearch(e.target.value)}
          placeholder="Search name, email, role..."
          className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          {[
            { val: "all", label: "All" },
            { val: "onboarded", label: "Onboarded" },
          ].map((f) => (
            <button
              key={f.val}
              onClick={() => applyFilter(f.val)}
              className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                filter === f.val
                  ? "bg-blue-600 text-white"
                  : "bg-gray-900 border border-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-600 text-sm">Loading...</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-gray-600 text-sm">No users found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide hidden md:table-cell">Target</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Score</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide hidden sm:table-cell">Stages</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide hidden lg:table-cell">Streak</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide hidden lg:table-cell">Activity</th>
                <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-300 flex-shrink-0">
                        {u.name?.[0]?.toUpperCase() ?? u.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{u.name ?? "—"}</p>
                        <p className="text-gray-500 text-xs truncate">{u.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-gray-300 text-xs">{ROLE_LABELS[u.targetPmRole ?? ""] ?? "—"}</p>
                    {u.currentRole && <p className="text-gray-600 text-xs">{u.currentRole}</p>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.latestScore !== null ? (
                      <span className={`font-semibold ${u.latestScore >= 70 ? "text-green-400" : u.latestScore >= 45 ? "text-yellow-400" : "text-gray-500"}`}>
                        {u.latestScore}%
                      </span>
                    ) : (
                      <span className="text-gray-700 text-xs">
                        {u.onboardingCompleted ? "—" : "incomplete"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="text-gray-300">{u.stagesCompleted}</span>
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <span className={u.currentStreak > 0 ? "text-orange-400" : "text-gray-700"}>
                      {u.currentStreak > 0 ? `🔥 ${u.currentStreak}` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <span className="text-gray-500 text-xs">{u.totalActivities}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-gray-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
