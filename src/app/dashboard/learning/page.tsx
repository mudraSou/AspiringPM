"use client";

import { useState, useEffect, useCallback } from "react";

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
  generatedContent: string | null;
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
  isAutoSkipped: boolean;
  canAttemptGate: boolean;
}

interface QCOption {
  id: "A" | "B" | "C" | "D";
  text: string;
}

interface QCQuestionPublic {
  id: string;
  question: string;
  options: QCOption[];
}

interface QCResult {
  questionId: string;
  correct: boolean;
  correctOptionId: string;
  explanation: string;
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

// ─── Inline learning module renderer ────────────────────────────────────────
function LearningModule({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);

  // Parse markdown into sections: ## Heading + body
  const sections = content.split(/\n(?=## )/).filter(Boolean).map((block) => {
    const lines = block.trim().split("\n");
    const heading = lines[0].replace(/^##\s*/, "");
    const body = lines.slice(1).join("\n").trim();
    return { heading, body };
  });

  if (!sections.length) return null;

  return (
    <div className="border border-blue-100 dark:border-blue-900 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-950/40 text-left"
      >
        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">📖 Learning Module</span>
        <span className="text-blue-500 text-xs">{expanded ? "▲ Collapse" : "▼ Read"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 divide-y divide-gray-100 dark:divide-gray-800">
          {sections.map((sec, i) => (
            <div key={i} className="pt-4 pb-2">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{sec.heading}</h5>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5">
                {sec.body.split("\n").map((line, j) => {
                  if (!line.trim()) return null;
                  // Bullet point
                  if (line.startsWith("- ") || line.startsWith("* ")) {
                    const text = line.replace(/^[-*]\s*/, "");
                    // Bold term: **Term** — rest
                    const boldMatch = text.match(/^\*\*(.+?)\*\*\s*[—–-]\s*(.+)/);
                    return (
                      <div key={j} className="flex gap-2">
                        <span className="text-blue-400 flex-shrink-0 mt-0.5">•</span>
                        <span>
                          {boldMatch ? (
                            <><strong className="text-gray-900 dark:text-white">{boldMatch[1]}</strong>{" — "}{boldMatch[2]}</>
                          ) : text}
                        </span>
                      </div>
                    );
                  }
                  return <p key={j}>{line}</p>;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [loadingQC, setLoadingQC] = useState(false);
  const [submittingQC, setSubmittingQC] = useState(false);
  const [qcQuestions, setQcQuestions] = useState<QCQuestionPublic[] | null>(null);
  const [qcAnswers, setQcAnswers] = useState<Record<string, string>>({});
  const [qcResults, setQcResults] = useState<QCResult[] | null>(null);
  // Pre-populate summary from DB so failed state persists on page reload
  const [qcSummary, setQcSummary] = useState<{ score: number; feedback: string; passed: boolean } | null>(
    progress.quickCheckScore !== null && progress.quickCheckFeedback
      ? { score: progress.quickCheckScore, feedback: progress.quickCheckFeedback, passed: progress.quickCheckScore >= QC_PASSING_SCORE }
      : null
  );

  const resourcesDone = progress.resourcesCompleted ?? [];
  const allResourcesDone = subTopic.resources.every((_, i) => resourcesDone.includes(String(i)));

  async function toggleResource(index: number) {
    if (resourcesDone.includes(String(index))) return;
    try {
      const res = await fetch("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete_resource", stageId, subTopicId: subTopic.id, resourceIndex: index }),
      });
      if (res.ok) onProgressUpdate();
    } catch {
      // network error — silently ignore, user can retry
    }
  }

  async function loadQuickCheck() {
    setLoadingQC(true);
    setQcQuestions(null);
    setQcAnswers({});
    setQcResults(null);
    try {
      const res = await fetch("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_quickcheck", stageId, subTopicId: subTopic.id }),
      });
      const text = await res.text();
      if (!text) throw new Error("Server returned an empty response. Please try again.");
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);
      if (data.questions) setQcQuestions(data.questions);
    } catch (err) {
      setQcSummary({ score: 0, feedback: err instanceof Error ? err.message : "Failed to load questions. Please try again.", passed: false });
    } finally {
      setLoadingQC(false);
    }
  }

  async function submitQuickCheck() {
    if (!qcQuestions || Object.keys(qcAnswers).length < qcQuestions.length) return;
    setSubmittingQC(true);
    try {
      const res = await fetch("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit_quickcheck", stageId, subTopicId: subTopic.id, answers: qcAnswers }),
      });
      const text = await res.text();
      if (!text) throw new Error("Server returned an empty response. Please try again.");
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);
      setQcSummary({ score: data.score, feedback: data.feedback, passed: data.passed });
      setQcResults(data.results);
      if (data.passed) onProgressUpdate();
    } catch (err) {
      setQcSummary({ score: 0, feedback: err instanceof Error ? err.message : "Submission failed. Please try again.", passed: false });
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

      {/* Inline learning module — shown when AI content is available */}
      {subTopic.generatedContent && !isDone && (
        <div className="mb-4">
          <LearningModule content={subTopic.generatedContent} />
        </div>
      )}

      {/* Resources — shown always (as references), or as primary if no generated content */}
      <div className="space-y-2 mb-3">
        {!subTopic.generatedContent && subTopic.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{subTopic.description}</p>
        )}
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
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Check · MCQ</p>

