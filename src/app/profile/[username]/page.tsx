import { notFound } from "next/navigation";
import Link from "next/link";

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

// ─── Activity heatmap ────────────────────────────────────────────────────────

function ActivityHeatmap({ activityMap }: { activityMap: Record<string, number> }) {
  const today = new Date();
  const days: Array<{ date: string; count: number }> = [];

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    days.push({ date: key, count: activityMap[key] ?? 0 });
  }

  // Split into weeks (columns of 7)
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  function cellColor(count: number) {
    if (count === 0) return "bg-gray-100 dark:bg-gray-800";
    if (count === 1) return "bg-blue-200 dark:bg-blue-900";
    if (count === 2) return "bg-blue-400 dark:bg-blue-700";
    return "bg-blue-600 dark:bg-blue-500";
  }

  return (
    <div className="flex gap-0.5 overflow-x-auto">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-0.5">
          {week.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.count} activities`}
              className={`w-3 h-3 rounded-sm ${cellColor(day.count)}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Score bar ───────────────────────────────────────────────────────────────

function ScoreBar({ score, label }: { score: number; label: string }) {
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
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

interface ProfileData {
  profile: {
    name: string | null;
    currentRole: string | null;
    company: string | null;
    yearsOfExperience: string | null;
    targetPmRole: string | null;
    slug: string;
    isVerified: boolean;
  };
  skills: { overallScore: number; categoryScores: Record<string, number> } | null;
  experiences: Array<{
    id: string;
    problemStatement: string | null;
    solutionDescription: string | null;
    impactDescription: string | null;
    resumePoint: string | null;
    skillTags: unknown;
  }>;
  assignments: Array<{ stageName: string; score: number | null; completedAt: string | null }>;
  activity: {
    activityMap: Record<string, number>;
    totalActivities: number;
    currentStreak: number;
    longestStreak: number;
  } | null;
}

async function fetchProfile(username: string): Promise<ProfileData | null> {
  // In Next.js App Router we fetch from our own API route
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/profile/${username}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const data = await fetchProfile(params.username);
  if (!data) notFound();

  const { profile, skills, experiences, assignments, activity } = data;
  const roleLabel = ROLE_LABELS[profile.targetPmRole ?? ""] ?? "PM";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Minimal nav */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">PM Platform</Link>
          <Link
            href="/auth/signup"
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-5">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-2xl font-bold text-blue-600 flex-shrink-0">
              {profile.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {profile.name ?? "PM Candidate"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Aspiring {roleLabel}
                {profile.currentRole && ` · ${profile.currentRole}`}
                {profile.company && ` at ${profile.company}`}
              </p>
              {profile.yearsOfExperience && (
                <p className="text-xs text-gray-400 mt-0.5">{profile.yearsOfExperience} years experience</p>
              )}
            </div>
          </div>

          {profile.isVerified && (
            <div className="mt-4 inline-flex items-center gap-2 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Verified — Completed PM Readiness Program
            </div>
          )}
        </div>

        {/* Skills */}
        {skills && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900 dark:text-white">Skills</h2>
              <span className={`text-xl font-bold ${skills.overallScore >= 70 ? "text-green-600" : skills.overallScore >= 45 ? "text-yellow-500" : "text-red-500"}`}>
                {skills.overallScore}% {roleLabel}
              </span>
            </div>
            <div className="space-y-3">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <ScoreBar
                  key={key}
                  label={label}
                  score={(skills.categoryScores as Record<string, number>)[key] ?? 0}
                />
              ))}
            </div>
          </div>
        )}

        {/* Highlighted experiences */}
        {experiences.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Highlighted Experiences</h2>
            <div className="space-y-4">
              {experiences.map((e) => (
                <div key={e.id} className="border-l-2 border-blue-200 dark:border-blue-800 pl-4">
                  {e.resumePoint ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{e.resumePoint}</p>
                  ) : (
                    <>
                      {e.problemStatement && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                          <span className="text-xs font-semibold text-red-500 uppercase">Problem </span>
                          {e.problemStatement}
                        </p>
                      )}
                      {e.impactDescription && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="text-xs font-semibold text-green-500 uppercase">Impact </span>
                          {e.impactDescription}
                        </p>
                      )}
                    </>
                  )}
                  {Array.isArray(e.skillTags) && (e.skillTags as string[]).length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {(e.skillTags as string[]).slice(0, 4).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed assignments */}
        {assignments.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Completed Assignments</h2>
            <div className="space-y-2">
              {assignments.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-base">📋</span>
                    <span className="text-gray-700 dark:text-gray-300">{a.stageName}</span>
                  </div>
                  <span className={`font-semibold ${(a.score ?? 0) >= 80 ? "text-green-600" : (a.score ?? 0) >= 60 ? "text-yellow-500" : "text-gray-400"}`}>
                    {a.score}/100
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity */}
        {activity && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Activity</h2>
            <ActivityHeatmap activityMap={activity.activityMap} />
            <div className="flex gap-6 mt-4 text-sm">
              <div>
                <span className="text-orange-500 font-bold text-lg">🔥 {activity.currentStreak}</span>
                <p className="text-xs text-gray-400">Current streak</p>
              </div>
              <div>
                <span className="text-gray-700 dark:text-gray-300 font-bold text-lg">{activity.longestStreak}</span>
                <p className="text-xs text-gray-400">Longest streak</p>
              </div>
              <div>
                <span className="text-gray-700 dark:text-gray-300 font-bold text-lg">{activity.totalActivities}</span>
                <p className="text-xs text-gray-400">Total activities</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="bg-blue-600 rounded-2xl p-6 text-center text-white">
          <p className="font-bold text-lg mb-1">Build your own PM profile</p>
          <p className="text-blue-100 text-sm mb-4">Upload your resume. Get your readiness score. Start your path to PM.</p>
          <Link
            href="/auth/signup"
            className="inline-block bg-white text-blue-600 px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors"
          >
            Get Started Free →
          </Link>
        </div>
      </div>
    </div>
  );
}
