"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UploadState = "idle" | "uploading" | "success" | "error";

export default function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPasteMode, setShowPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState("");

  async function uploadFile(file: File) {
    setState("uploading");
    setErrorMsg("");

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/onboarding/resume", {
      method: "POST",
      body: form,
    });

    const data = await res.json();

    if (!res.ok) {
      setState("error");
      setErrorMsg(data.error ?? "Upload failed. Please try again.");
      return;
    }

    setState("success");
    setTimeout(() => router.push("/onboarding/profile"), 600);
  }

  async function submitPastedText() {
    if (!pastedText.trim()) return;
    setState("uploading");

    const form = new FormData();
    form.append("pastedText", pastedText.trim());

    const res = await fetch("/api/onboarding/resume", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const data = await res.json();
      setState("error");
      setErrorMsg(data.error ?? "Something went wrong.");
      return;
    }

    setState("success");
    setTimeout(() => router.push("/onboarding/profile"), 600);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      uploadFile(file);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      uploadFile(file);
    }
  }

  const LLM_EXPORT_PROMPT = `Please extract my complete work history and format it exactly like this for each role:

Company: [Company Name]
Role: [Job Title]
Period: [Start Month Year] to [End Month Year or Present]
Description:
- [What you built / worked on]
- [Problems you solved]
- [Impact or outcomes, with numbers if possible]
- [Who you worked with / stakeholders]
- [Any metrics, timelines, or scale]

Include ALL roles, even short ones. For each bullet, be specific about what the problem was, what you did, and what happened as a result. Don't summarize — give full context.`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-200 dark:bg-gray-800">
        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: "16%" }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Step indicator */}
          <div className="text-center mb-8">
            <span className="text-xs font-mono text-blue-600 uppercase tracking-wider">Step 1 of 6</span>
            <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
              Upload your resume
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
              We&apos;ll extract your PM-relevant experience and reframe it.
            </p>
          </div>

          {!showPasteMode ? (
            <>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => state === "idle" && inputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
                  ${dragOver
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : state === "success"
                    ? "border-green-400 bg-green-50 dark:bg-green-950 cursor-default"
                    : state === "error"
                    ? "border-red-300 bg-red-50 dark:bg-red-950 cursor-default"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-900"
                  }
                `}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {state === "idle" && (
                  <>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">
                      Drop your resume here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      or click to browse — PDF, DOCX, or TXT · Max 5MB
                    </p>
                  </>
                )}

                {state === "uploading" && (
                  <>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Uploading {selectedFile?.name}...
                    </p>
                  </>
                )}

                {state === "success" && (
                  <>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Uploaded! Taking you to the next step...
                    </p>
                  </>
                )}

                {state === "error" && (
                  <>
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-950 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="font-semibold text-red-700 dark:text-red-400 mb-2">{errorMsg}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setState("idle"); setErrorMsg(""); }}
                      className="text-sm text-blue-600 underline"
                    >
                      Try again
                    </button>
                  </>
                )}
              </div>

              {/* No resume option */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowPasteMode(true)}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                >
                  I don&apos;t have a resume handy →
                </button>
              </div>
            </>
          ) : (
            /* LLM Prompt Export mode */
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
              <button
                onClick={() => setShowPasteMode(false)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ← Back to file upload
              </button>

              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Use the AI export prompt
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Copy this prompt, paste it into ChatGPT or Claude, then paste the response below.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-gray-500 uppercase">Copy this prompt</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(LLM_EXPORT_PROMPT)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Copy
                  </button>
                </div>
                <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {LLM_EXPORT_PROMPT}
                </pre>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Paste the AI&apos;s response here
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Paste the AI's response here..."
                />
              </div>

              <button
                onClick={submitPastedText}
                disabled={!pastedText.trim() || state === "uploading"}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target text-sm"
              >
                {state === "uploading" ? "Saving..." : "Continue with this →"}
              </button>

              {state === "error" && (
                <p className="text-sm text-red-600 text-center">{errorMsg}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
