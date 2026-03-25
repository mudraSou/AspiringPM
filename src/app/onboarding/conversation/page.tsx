"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface MCQOption { id: string; text: string; }
interface MCQQuestion { id: string; skillId: string; skillName: string; question: string; options: MCQOption[]; }

export default function AssessmentPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ score: number; correctCount: number; total: number } | null>(null);

  useEffect(() => {
    fetch("/api/onboarding/conversation")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setQuestions(data.questions ?? []);
        setAnswers(data.answers ?? {});
        if (data.completed && data.score !== undefined) {
          setResult({ score: data.score, correctCount: 0, total: data.questions?.length ?? 8 });
        }
      })
      .catch(() => setError("Failed to load assessment. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  function selectAnswer(qId: string, oId: string) {
    setAnswers((prev) => ({ ...prev, [qId]: oId }));
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Submission failed."); return; }
      setResult({ score: data.score, correctCount: data.correctCount, total: data.total });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const current = questions[currentIndex];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Generating your skill assessment...</p>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">This takes about 10 seconds</p>
      </div>
    </div>
  );

  if (error && !questions.length) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium">Retry</button>
      </div>
    </div>
  );

  if (result) {
    const pct = result.score;
    const color = pct >= 70 ? "text-green-600" : pct >= 50 ? "text-yellow-500" : "text-red-500";
    const label = pct >= 70 ? "Strong" : pct >= 50 ? "Developing" : "Needs Work";
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <div className="w-full h-1 bg-blue-600" />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 mb-6">
              <div className={`text-6xl font-bold mb-1 ${color}`}>{pct}%</div>
              <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">{label} PM Knowledge</div>
              {result.correctCount > 0 && <p className="text-sm text-gray-600 dark:text-gray-400">{result.correctCount} of {result.total} correct</p>}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {pct >= 70 ? "Great foundation! Your learning path is ready." : "Good effort. Your results personalise your learning path."}
            </p>
            <button onClick={() => router.push("/onboarding/analysis")} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm">
              See your full analysis →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="w-full h-1 bg-gray-200 dark:bg-gray-800">
        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-blue-600 uppercase tracking-wider">Step 5 of 6</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">Skill Assessment</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">{currentIndex + 1} / {questions.length}</p>
            <div className="flex gap-1 mt-1 justify-end">
              {questions.map((q, i) => (
                <button key={q.id} onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? "bg-blue-600" : answers[q.id] ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-medium px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {current.skillName}
            </span>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-4">
            <p className="text-gray-900 dark:text-white text-base leading-relaxed font-medium">{current.question}</p>
          </div>

          <div className="space-y-3 mb-8">
            {current.options.map((opt) => {
              const selected = answers[current.id] === opt.id;
              return (
                <button key={opt.id} onClick={() => selectAnswer(current.id, opt.id)}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-start gap-3 ${selected ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5 ${selected ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"}`}>
                    {opt.id}
                  </span>
                  <span className={`text-sm leading-relaxed ${selected ? "text-blue-900 dark:text-blue-100 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>

          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setCurrentIndex((i) => i - 1)} disabled={currentIndex === 0}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              ← Back
            </button>
            <span className="text-xs text-gray-400 dark:text-gray-600">{answeredCount}/{questions.length} answered</span>
            {currentIndex < questions.length - 1 ? (
              <button onClick={() => setCurrentIndex((i) => i + 1)} disabled={!answers[current.id]}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next →
              </button>
            ) : (
              <button onClick={submit} disabled={!allAnswered || submitting}
                className="px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {submitting ? "Submitting..." : "Submit Assessment"}
              </button>
            )}
          </div>

          {currentIndex === questions.length - 1 && !allAnswered && (
            <p className="text-center text-xs text-amber-600 dark:text-amber-400 mt-3">
              {questions.length - answeredCount} question{questions.length - answeredCount !== 1 ? "s" : ""} unanswered — go back to complete them
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
