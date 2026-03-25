"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Question {
  id: string;
  category: string;
  subCategory: string | null;
  questionText: string;
  difficulty: number;
  relatedSkills: string[];
  lastAttempt: { score: number | null; createdAt: string } | null;
}

interface EvalResult {
  score: number;
  overallFeedback: string;
  criteriaResults: Array<{ criterion: string; met: boolean; comment: string }>;
  strengths: string[];
  improvements: string[];
  modelAnswerHints: string[];
}

const CATEGORIES = [
  { value: "all", label: "All Topics" },
  { value: "product_sense", label: "Product Sense" },
  { value: "analytical", label: "Analytical" },
  { value: "strategy", label: "Strategy" },
  { value: "behavioral", label: "Behavioral" },
  { value: "technical", label: "Technical" },
  { value: "estimation", label: "Estimation" },
  { value: "execution", label: "Execution" },
];

const DIFFICULTY_STARS = (d: number) => "⭐".repeat(d) + "☆".repeat(3 - d);

function PracticePanel({
  question,
  onClose,
}: {
  question: Question;
  onClose: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState("");

  async function submit() {
    if (!answer.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/questions/${question.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try { data = text ? JSON.parse(text) : {}; } catch { /* ignore */ }
      if (!res.ok) { setError((data.error as string) ?? "Evaluation failed"); return; }
      setResult(data as unknown as EvalResult);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-xl my-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
          <div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryColor(question.category)}`}>
              {question.category.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-gray-400 ml-2">{DIFFICULTY_STARS(question.difficulty)}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none flex-shrink-0">×</button>
        </div>

        <div className="px-6 py-5">
          {/* Question */}
          <p className="text-base font-semibold text-gray-900 dark:text-white mb-4 leading-snug">
            {question.questionText}
          </p>

          {/* Hints */}
          {!result && (
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5">Before you answer, consider:</p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5 list-disc list-inside">
                <li>Who are the users? What problem are they trying to solve?</li>
                <li>What metrics would define success?</li>
                <li>What are the tradeoffs of your approach?</li>
                <li>How would you validate your solution?</li>
              </ul>
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              {/* Score */}
              <div className={`p-4 rounded-xl border ${result.score >= 70 ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800" : result.score >= 50 ? "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800" : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800"}`}>
                <div className="text-2xl font-bold mb-1">{result.score}/100</div>
                <p className={`text-sm ${result.score >= 70 ? "text-green-700 dark:text-green-300" : result.score >= 50 ? "text-yellow-700 dark:text-yellow-300" : "text-red-700 dark:text-red-300"}`}>
                  {result.overallFeedback}
                </p>
              </div>

              {/* Criteria */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Criteria</p>
                <div className="space-y-1.5">
                  {(Array.isArray(result.criteriaResults) ? result.criteriaResults : []).map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className={`flex-shrink-0 ${c.met ? "text-green-500" : "text-red-400"}`}>{c.met ? "✓" : "✗"}</span>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{c.criterion}</span>
                        <span className="text-gray-400"> — {c.comment}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths + improvements */}
              <div className="grid sm:grid-cols-2 gap-4">
                {result.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Strengths</p>
                    <ul className="space-y-1">
                      {result.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex gap-1.5"><span className="text-green-500">✓</span>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.improvements.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Improve</p>
                    <ul className="space-y-1">
                      {result.improvements.map((s, i) => (
                        <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex gap-1.5"><span className="text-amber-500">→</span>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Key points missed */}
              {result.modelAnswerHints.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Key points to cover next time</p>
                  <ul className="space-y-1">
                    {result.modelAnswerHints.map((h, i) => (
                      <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex gap-1.5"><span className="text-blue-400">•</span>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => { setResult(null); setAnswer(""); }}
                className="w-full py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={8}
                placeholder="Write your answer here..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">
                  {answer.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  onClick={submit}
                  disabled={submitting || !answer.trim()}
                  className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Evaluating..." : "Submit for AI Evaluation"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getCategoryColor(cat: string) {
  const map: Record<string, string> = {
    product_sense: "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300",
    analytical: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300",
    strategy: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300",
    behavioral: "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300",
    technical: "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300",
    estimation: "bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300",
    execution: "bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300",
  };
  return map[cat] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [practicing, setPracticing] = useState<Question | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    fetch(`/api/questions?${params}`)
      .then((r) => r.json())
      .then((d) => { setQuestions(d.questions ?? []); })
      .finally(() => setLoading(false));
  }, [category]);

  const attempted = questions.filter((q) => q.lastAttempt !== null).length;

  return (
    <>
      {practicing && (
        <PracticePanel question={practicing} onClose={() => setPracticing(null)} />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PM Interview Question Bank</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Practice with AI evaluation. {attempted}/{questions.length} attempted.
            </p>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === c.value
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>No questions found for this filter.</p>
            <p className="text-sm mt-1">Make sure the database has been seeded.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <div
                key={q.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryColor(q.category)}`}>
                        {q.category.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-gray-400">{DIFFICULTY_STARS(q.difficulty)}</span>
                      {q.subCategory && (
                        <span className="text-xs text-gray-400">· {q.subCategory}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">{q.questionText}</p>
                    {q.lastAttempt !== null && (
                      <p className="text-xs text-gray-400 mt-2">
                        Last attempt: <span className={`font-medium ${(q.lastAttempt.score ?? 0) >= 70 ? "text-green-600" : (q.lastAttempt.score ?? 0) >= 50 ? "text-yellow-500" : "text-red-500"}`}>
                          {q.lastAttempt.score ?? "—"}/100
                        </span>
                        {" · "}
                        {new Date(q.lastAttempt.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    )}
                    {q.lastAttempt === null && (
                      <p className="text-xs text-gray-400 mt-2">Not attempted</p>
                    )}
                  </div>
                  <button
                    onClick={() => setPracticing(q)}
                    className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    Practice →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
