"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/learning", label: "Learning" },
  { href: "/dashboard/questions", label: "Questions" },
  { href: "/dashboard/resume", label: "Resume" },
  { href: "/dashboard/profile", label: "Profile" },
];

interface Props {
  userName?: string | null;
  streak?: number;
}

export default function DashboardNav({ userName, streak }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const linkClass = (href: string) =>
    isActive(href)
      ? "font-medium text-blue-600 dark:text-blue-400"
      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white";

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: logo + desktop links */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-bold text-lg tracking-tight">
            PM Platform
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className={linkClass(href)}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: streak + user + hamburger */}
        <div className="flex items-center gap-3 text-sm">
          {streak && streak > 0 && (
            <span className="text-orange-500 font-semibold hidden sm:inline">
              🔥 {streak}-day streak
            </span>
          )}
          <span className="text-gray-500 dark:text-gray-400 hidden sm:inline truncate max-w-[140px]">
            {userName}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="hidden sm:inline text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Sign out
          </button>

          {/* Hamburger (mobile only) */}
          <button
            className="sm:hidden p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 pb-4">
          {streak && streak > 0 && (
            <p className="text-orange-500 font-semibold text-sm py-3 border-b border-gray-100 dark:border-gray-800">
              🔥 {streak}-day streak
            </p>
          )}
          <div className="flex flex-col gap-1 pt-2">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`px-2 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(href)
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {label}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="px-2 py-3 text-left text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
