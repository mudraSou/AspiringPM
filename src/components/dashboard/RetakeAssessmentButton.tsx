"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RetakeAssessmentButton() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReset() {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/reset", { method: "POST" });
      if (res.ok) {
        router.push("/onboarding/upload");
      }
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Reset all progress?</span>
        <button
          onClick={handleReset}
          disabled={loading}
          className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Yes, reset"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2 transition-colors"
    >
      Retake assessment
    </button>
  );
}
