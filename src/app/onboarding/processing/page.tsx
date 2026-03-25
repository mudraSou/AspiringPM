"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  { key: "reading_resume", label: "Reading your resume...", icon: "📄" },
  { key: "extracting_experiences", label: "Extracting your work experiences...", icon: "🔍" },
  { key: "reframing_experiences", label: "Reframing your experience in PM language...", icon: "✨" },
  { key: "mapping_skills", label: "Mapping your skills to PM competencies...", icon: "🗺️" },
  { key: "identifying_gaps", label: "Identifying skill gaps for your target role...", icon: "📊" },
  { key: "finalizing", label: "Almost there — preparing your personalized analysis...", icon: "🚀" },
] as const;

interface PipelineStatus {
  step: string;
  progress: number;
  message: string;
  error?: string;
  result?: {
    experienceCount: number;
    skillCount: number;
    initialScore: number;
  };
}

export default function ProcessingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<PipelineStatus>({
    step: "reading_resume",
    progress: 5,
    message: "Starting analysis...",
  });
  const [notifGranted, setNotifGranted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        setNotifGranted(perm === "granted");
      });
    } else if ("Notification" in window && Notification.permission === "granted") {
      setNotifGranted(true);
    }
  }, []);

  // Poll every 2 seconds
  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/onboarding/status");
        if (!res.ok) return;
        const data: PipelineStatus = await res.json();
        setStatus(data);

        if (data.step === "complete") {
          // Send browser notification if user switched tabs
          if (notifGranted && document.hidden) {
            new Notification("PM Platform", {
              body: "Your analysis is ready! Click to view your results.",
              icon: "/favicon.ico",
            });
          }

          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimeout(() => router.push("/onboarding/summary"), 1000);
        }

        if (data.step === "error") {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // Network error — keep polling
      }
    }

    poll(); // immediate first poll
    intervalRef.current = setInterval(poll, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [notifGranted, router]);

  const currentStepIndex = STEPS.findIndex((s) => s.key === status.step);
  const isError = status.step === "error";
  const isComplete = status.step === "complete" || status.step === "finalizing";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="w-full h-1 bg-gray-200 dark:bg-gray-800">
        <div
          className="h-full bg-blue-600 transition-all duration-1000"
          style={{ width: `${Math.max(status.progress, 33)}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg text-center">
          <span className="text-xs font-mono text-blue-600 uppercase tracking-wider">Step 3 of 6</span>

          <div className="mt-8 mb-10">
            {isError ? (
              <>
                <div className="w-16 h-16 bg-red-100 dark:bg-red-950 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                  ⚠️
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Analysis failed
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                  {status.error ?? "Something went wrong. Please try again."}
                </p>
                <button
                  onClick={() => router.push("/onboarding/upload")}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
                >
                  Start over
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {isComplete ? (
                    <span className="text-3xl">✅</span>
                  ) : (
                    <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {isComplete ? "Analysis complete!" : "Analyzing your experience..."}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {isComplete
                    ? "Taking you to your results..."
                    : "This usually takes 20–40 seconds. Feel free to switch tabs — we'll notify you when it's done."}
                </p>
              </>
            )}
          </div>

          {/* Step list */}
          {!isError && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-left space-y-3">
              {STEPS.map((step, i) => {
                const isDone = i < currentStepIndex || isComplete;
                const isCurrent = step.key === status.step && !isComplete;

                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs
                      ${isDone
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                      }`}
                    >
                      {isDone ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isCurrent ? (
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      ) : (
                        <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
                      )}
                    </div>
                    <span className={`text-sm ${isDone ? "text-gray-500 line-through" : isCurrent ? "text-gray-900 dark:text-white font-medium" : "text-gray-400"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {!notifGranted && !isError && (
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-600">
              Enable notifications to be alerted when analysis is complete.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