          {/* Summary banner (from DB or just-submitted) */}
          {qcSummary && !qcSummary.passed && !qcQuestions && (
            <div className="p-3 rounded-lg text-sm bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 mb-3">
              ✗ {qcSummary.feedback} — try again.
            </div>
          )}

          {/* No questions loaded yet */}
          {!qcQuestions && (
            <button
              onClick={loadQuickCheck}
              disabled={loadingQC}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loadingQC ? "Generating questions..." : qcSummary ? "Try Again (New Questions)" : "Start Quick Check"}
            </button>
          )}

          {/* Questions */}
          {qcQuestions && !qcResults && (
            <div className="space-y-4">
              {qcQuestions.map((q, qi) => (
                <div key={q.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="space-y-1.5">
                    {q.options.map((opt) => {
                      const selected = qcAnswers[q.id] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setQcAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                          className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                            selected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                              : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full border text-xs flex items-center justify-center flex-shrink-0 font-semibold ${
                            selected ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300 dark:border-gray-600 text-gray-500"
                          }`}>{opt.id}</span>
                          {opt.text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <button
                onClick={submitQuickCheck}
                disabled={submittingQC || Object.keys(qcAnswers).length < qcQuestions.length}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submittingQC ? "Checking..." : "Submit Answers"}
              </button>
            </div>
          )}

          {/* Results */}
          {qcResults && qcSummary && (
            <div className="space-y-3">
              <div className={`p-3 rounded-lg text-sm ${qcSummary.passed ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300"}`}>
                {qcSummary.passed ? "✓" : "✗"} {qcSummary.feedback}
              </div>
              {qcResults.map((r, qi) => (
                <div key={r.questionId} className={`rounded-lg p-3 border text-sm ${r.correct ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20" : "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"}`}>
                  <div className="flex items-center gap-1.5 font-medium mb-1">
                    <span>{r.correct ? "✓" : "✗"}</span>
                    <span className="text-gray-700 dark:text-gray-300">Q{qi + 1} — Your answer: {qcAnswers[r.questionId]} · Correct: {r.correctOptionId}</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">{r.explanation}</p>
                </div>
              ))}
              {!qcSummary.passed && (
                <button
                  onClick={loadQuickCheck}
                  disabled={loadingQC}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loadingQC ? "Generating..." : "Try Again (New Questions)"}
                </button>
              )}
            </div>
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
      const text = await res.text();
      if (!text) throw new Error("Server returned an empty response. Please try again.");
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);
      setResult(data);
      if (data.passed) setTimeout(onComplete, 1500);
    } catch (err) {
      setResult({
        score: 0, passed: false,
        overallFeedback: err instanceof Error ? err.message : "Submission failed. Please try again.",
        strengths: [], improvements: [], criteriaResults: [],
      });
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
  const isCompleted = status === "completed" || status === "skipped";
  const isAutoSkipped = stage.isAutoSkipped;
  const isInProgress = status === "in_progress";
  const locked = !stage.isUnlocked;

  const doneCount = stage.subTopics.filter((st) => {
    const p = stage.subTopicProgress[st.id];
    return p?.status === "completed" && (!st.quickCheckPrompt || (p.quickCheckScore !== null && p.quickCheckScore >= 50));
  }).length;
  const totalSubs = stage.subTopics.length;
  const subPct = totalSubs > 0 ? Math.round((doneCount / totalSubs) * 100) : 0;

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
                isAutoSkipped ? "text-purple-600 dark:text-purple-400" :
                isCompleted ? "text-green-600 dark:text-green-400" :
                isInProgress ? "text-blue-600 dark:text-blue-400" :
                locked ? "text-gray-400" : "text-gray-500"
              }`}>
                {isAutoSkipped ? "⚡ AUTO-SKIPPED" : isCompleted ? "COMPLETED" : isInProgress ? "IN PROGRESS" : locked ? "🔒 LOCKED" : "NOT STARTED"}
              </span>
              {(stage.estimatedHoursMin || stage.estimatedHoursMax) && (
                <span className="text-xs text-gray-400">
                  {stage.estimatedHoursMin}–{stage.estimatedHoursMax}h
                </span>
              )}
              {totalSubs > 0 && (
                <span className="text-xs text-gray-400">{doneCount}/{totalSubs} done</span>
              )}
            </div>
            {/* Mini progress bar */}
            {totalSubs > 0 && (
              <div className="mt-2 h-1 w-40 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-green-500" : "bg-blue-500"}`}
                  style={{ width: `${subPct}%` }}
                />
              </div>
            )}
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
              {stage.subTopics.map((st) => {
                const prog = stage.subTopicProgress[st.id] ?? { status: "not_started", resourcesCompleted: [], quickCheckScore: null, quickCheckFeedback: null };
                return (
                  <SubTopicPanel
                    key={st.id}
                    stageId={stage.id}
                    subTopic={st}
                    progress={prog}
                    isLocked={false}
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
    try {
    const res = await fetch("/api/learning/path");
    if (!res.ok) return;
    const text = await res.text();
    if (!text) return;
    const data = JSON.parse(text);
    setStages(data.stages ?? []);
    setOverallScore(data.overallScore ?? 0);
    } catch {
      // network error — page stays in current state
    }
  }, [openStageId]);

  useEffect(() => {
    fetchPath().finally(() => setLoading(false));
  }, [fetchPath]);

  const completedCount = stages.filter((s) => s.progress.status === "completed" || s.progress.status === "skipped").length;

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
