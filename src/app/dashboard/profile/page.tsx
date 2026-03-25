"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ProfileSettings {
  user: {
    name: string | null;
    email: string;
    currentRole: string | null;
    company: string | null;
    targetPmRole: string | null;
    publicProfileSlug: string | null;
    profileVisibility: { skills: boolean; experiences: boolean; assignments: boolean; activity: boolean };
  };
  highlightedIds: string[];
}

interface PSIEntry {
  id: string;
  problemStatement: string | null;
  resumePoint: string | null;
  priority: string;
  highlighted: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  consumer: "Consumer PM", growth: "Growth PM", technical: "Technical PM",
  platform: "Platform PM", ai: "AI PM", general: "General PM",
};

export default function ProfileEditPage() {
  const [settings, setSettings] = useState<ProfileSettings | null>(null);
  const [entries, setEntries] = useState<PSIEntry[]>([]);
  const [slug, setSlug] = useState("");
  const [visibility, setVisibility] = useState({ skills: true, experiences: true, assignments: true, activity: true });
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/profile/settings").then((r) => r.json()),
      fetch("/api/profile/entries").then((r) => r.json()),
    ]).then(([settingsData, entriesData]) => {
      setSettings(settingsData);
      setSlug(settingsData.user?.publicProfileSlug ?? "");
      setVisibility(settingsData.user?.profileVisibility ?? { skills: true, experiences: true, assignments: true, activity: true });
      setHighlightedIds(settingsData.highlightedIds ?? []);
      setEntries(entriesData.entries ?? []);
    }).finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/profile/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slug.trim() || undefined, visibility, highlightedIds }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Save failed"); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  function toggleHighlight(id: string) {
    setHighlightedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev; // max 5
      return [...prev, id];
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const publicUrl = slug ? `/profile/${slug}` : null;

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Public Profile</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Control what others see on your shareable profile.
            </p>
          </div>
          {publicUrl && (
            <Link
              href={publicUrl}
              target="_blank"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
            >
              Preview →
            </Link>
          )}
        </div>

        <div className="space-y-5">
          {/* Identity card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Identity</h2>
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-xl font-bold text-blue-600 flex-shrink-0">
                {settings?.user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{settings?.user.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {settings?.user.currentRole ?? "Professional"}{settings?.user.company ? ` at ${settings.user.company}` : ""}
                </p>
                <p className="text-xs text-gray-400">
                  Targeting: {ROLE_LABELS[settings?.user.targetPmRole ?? ""] ?? "PM"}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Edit name, role, and company in your{" "}
              <Link href="/onboarding/profile" className="text-blue-600 dark:text-blue-400 hover:underline">
                profile settings
              </Link>
              .
            </p>
          </div>

          {/* Public URL */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Public URL</h2>
            <p className="text-xs text-gray-400 mb-3">Your shareable profile link. Use letters, numbers, and hyphens.</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 flex-shrink-0">/profile/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="your-name"
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {slug && (
              <p className="text-xs text-gray-400 mt-2">
                Profile will be at: <span className="text-blue-600 dark:text-blue-400">/profile/{slug}</span>
              </p>
            )}
          </div>

          {/* Visibility toggles */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Visibility</h2>
            <div className="space-y-3">
              {([
                { key: "skills", label: "Skills breakdown", desc: "Your readiness score and category scores" },
                { key: "experiences", label: "Highlighted experiences", desc: "Your selected PSI entries" },
                { key: "assignments", label: "Completed assignments", desc: "Stage gate scores and completions" },
                { key: "activity", label: "Activity heatmap", desc: "Your learning streak and activity data" },
              ] as const).map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setVisibility((v) => ({ ...v, [item.key]: !v[item.key] }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${visibility[item.key] ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${visibility[item.key] ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Highlight PSI entries */}
          {entries.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Highlighted Experiences</h2>
                <span className="text-xs text-gray-400">{highlightedIds.length}/5 selected</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">Pick up to 5 experiences to feature on your public profile.</p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {entries.map((e) => {
                  const isHighlighted = highlightedIds.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={() => toggleHighlight(e.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${
                        isHighlighted
                          ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30"
                          : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 flex-shrink-0 ${isHighlighted ? "text-blue-600" : "text-gray-300 dark:text-gray-600"}`}>
                          {isHighlighted ? "●" : "○"}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {e.resumePoint ?? e.problemStatement ?? "Untitled entry"}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 capitalize">{e.priority} priority</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save */}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save Profile Settings"}
            </button>
            {publicUrl && (
              <Link
                href={publicUrl}
                target="_blank"
                className="px-5 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                View Public Profile →
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
