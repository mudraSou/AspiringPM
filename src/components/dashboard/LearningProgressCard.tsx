"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stage {
  id: string;
  name: string;
  orderIndex: number;
}

interface Props {
  completedCount: number;
  totalStages: number;
  learningPct: number;
  completedSubTopics: number;
  totalSubTopics: number;
  stages: Stage[];
  progressMap: Record<string, string>;
  currentStageName: string | null;
}

const MILESTONES = [
  { at: 25,  label: "25% — Foundations laid" },
  { at: 50,  label: "50% — Halfway through" },
  { at: 75,  label: "75% — Almost a PM" },
  { at: 100, label: "100% — Ready to apply" },
];

function getMotivation(pct: number, name: string | null): { headline: string; sub: string; color: string } {
  const first = name ? name.split(" ")[0] : null;
  const hi = first ? `${first}, ` : "";
  if (pct === 0)  return { headline: `${hi}your PM journey starts here.`, sub: "Complete your first sub-topic to get the ball rolling.", color: "text-gray-500" };
  if (pct < 15)  return { headline: "Great start — keep the momentum!", sub: "The first 15% is the hardest part. You're through it.", color: "text-blue-600 dark:text-blue-400" };
  if (pct < 30)  return { headline: "You're building real skills.", sub: "Consistency compounds. Show up again today.", color: "text-blue-600 dark:text-blue-400" };
  if (pct < 50)  return { headline: "Almost halfway — don't stop now.", sub: "Most people quit here. You won't.", color: "text-indigo-600 dark:text-indigo-400" };
  if (pct < 65)  return { headline: "Past the halfway point!", sub: "Downhill from here. The hardest stages are behind you.", color: "text-violet-600 dark:text-violet-400" };
  if (pct < 80)  return { headline: "You're in the top tier of candidates.", sub: "Most applicants never get this far. Keep pushing.", color: "text-purple-600 dark:text-purple-400" };
  if (pct < 100) return { headline: "The finish line is visible.", sub: "A few more stages and you're ready to apply.", color: "text-green-600 dark:text-green-400" };
  return { headline: "Path complete. You're ready.", sub: "Time to build your resume and start applying.", color: "text-green-600 dark:text-green-400" };
}

function DonutChart({ pct, size = 120 }: { pct: number; size?: number }) {
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimPct(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);

  const r = 44;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const filled = (animPct / 100) * circ;
  const gap = circ - filled;

  const arcClass =
    pct >= 80 ? "stroke-green-500" :
    pct >= 50 ? "stroke-violet-500" :
    pct >= 25 ? "stroke-indigo-500" :
    "stroke-blue-500";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" className="stroke-gray-100 dark:stroke-gray-800" strokeWidth="10" />
      {/* Progress arc */}
      {pct > 0 && (
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          className={arcClass}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${gap}`}
          strokeDashoffset={circ / 4}
          style={{ transition: "stroke-dasharray 1s ease-out" }}
        />
      )}
      {/* Centre % */}
      <text x={cx} y={cy - 4} textAnchor="middle" className="fill-gray-900 dark:fill-white" fontSize="20" fontWeight="700">
        {pct}%
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="fill-gray-400" fontSize="9" letterSpacing="1">
        COMPLETE
      </text>
    </svg>
  );
}

export default function LearningProgressCard({
  completedCount,
  totalStages,
  learningPct,
  completedSubTopics,
  totalSubTopics,
  stages,
  progressMap,
  currentStageName,
}: Props) {
  const motivation = getMotivation(learningPct, null);

  // Next milestone
  const nextMilestone = MILESTONES.find((m) => m.at > learningPct);
  const ptsToNext = nextMilestone ? nextMilestone.at - learningPct : 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-900 dark:text-white">Learning Progress</h2>
        <span className="text-xs text-gray-400">{completedCount}/{totalStages} stages</span>
      </div>

      {/* Donut + motivation */}
      <div className="flex items-center gap-5 mb-5">
        <DonutChart pct={learningPct} size={110} />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm leading-snug mb-1 ${motivation.color}`}>
            {motivation.headline}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            {motivation.sub}
          </p>
          {/* Sub-topic stat */}
          <div className="text-xs text-gray-400">
            {completedSubTopics} / {totalSubTopics} sub-topics done
          </div>
          {/* Next milestone */}
          {nextMilestone && (
            <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              {ptsToNext}% to go → {nextMilestone.label}
            </div>
          )}
        </div>
      </div>

      {/* Milestone track */}
      <div className="flex items-center gap-1 mb-5">
        {MILESTONES.map((m) => {
          const done = learningPct >= m.at;
          return (
            <div key={m.at} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-1.5 rounded-full transition-all duration-700 ${done ? "bg-blue-500" : "bg-gray-100 dark:bg-gray-800"}`} />
              <span className={`text-[10px] font-medium ${done ? "text-blue-600 dark:text-blue-400" : "text-gray-300 dark:text-gray-600"}`}>
                {m.at}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Stage list — current + next 4 */}
      <div className="space-y-1.5 mb-5">
        {stages.slice(0, 5).map((stage) => {
          const status = progressMap[stage.id] ?? "not_started";
          const isActive = status === "in_progress";
          const isDone = status === "completed" || status === "skipped";
          return (
            <div key={stage.id} className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${isActive ? "bg-blue-50 dark:bg-blue-950/40" : ""}`}>
              <span className="text-base flex-shrink-0">
                {isDone ? "✅" : isActive ? "▶" : "○"}
              </span>
              <span className={
                isDone ? "text-gray-400 dark:text-gray-600 line-through text-xs" :
                isActive ? "text-blue-700 dark:text-blue-300 font-semibold" :
                "text-gray-500 dark:text-gray-500 text-xs"
              }>
                {isDone ? stage.name : `Stage ${stage.orderIndex}: ${stage.name}`}
              </span>
              {isActive && <span className="ml-auto text-xs text-blue-500 font-medium">Now</span>}
            </div>
          );
        })}
        {totalStages > 5 && (
          <p className="text-xs text-gray-400 pl-2.5">+{totalStages - 5} more stages</p>
        )}
      </div>

      {/* CTA */}
      <Link
        href="/dashboard/learning"
        className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
      >
        {learningPct === 100 ? "Review Your Path" : currentStageName ? `Continue: ${currentStageName}` : "Start Learning"}
        <span>→</span>
      </Link>
    </div>
  );
}
