"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface JD {
  id: string;
  title: string | null;
  company: string | null;
  createdAt: string;
}

interface SelectedEntry {
  entryId: string;
  resumePoint: string;
  included: boolean;
  reason: string;
  order: number;
}

interface ResumeContent {
  summary: string;
  selectedEntries: SelectedEntry[];
  skillsSection: string[];
  additionalBullets: string[];
}

interface ATSAnalysis {
  atsScore: number;
  keywordMatchScore: number;
  formattingScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

interface GeneratedResume {
  resumeId: string;
  content: ResumeContent;
  atsAnalysis: ATSAnalysis;
  version: number;
  userProfile: { name: string; email: string; currentRole: string | null };
  jd: { title: string | null; company: string | null };
}

// ─── Add JD modal ─────────────────────────────────────────────────────────────

function AddJDModal({ onClose, onSaved }: { onClose: () => void; onSaved: (jd: JD) => void }) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!description.trim()) { setError("Paste the JD text to continue."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/resume/jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, company, description }),
      });
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try { data = text ? JSON.parse(text) : {}; } catch { /* ignore */ }
      if (!res.ok) { setError((data.error as string) ?? "Failed to save JD"); return; }
      onSaved(data.jd as JD);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Add Job Description</h2>
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Role title (e.g. Product Manager)"
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            placeholder="Paste the full job description here..."
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Extracting keywords..." : "Save JD"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Resume preview ────────────────────────────────────────────────────────────

