"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PM_ROLES = [
  { value: "consumer", label: "Consumer PM", desc: "Mobile/web apps, B2C products, user experience" },
  { value: "growth", label: "Growth PM", desc: "Acquisition, retention, monetization, experimentation" },
  { value: "technical", label: "Technical PM", desc: "APIs, infrastructure, developer tools, platform products" },
  { value: "platform", label: "Platform PM", desc: "Internal platforms, shared systems, developer experience" },
  { value: "ai", label: "AI PM", desc: "ML/AI products, model-based features, AI infrastructure" },
  { value: "general", label: "General PM", desc: "Not sure yet — want balanced coverage" },
] as const;

const PREP_STAGES = [
  { value: "exploring", label: "Just started exploring" },
  { value: "studying", label: "Been reading/studying for a while" },
  { value: "preparing", label: "Actively preparing for interviews" },
  { value: "applying", label: "Already applying / getting rejections" },
] as const;

const INDUSTRIES = [
  "Technology", "Finance / Fintech", "Healthcare", "E-commerce / Retail",
  "Education / Edtech", "Insurance", "Consulting", "Gaming", "Media / Content",
  "Logistics / Supply Chain", "Real Estate / Proptech", "Other",
];

const EXP_OPTIONS = [
  { value: "0-1", label: "Less than 1 year" },
  { value: "1-2", label: "1–2 years" },
  { value: "2-3", label: "2–3 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "5+", label: "5+ years" },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showJDs, setShowJDs] = useState(false);

  const [form, setForm] = useState({
    currentRole: "",
    company: "",
    yearsOfExperience: "" as string,
    industry: "",
    targetPmRole: "" as string,
    preparationStage: "" as string,
    jobDescriptions: ["", "", ""],
  });

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.currentRole || !form.yearsOfExperience || !form.industry || !form.targetPmRole || !form.preparationStage) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentRole: form.currentRole,
          company: form.company || undefined,
          yearsOfExperience: form.yearsOfExperience,
          industry: form.industry,
          targetPmRole: form.targetPmRole,
          preparationStage: form.preparationStage,
          jobDescriptions: form.jobDescriptions.filter((jd) => jd.trim()),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      // Trigger analysis pipeline, then navigate to processing
      await fetch("/api/onboarding/analyze", { method: "POST" });
      router.push("/onboarding/processing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="w-full h-1 bg-gray-200 dark:bg-gray-800">
        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: "33%" }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <span className="text-xs font-mono text-blue-600 uppercase tracking-wider">Step 2 of 6</span>
            <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
              Tell us about yourself
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
              This helps us personalize your analysis and learning path.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Current role */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current role / title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.currentRole}
                  onChange={(e) => set("currentRole", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Software Engineer, QA Lead..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => set("company", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            {/* Years + Industry */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Years of experience <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.yearsOfExperience}
                  onChange={(e) => set("yearsOfExperience", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  {EXP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Industry / domain <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.industry}
                  onChange={(e) => set("industry", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target PM Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target PM role <span className="text-red-500">*</span>
              </label>
              <div className="grid sm:grid-cols-2 gap-2">
                {PM_ROLES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => set("targetPmRole", role.value)}
                    className={`text-left px-3 py-3 rounded-xl border transition-all ${
                      form.targetPmRole === role.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className={`font-medium text-sm ${form.targetPmRole === role.value ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-white"}`}>
                      {role.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{role.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Prep stage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Where are you in your prep? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {PREP_STAGES.map((stage) => (
                  <button
                    key={stage.value}
                    type="button"
                    onClick={() => set("preparationStage", stage.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                      form.preparationStage === stage.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional JDs */}
            <div>
              <button
                type="button"
                onClick={() => setShowJDs(!showJDs)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                {showJDs ? "▼" : "▶"} Add target job descriptions (optional — improves analysis)
              </button>

              {showJDs && (
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Paste up to 3 JDs you&apos;re targeting. We&apos;ll calibrate your gaps against them.
                  </p>
                  {form.jobDescriptions.map((jd, i) => (
                    <textarea
                      key={i}
                      value={jd}
                      onChange={(e) => {
                        const updated = [...form.jobDescriptions];
                        updated[i] = e.target.value;
                        setForm((f) => ({ ...f, jobDescriptions: updated }));
                      }}
                      rows={4}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder={`Job description ${i + 1}...`}
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors touch-target disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "Starting analysis..." : "Analyze my experience →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
