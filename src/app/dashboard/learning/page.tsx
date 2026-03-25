"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Resource {
  title: string;
  url?: string;
  type: "article" | "video" | "book" | "tool";
  estimatedMinutes?: number;
}

interface SubTopic {
  id: string;
  name: string;
  description: string | null;
  orderIndex: number;
  resources: Resource[];
  quickCheckPrompt: string | null;
  optionalIfSkilled: boolean;
}

interface SubTopicProgress {
  status: string;
  resourcesCompleted: string[];
  quickCheckScore: number | null;
  quickCheckFeedback: string | null;
}

interface StageData {
  id: string;
  name: string;
  description: string | null;
  orderIndex: number;
  estimatedHoursMin: number | null;
  estimatedHoursMax: number | null;
  gateAssignmentPrompt: string | null;
  gateAssignmentRubric: { criteria: Array<{ name: string; weight: number; description: string }> } | null;
  gatePassingScore: number;
  skipIfScoreAbove: number;
  subTopics: SubTopic[];
  progress: {
    status: string;
    gateScore: number | null;
    gateFeedback: string | null;
    gateSubmittedAt: string | null;
  };
  subTopicProgress: Record<string, SubTopicProgress>;
  isUnlocked: boolean;
  canAttemptGate: boolean;
}

interface GateResult {
  score: number;
  passed: boolean;
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  criteriaResults: Array<{ criterion: string; score: number; maxScore: number; met: boolean; feedback: string }>;
}

const TYPE_ICON: Record<string, string> = {
  article: "📖",
  video: "🎥",
  book: "📚",
  tool: "🛠️",
};

// ─── Sub-topic panel ────────────────────────────────────────────────────────

const QC_PASSING_SCORE = 50;