function ResumePreview({ resume }: { resume: GeneratedResume }) {
  const included = resume.content.selectedEntries
    .filter((e) => e.included)
    .sort((a, b) => a.order - b.order);

  const resumeText = [
    resume.userProfile.name,
    resume.userProfile.email,
    "",
    "PROFESSIONAL SUMMARY",
    resume.content.summary,
    "",
    "EXPERIENCE",
    ...included.map((e) => `• ${e.resumePoint}`),
    ...resume.content.additionalBullets.map((b) => `• ${b}`),
    "",
    "SKILLS",
    resume.content.skillsSection.join(" • "),
  ].join("\n");

  function downloadTxt() {
    const blob = new Blob([resumeText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-${resume.jd.company ?? "pm"}-v${resume.version}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printResume() {
    window.print();
  }

  return (
    <div id="resume-print-area" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 font-mono text-sm leading-relaxed">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white not-italic font-sans">
          {resume.userProfile.name}
        </h1>
        <p className="text-gray-500 text-xs mt-0.5 font-sans">{resume.userProfile.email}</p>
      </div>

      {/* Summary */}
      <div className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 font-sans">Professional Summary</h2>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-sans">{resume.content.summary}</p>
      </div>

      {/* Experience */}
      <div className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 font-sans">Experience Highlights</h2>
        <ul className="space-y-1.5">
          {included.map((e) => (
            <li key={e.entryId} className="text-gray-700 dark:text-gray-300 text-sm font-sans flex gap-2">
              <span className="text-gray-400 flex-shrink-0">•</span>
              <span>{e.resumePoint}</span>
            </li>
          ))}
          {resume.content.additionalBullets.map((b, i) => (
            <li key={`extra-${i}`} className="text-gray-700 dark:text-gray-300 text-sm font-sans flex gap-2">
              <span className="text-gray-400 flex-shrink-0">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Skills */}
      {resume.content.skillsSection.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 font-sans">Skills</h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm font-sans">
            {resume.content.skillsSection.join(" • ")}
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-4 no-print">
        <button
          onClick={downloadTxt}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Download as .txt →
        </button>
        <button
          onClick={printResume}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Save as PDF →
        </button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ResumePage() {
  const [jds, setJds] = useState<JD[]>([]);
  const [selectedJdId, setSelectedJdId] = useState<string>("");
  const [showAddJD, setShowAddJD] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [resume, setResume] = useState<GeneratedResume | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchJDs = useCallback(async () => {
    const res = await fetch("/api/resume/jd");
    if (res.ok) {
      const text = await res.text();
      try {
        const data = text ? JSON.parse(text) : {};
        setJds(data.jds ?? []);
        if (data.jds?.length > 0 && !selectedJdId) setSelectedJdId(data.jds[0].id);
      } catch { /* ignore parse error */ }
    }
  }, [selectedJdId]);

  useEffect(() => {
    fetchJDs().finally(() => setLoading(false));
  }, [fetchJDs]);

  async function generate() {
    if (!selectedJdId) return;
    setGenerating(true);
    setError("");
    setResume(null);
    try {
      const res = await fetch("/api/resume/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdId: selectedJdId }),
      });
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try { data = text ? JSON.parse(text) : {}; } catch { /* ignore */ }
      if (!res.ok) { setError((data.error as string) ?? "Generation failed"); return; }
      setResume(data as unknown as GeneratedResume);
    } finally {
      setGenerating(false);
    }
  }

  async function deleteJD(id: string) {
    await fetch("/api/resume/jd", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchJDs();
    if (selectedJdId === id) setSelectedJdId("");
    setResume(null);
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

  const selectedJD = jds.find((j) => j.id === selectedJdId);

  return (
    <>
      {showAddJD && (
        <AddJDModal
          onClose={() => setShowAddJD(false)}
          onSaved={(jd) => {
            setJds((prev) => [jd, ...prev]);
            setSelectedJdId(jd.id);
            setShowAddJD(false);
          }}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Builder</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Generate a JD-optimized resume from your master experience profile.
          </p>
        </div>

        {/* JD selector */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Target Job Description</h2>
            <span className="text-xs text-gray-400">{jds.length}/3 JDs saved</span>
          </div>

          {jds.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-4">No JDs saved yet. Add one to generate a tailored resume.</p>
              <button
                onClick={() => setShowAddJD(true)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                + Add Job Description
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedJdId}
                onChange={(e) => { setSelectedJdId(e.target.value); setResume(null); }}
                className="flex-1 min-w-48 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {jds.map((jd) => (
                  <option key={jd.id} value={jd.id}>
                    {jd.title ?? "Untitled"}{jd.company ? ` — ${jd.company}` : ""}
                  </option>
                ))}
              </select>
              {jds.length < 3 && (
                <button
                  onClick={() => setShowAddJD(true)}
                  className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  + Add JD
                </button>
              )}
              {selectedJdId && (
                <button
                  onClick={() => deleteJD(selectedJdId)}
                  className="px-4 py-2.5 border border-red-200 dark:border-red-900 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={generate}
                disabled={generating || !selectedJdId}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate Resume"}
              </button>
            </div>
          )}
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>

        {generating && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-10 text-center">
            <svg className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-500 text-sm">Selecting and optimizing your experience for this JD...</p>
          </div>
        )}

        {resume && (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left: ATS + rationale */}
            <div className="lg:col-span-2 space-y-4">
              {/* ATS score */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900 dark:text-white text-sm">ATS Score</h2>
                  <span className={`text-2xl font-bold ${resume.atsAnalysis.atsScore >= 70 ? "text-green-600" : resume.atsAnalysis.atsScore >= 50 ? "text-yellow-500" : "text-red-500"}`}>
                    {resume.atsAnalysis.atsScore}/100
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                  <div
                    className={`h-full rounded-full ${resume.atsAnalysis.atsScore >= 70 ? "bg-green-500" : resume.atsAnalysis.atsScore >= 50 ? "bg-yellow-500" : "bg-red-400"}`}
                    style={{ width: `${resume.atsAnalysis.atsScore}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                  <span>Keywords: {resume.atsAnalysis.keywordMatchScore}%</span>
                  <span>Formatting: {resume.atsAnalysis.formattingScore}%</span>
                </div>
                {resume.atsAnalysis.missingKeywords.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Missing keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {resume.atsAnalysis.missingKeywords.slice(0, 8).map((kw) => (
                        <span key={kw} className="px-2 py-0.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-full text-xs">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {resume.atsAnalysis.matchedKeywords.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Matched keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {resume.atsAnalysis.matchedKeywords.slice(0, 8).map((kw) => (
                        <span key={kw} className="px-2 py-0.5 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-full text-xs">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI rationale */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">AI Rationale</h2>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {resume.content.selectedEntries.map((e) => (
                    <div key={e.entryId} className={`text-xs p-2.5 rounded-lg ${e.included ? "bg-green-50 dark:bg-green-950/30" : "bg-gray-50 dark:bg-gray-800"}`}>
                      <div className="flex items-start gap-1.5">
                        <span className={e.included ? "text-green-600" : "text-gray-400"}>{e.included ? "✓" : "✗"}</span>
                        <span className={e.included ? "text-green-700 dark:text-green-300" : "text-gray-500"}>{e.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regenerate */}
              <button
                onClick={generate}
                disabled={generating}
                className="w-full py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                ↻ Regenerate
              </button>
            </div>

            {/* Right: Resume preview */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Resume — {selectedJD?.title ?? "PM"}{selectedJD?.company ? ` at ${selectedJD.company}` : ""} (v{resume.version})
                </h2>
              </div>
              <ResumePreview resume={resume} />
            </div>
          </div>
        )}

        {!resume && !generating && jds.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-400 text-sm mb-4">Select a JD above and click Generate Resume to get started.</p>
            <p className="text-xs text-gray-300 dark:text-gray-600">
              Your PSI entries will be selected and ordered based on relevance to the JD.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
