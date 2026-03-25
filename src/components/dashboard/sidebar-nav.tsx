"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface Props {
  userName?: string | null;
  streak?: number;
  currentStageName?: string | null;
  stageProgress?: string; // e.g. "Stage 3 of 11"
  learningPct?: number;
}

function IconGrid() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}
function IconDocument() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}
function IconMenu() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function SidebarNav({ userName, streak = 0, currentStageName, stageProgress, learningPct = 0 }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const navItems = [
    {
      href: "/dashboard",
      label: "Overview",
      icon: <IconGrid />,
      hint: null,
    },
    {
      href: "/dashboard/learning",
      label: "Learning Path",
      icon: <IconBook />,
      hint: stageProgress ?? (currentStageName ? `In: ${currentStageName}` : null),
    },
    {
      href: "/dashboard/questions",
      label: "Interview Prep",
      icon: <IconChat />,
      hint: "Practice questions",
    },
    {
      href: "/dashboard/resume",
      label: "Resume Builder",
      icon: <IconDocument />,
      hint: learningPct >= 50 ? "Ready to build" : "Unlocks at 50%",
    },
    {
      href: "/dashboard/profile",
      label: "Public Profile",
      icon: <IconUser />,
      hint: null,
    },
  ];

  const firstName = userName?.split(" ")[0] ?? "You";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">PM</span>
          </div>
          <span className="font-semibold text-gray-900 dark:text-white text-sm tracking-tight">PM Platform</span>
        </Link>
      </div>

      {/* Streak pill */}
      {streak > 0 && (
        <div className="mx-4 mt-4">
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-base">🔥</span>
            <div>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">{streak}-day streak</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400">Keep it up</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon, hint }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                active
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span className={`mt-0.5 flex-shrink-0 ${active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`}>
                {icon}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-medium leading-none mb-0.5 ${active ? "text-indigo-700 dark:text-indigo-300" : ""}`}>
                  {label}
                </p>
                {hint && (
                  <p className={`text-[11px] truncate ${active ? "text-indigo-500 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"}`}>
                    {hint}
                  </p>
                )}
              </div>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user + sign out */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
              {firstName[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{firstName}</p>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Sign out →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile: top bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">PM</span>
            </div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white">PM Platform</span>
          </Link>
          <div className="flex items-center gap-3">
            {streak > 0 && <span className="text-sm font-semibold text-amber-500">🔥 {streak}</span>}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 max-h-screen overflow-y-auto">
            <SidebarContent />
          </div>
        )}
      </header>
    </>
  );
}