function SubTopicPanel({
  stageId,
  subTopic,
  progress,
  isLocked,
  onProgressUpdate,
}: {
  stageId: string;
  subTopic: SubTopic;
  progress: SubTopicProgress;
  isLocked: boolean;
  onProgressUpdate: () => void;
}) {
  const [quickCheckText, setQuickCheckText] = useState("");
  const [submittingQC, setSubmittingQC] = useState(false);
  // Pre-populate result from DB so failed state persists on page reload
  const [qcResult, setQcResult] = useState<{ score: number; feedback: string; passed: boolean } | null>(
    progress.quickCheckScore !== null && progress.quickCheckFeedback
      ? { score: progress.quickCheckScore, feedback: progress.quickCheckFeedback, passed: progress.quickCheckScore >= QC_PASSING_SCORE }
      : null
  );

  const resourcesDone = progress.resourcesCompleted ?? [];
  const allResourcesDone = subTopic.resources.every((_, i) => resourcesDone.includes(String(i)));

  async function toggleResource(index: number) {
    if (resourcesDone.includes(String(index))) return; // no un-marking
    const res = await fetch("/api/learning/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete_resource", stageId, subTopicId: subTopic.id, resourceIndex: index }),
    });
    if (res.ok) onProgressUpdate();
  }

  async function submitQuickCheck() {
    if (!quickCheckText.trim()) return;
    setSubmittingQC(true);
    try {
      const res = await fetch("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit_quickcheck", stageId, subTopicId: subTopic.id, response: quickCheckText }),
      });
      const data = await res.json();
      setQcResult(data);
      if (data.passed) onProgressUpdate();
    } finally {
      setSubmittingQC(false);
    }
  }

  // Done only if completed AND quick check passed (score >= threshold, or no quick check)
  const isDone = progress.status === "completed" &&
    (!subTopic.quickCheckPrompt || (progress.quickCheckScore !== null && progress.quickCheckScore >= QC_PASSING_SCORE));

  if (isLocked) {
    return (
      <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-3 opacity-60">
        <span className="text-gray-400">🔒</span>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{subTopic.name}</p>
          <p className="text-xs text-gray-400">Complete the previous sub-topic to unlock</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-xl p-4 ${isDone ? "border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20" : "border-gray-100 dark:border-gray-800"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span>{isDone ? "✅" : allResourcesDone ? "◉" : "○"}</span>
          <h4 className="font-medium text-gray-900 dark:text-white text-sm">{subTopic.name}</h4>
        </div>
        {subTopic.optionalIfSkilled && (
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">optional</span>
        )}
      </div>

      {/* Resources */}
      <div className="space-y-2 mb-3">
        {subTopic.resources.map((r, i) => {
          const done = resourcesDone.includes(String(i));
          return (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-base">{TYPE_ICON[r.type] ?? "📄"}</span>
              <div className="flex-1 min-w-0">
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline truncate block"
                  >
                    {r.title}
                  </a>
                ) : (
                  <span className="text-gray-700 dark:text-gray-300">{r.title}</span>
                )}
                {r.estimatedMinutes && (
                  <span className="text-xs text-gray-400 ml-1">({r.estimatedMinutes} min)</span>
                )}
              </div>
              <button
                onClick={() => toggleResource(i)}
                disabled={done}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex-shrink-0 ${
                  done
                    ? "border-green-300 dark:border-green-800 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 cursor-default"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {done ? "Done ✓" : "Mark done"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Quick check */}
      {subTopic.quickCheckPrompt && allResourcesDone && !isDone && (
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Check</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{subTopic.quickCheckPrompt}</p>
          {qcResult?.passed ? (
            <div className="p-3 rounded-lg text-sm bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300">
              ✓ {qcResult.feedback}
            </div>
          ) : (
            <>
              {qcResult && (
                <div className="p-3 rounded-lg text-sm bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 mb-3">
                  ✗ {qcResult.feedback}
                </div>
              )}
              <textarea
                value={quickCheckText}
                onChange={(e) => setQuickCheckText(e.target.value)}
                rows={3}
                placeholder="Write your response here..."
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={submitQuickCheck}
                disabled={submittingQC || !quickCheckText.trim()}
                className="mt-2 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submittingQC ? "Checking..." : qcResult ? "Reattempt" : "Submit"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Already completed quick check */}
      {isDone && progress.quickCheckScore !== null && (
        <div className="border-t border-gray-100 dark:border-gray-800 pt-2 mt-2">
          <p className="text-xs text-gray-400">Quick check: {progress.quickCheckScore}/100</p>
        </div>
      )}
    </div>
  );
}

// ─── Gate panel ─────────────────────────────────────────────────────────────

function GatePanel({
  stageId,
  stage,
  onComplete,
}: {
  stageId: string;
  stage: StageData;
  onComplete: () => void;
}) {
  const [submission, setSubmission] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GateResult | null>(() => {
    if (stage.progress.gateFeedback) {
      try {
        return JSON.parse(stage.progress.gateFeedback) as GateResult;
      } catch {
        return null;
      }
    }
    return null;
  });

  const alreadyPassed = stage.progress.status === "completed";
  const prevScore = stage.progress.gateScore;

  async function submitGate() {
    if (!submission.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit_gate", stageId, submission }),
      });
      const data = await res.json();
      setResult(data);
      if (data.passed) {
        setTimeout(onComplete, 1500);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (alreadyPassed) {
    return (
      <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-green-600 font-semibold text-sm">✅ Gate passed — Score: {prevScore}/100</span>
        </div>
        {result?.overallFeedback && (
          <p className="text-sm text-green-700 dark:text-green-300">{result.overallFeedback}</p>
        )}
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">🔒 Stage Gate Assignment</span>
        <span className="text-xs text-gray-400">(Pass ≥ {stage.gatePassingScore}/100 to complete stage)</span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line mb-4">{stage.gateAssignmentPrompt}</p>

      {result?.passed ? (
        <div className="space-y-3">
          <div className="p-4 rounded-xl text-sm bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800">
            <div className="font-semibold mb-1 text-base">✅ Score: {result.score}/100 — Passed!</div>
            <p className="text-green-700 dark:text-green-300">{result.overallFeedback}</p>
          </div>
          {result.strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Strengths</p>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2"><span className="text-green-500">✓</span>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <>
          {result && (
            <div className="space-y-3 mb-4">
              <div className="p-4 rounded-xl text-sm bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                <div className="font-semibold mb-1 text-base">✗ Score: {result.score}/100 — Not yet</div>
                <p className="text-red-700 dark:text-red-300">{result.overallFeedback}</p>
              </div>
              {result.improvements.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Areas to Improve</p>
                  <ul className="space-y-1">
                    {result.improvements.map((s, i) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2"><span className="text-amber-500">→</span>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <textarea
            value={submission}
            onChange={(e) => setSubmission(e.target.value)}
            rows={8}
            placeholder="Write your response here..."
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-400">{submission.trim().split(/\s+/).filter(Boolean).length} words</span>
            <button
              onClick={submitGate}
              disabled={submitting || !submission.trim()}
              className="px-5 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Evaluating..." : result ? "Reattempt" : "Submit for AI Evaluation"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Stage card ──────────────────────────────────────────────────────────────

function StageCard({
  stage,
  isOpen,
  onToggle,
  onProgressUpdate,
}: {
  stage: StageData;
  isOpen: boolean;
  onToggle: () => void;
  onProgressUpdate: () => void;
}) {
  const status = stage.progress.status;
  const isCompleted = status === "completed";
  const isInProgress = status === "in_progress";
  const locked = !stage.isUnlocked;

  return (
    <div className={`border rounded-2xl overflow-hidden transition-colors ${
      isCompleted
        ? "border-green-200 dark:border-green-900"
        : locked
        ? "border-gray-100 dark:border-gray-800 opacity-60"
        : "border-gray-200 dark:border-gray-700"
    }`}>
      {/* Header */}
      <button
        onClick={locked ? undefined : onToggle}
        disabled={locked}
        className={`w-full text-left px-6 py-4 flex items-center justify-between bg-white dark:bg-gray-900 ${locked ? "cursor-not-allowed" : "hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"} transition-colors`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
            isCompleted ? "bg-green-100 dark:bg-green-950 text-green-600" :
            isInProgress ? "bg-blue-100 dark:bg-blue-950 text-blue-600" :
            locked ? "bg-gray-100 dark:bg-gray-800 text-gray-400" :
            "bg-gray-100 dark:bg-gray-800 text-gray-600"
          }`}>
            {isCompleted ? "✓" : stage.orderIndex}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">{stage.name}</span>
              {isCompleted && stage.progress.gateScore !== null && (
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Score: {stage.progress.gateScore}/100
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className={`text-xs font-medium ${
                isCompleted ? "text-green-600 dark:text-green-400" :
                isInProgress ? "text-blue-600 dark:text-blue-400" :
                locked ? "text-gray-400" : "text-gray-500"
              }`}>
                {isCompleted ? "COMPLETED" : isInProgress ? "IN PROGRESS" : locked ? "🔒 LOCKED" : "NOT STARTED"}
              </span>
              {(stage.estimatedHoursMin || stage.estimatedHoursMax) && (
                <span className="text-xs text-gray-400">
                  {stage.estimatedHoursMin}–{stage.estimatedHoursMax}h
                </span>
              )}
              {stage.subTopics.length > 0 && (
                <span className="text-xs text-gray-400">{stage.subTopics.length} sub-topics</span>
              )}
            </div>
          </div>
        </div>
        {!locked && (
          <span className="text-gray-400 text-sm">{isOpen ? "▲" : "▼"}</span>
        )}
      </button>

      {/* Expanded content */}
      {isOpen && !locked && (
        <div className="px-6 pb-6 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
          {stage.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 mb-5">{stage.description}</p>
          )}

          {/* Sub-topics */}
          {stage.subTopics.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sub-topics</h3>
              {stage.subTopics.map((st, idx) => {
                const prog = stage.subTopicProgress[st.id] ?? { status: "not_started", resourcesCompleted: [], quickCheckScore: null, quickCheckFeedback: null };
                const prevProg = idx > 0 ? stage.subTopicProgress[stage.subTopics[idx - 1].id] : null;
                const prevHasQC = idx > 0 ? !!stage.subTopics[idx - 1].quickCheckPrompt : false;
                const prevDone = idx === 0 || (
                  prevProg?.status === "completed" &&
                  (!prevHasQC || (prevProg.quickCheckScore !== null && prevProg.quickCheckScore >= QC_PASSING_SCORE))
                );
                return (
                  <SubTopicPanel
                    key={st.id}
                    stageId={stage.id}
                    subTopic={st}
                    progress={prog}
                    isLocked={!prevDone}
                    onProgressUpdate={onProgressUpdate}
                  />
                );
              })}
            </div>
          )}

          {/* Gate assignment */}
          {stage.gateAssignmentPrompt && (
            <div>
              {!stage.canAttemptGate && stage.subTopics.length > 0 ? (
                <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center text-sm text-gray-400">
                  🔒 Complete all sub-topics to unlock the gate assignment
                </div>
              ) : (
                <GatePanel stageId={stage.id} stage={stage} onComplete={onProgressUpdate} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LearningPage() {
  const [stages, setStages] = useState<StageData[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openStageId, setOpenStageId] = useState<string | null>(null);

  const fetchPath = useCallback(async () => {
    const res = await fetch("/api/learning/path");
    if (!res.ok) return;
    const data = await res.json();
    setStages(data.stages);
    setOverallScore(data.overallScore);

    // Auto-open current in-progress or first unlocked stage
    if (!openStageId) {
      const inProgress = data.stages.find((s: StageData) => s.progress.status === "in_progress");
      const firstUnlocked = data.stages.find((s: StageData) => s.isUnlocked && s.progress.status === "not_started");
      const target = inProgress ?? firstUnlocked;
      if (target) setOpenStageId(target.id);
    }
  }, [openStageId]);

  useEffect(() => {
    fetchPath().finally(() => setLoading(false));
  }, [fetchPath]);

  const completedCount = stages.filter((s) => s.progress.status === "completed").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500">Loading your learning path...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Learning Path</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {completedCount}/{stages.length} stages complete · Readiness: {overallScore}%
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-bold text-blue-600">{completedCount}/{stages.length}</div>
            <div className="text-xs text-gray-400">stages done</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${stages.length > 0 ? (completedCount / stages.length) * 100 : 0}%` }}
          />
        </div>

        {/* Stages */}
        <div className="space-y-3">
          {stages.map((stage) => (
            <StageCard
              key={stage.id}
              stage={stage}
              isOpen={openStageId === stage.id}
              onToggle={() => setOpenStageId(openStageId === stage.id ? null : stage.id)}
              onProgressUpdate={() => {
                fetchPath();
              }}
            />
          ))}
        </div>

        {stages.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">No stages found</p>
            <p className="text-sm">Make sure the database has been seeded.</p>
          </div>
        )}
      </div>
    </>
  );
}
