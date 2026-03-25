"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Answers {
  currentRole: string;
  yearsExp: string;
  enjoyWork: string[];
  frustrations: string[];
  pmAttraction: string[];
}

// ─── Step 1: Background ───────────────────────────────────────────────────────

const ENJOY_OPTIONS = [
  { id: "strategy", label: "Defining strategy & direction" },
  { id: "data", label: "Analyzing data & metrics" },
  { id: "users", label: "Talking to users & understanding needs" },
  { id: "building", label: "Working with engineers to ship" },
  { id: "design", label: "Designing experiences" },
  { id: "stakeholders", label: "Influencing stakeholders" },
  { id: "process", label: "Improving processes & systems" },
  { id: "growth", label: "Growing users or revenue" },
];

const FRUSTRATION_OPTIONS = [
  { id: "no_ownership", label: "No ownership over outcomes" },
  { id: "no_strategy", label: "Executing without understanding why" },
  { id: "slow", label: "Moving too slowly" },
  { id: "silos", label: "Working in silos" },
  { id: "limited_scope", label: "Limited scope or impact" },
  { id: "no_users", label: "Disconnected from users" },
  { id: "repetitive", label: "Repetitive or predictable work" },
];

const PM_ATTRACTION_OPTIONS = [
  { id: "ownership", label: "Owning a product end-to-end" },
  { id: "impact", label: "Driving measurable impact" },
  { id: "variety", label: "Variety of challenges every day" },
  { id: "crossfunc", label: "Working across design, eng, data, marketing" },
  { id: "users2", label: "Deeply understanding users" },
  { id: "strategy2", label: "Setting product strategy" },
  { id: "career", label: "Clear career progression" },
];

function Step1({
  answers,
  setAnswers,
  onNext,
}: {
  answers: Answers;
  setAnswers: (a: Answers) => void;
  onNext: () => void;
}) {
  function toggleMulti(
    key: "enjoyWork" | "frustrations" | "pmAttraction",
    id: string
  ) {
    const current = answers[key];
    const updated = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    setAnswers({ ...answers, [key]: updated });
  }

  const canProceed =
    answers.currentRole.trim().length > 0 &&
    answers.enjoyWork.length > 0 &&
    answers.pmAttraction.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          What&apos;s your current role?
        </label>
        <input
          value={answers.currentRole}
          onChange={(e) => setAnswers({ ...answers, currentRole: e.target.value })}
          placeholder="e.g. Software Engineer, Designer, Analyst..."
          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Years of work experience
        </label>
        <div className="flex gap-2 flex-wrap">
          {["0-1", "1-3", "3-5", "5-8", "8+"].map((val) => (
            <button
              key={val}
              onClick={() => setAnswers({ ...answers, yearsExp: val })}
              className={`px-4 py-2 rounded-xl text-sm border transition-colors ${
                answers.yearsExp === val
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300"
              }`}
            >
              {val} yrs
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
          What do you enjoy most in your current work? <span className="text-gray-400 font-normal">(pick all that apply)</span>
        </label>
        <p className="text-xs text-gray-400 mb-3">Be honest — this helps us give you accurate insight.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ENJOY_OPTIONS.map((opt) => {
            const selected = answers.enjoyWork.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleMulti("enjoyWork", opt.id)}
                className={`text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                  selected
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                }`}
              >
                {selected ? "✓ " : ""}{opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
          What frustrates you most? <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FRUSTRATION_OPTIONS.map((opt) => {
            const selected = answers.frustrations.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleMulti("frustrations", opt.id)}
                className={`text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                  selected
                    ? "bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                }`}
              >
                {selected ? "✓ " : ""}{opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
          What draws you to product management? <span className="text-gray-400 font-normal">(pick all that apply)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PM_ATTRACTION_OPTIONS.map((opt) => {
            const selected = answers.pmAttraction.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleMulti("pmAttraction", opt.id)}
                className={`text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                  selected
                    ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                }`}
              >
                {selected ? "✓ " : ""}{opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        See which PM roles fit you →
      </button>
    </div>
  );
}

// ─── Step 2: PM Role Types ────────────────────────────────────────────────────

interface RoleType {
  id: string;
  title: string;
  description: string;
  strengths: string[];
  fits: string[]; // enjoyWork IDs that align
  attractionFits: string[]; // pmAttraction IDs that align
}

const PM_ROLES: RoleType[] = [
  {
    id: "consumer",
    title: "Consumer PM",
    description: "Builds products for millions of end users. Obsesses over UX, retention, and delight. Heavy user research and growth metrics.",
    strengths: ["User empathy", "Growth intuition", "Design taste"],
    fits: ["users", "design", "growth"],
    attractionFits: ["users2", "impact", "variety"],
  },
  {
    id: "growth",
    title: "Growth PM",
    description: "Owns acquisition, activation, retention, and revenue funnels. Data-heavy, experiment-driven, focused on measurable impact.",
    strengths: ["A/B testing", "Funnel analysis", "Metrics definition"],
    fits: ["data", "growth", "strategy"],
    attractionFits: ["impact", "strategy2", "ownership"],
  },
  {
    id: "technical",
    title: "Technical PM",
    description: "Works deeply with engineering on infrastructure, APIs, or complex systems. Translates business needs into technical solutions.",
    strengths: ["Technical depth", "Systems thinking", "Engineering partnership"],
    fits: ["building", "process", "data"],
    attractionFits: ["crossfunc", "ownership", "variety"],
  },
  {
    id: "platform",
    title: "Platform PM",
    description: "Builds products for internal teams or developers. Focuses on scalability, developer experience, and enabling other teams to ship.",
    strengths: ["Developer empathy", "API design", "Internal stakeholder management"],
    fits: ["building", "process", "stakeholders"],
    attractionFits: ["crossfunc", "impact", "strategy2"],
  },
  {
    id: "ai",
    title: "AI PM",
    description: "Ships AI-powered features. Understands model capabilities, data pipelines, and user trust. Growing demand, unique evaluation challenges.",
    strengths: ["AI literacy", "Ethical reasoning", "Rapid iteration"],
    fits: ["data", "building", "strategy"],
    attractionFits: ["variety", "impact", "ownership"],
  },
  {
    id: "b2b",
    title: "B2B / Enterprise PM",
    description: "Manages products for business customers. Deep stakeholder management, sales alignment, and long-cycle feedback loops.",
    strengths: ["Stakeholder influence", "Sales partnership", "Requirements distillation"],
    fits: ["stakeholders", "strategy", "process"],
    attractionFits: ["strategy2", "crossfunc", "career"],
  },
];

function computeRoleFit(answers: Answers): Array<{ role: RoleType; score: number }> {
  return PM_ROLES.map((role) => {
    const enjoyScore = role.fits.filter((f) => answers.enjoyWork.includes(f)).length;
    const attractionScore = role.attractionFits.filter((f) => answers.pmAttraction.includes(f)).length;
    const score = enjoyScore * 2 + attractionScore;
    return { role, score };
  }).sort((a, b) => b.score - a.score);
}

function Step2({
  answers,
  onNext,
}: {
  answers: Answers;
  onNext: (topRoleId: string) => void;
}) {
  const ranked = computeRoleFit(answers);
  const maxScore = ranked[0]?.score ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Based on what you enjoy and what draws you to PM, here&apos;s how different PM tracks map to your profile.
        </p>
      </div>

      <div className="space-y-3">
        {ranked.map(({ role, score }, idx) => {
          const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
          const isBest = idx === 0;
          return (
            <div
              key={role.id}
              className={`rounded-2xl border p-4 ${
                isBest
                  ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30"
                  : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{role.title}</span>
                  {isBest && (
                    <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded-full">Best fit</span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{pct}% match</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mb-3 overflow-hidden">
                <div
                  className={`h-full rounded-full ${isBest ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{role.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {role.strengths.map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onNext(ranked[0]?.role.id ?? "general")}
        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors"
      >
        See your honest PM fit assessment →
      </button>
    </div>
  );
}

// ─── Step 3: Honest Fit Assessment ───────────────────────────────────────────

type FitLevel = "strong" | "moderate" | "developing";

interface FitAssessment {
  level: FitLevel;
  headline: string;
  reasoning: string[];
  watchOuts: string[];
  topRole: string;
}

function computeFitAssessment(answers: Answers, topRoleId: string): FitAssessment {
  const ranked = computeRoleFit(answers);
  const topScore = ranked[0]?.score ?? 0;

  // Strong signals
  const hasStrategy = answers.enjoyWork.includes("strategy") || answers.enjoyWork.includes("data");
  const hasUserEmpathy = answers.enjoyWork.includes("users");
  const hasFrustration = answers.frustrations.length >= 2;
  const hasClear = answers.pmAttraction.length >= 3;
  const hasExperience = ["3-5", "5-8", "8+"].includes(answers.yearsExp);

  const positives: string[] = [];
  const watchOuts: string[] = [];

  if (hasStrategy) positives.push("You enjoy strategic thinking — a core PM muscle");
  if (hasUserEmpathy) positives.push("User focus is a strong PM indicator");
  if (hasFrustration) positives.push("Clear frustrations signal you know what you want to change");
  if (hasExperience) positives.push("Your experience gives you domain credibility to transition");
  if (hasClear) positives.push("You have specific, concrete reasons for wanting PM");
  if (answers.enjoyWork.includes("building")) positives.push("Enjoying cross-functional build work maps well to PM");
  if (answers.enjoyWork.includes("data")) positives.push("Data affinity is increasingly essential in PM");
  if (answers.enjoyWork.includes("stakeholders")) positives.push("Comfort with stakeholder influence is a PM multiplier");

  if (!hasUserEmpathy && !answers.pmAttraction.includes("users2")) {
    watchOuts.push("PM requires deep user empathy — make sure you're genuinely curious about users, not just the product");
  }
  if (!answers.enjoyWork.includes("stakeholders")) {
    watchOuts.push("PM involves constant stakeholder influence without direct authority — this frustrates many new PMs");
  }
  if (!hasExperience) {
    watchOuts.push("Limited experience means you'll need to compensate with strong domain expertise or hustle");
  }
  if (answers.enjoyWork.includes("design") && !answers.enjoyWork.includes("strategy")) {
    watchOuts.push("If design is your primary joy, consider UX or product design before full PM");
  }

  let level: FitLevel;
  let headline: string;

  const score = positives.length - Math.min(watchOuts.length, 2);

  if (score >= 4 || (topScore >= 5 && positives.length >= 3)) {
    level = "strong";
    headline = "Strong PM candidate — your background and motivations align well";
  } else if (score >= 2 || topScore >= 3) {
    level = "moderate";
    headline = "Good potential — a few gaps to close, but the foundation is there";
  } else {
    level = "developing";
    headline = "Early stages — building more specific PM skills will make you competitive";
  }

  return {
    level,
    headline,
    reasoning: positives.slice(0, 5),
    watchOuts: watchOuts.slice(0, 3),
    topRole: topRoleId,
  };
}

function Step3({
  answers,
  topRoleId,
  onNext,
}: {
  answers: Answers;
  topRoleId: string;
  onNext: (fit: FitLevel) => void;
}) {
  const assessment = computeFitAssessment(answers, topRoleId);

  const levelConfig = {
    strong: { color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800", label: "Strong Fit" },
    moderate: { color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800", label: "Moderate Fit" },
    developing: { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800", label: "Developing Fit" },
  }[assessment.level];

  const topRole = PM_ROLES.find((r) => r.id === topRoleId);

  return (
    <div className="space-y-6">
      {/* Overall fit */}
      <div className={`rounded-2xl border p-5 ${levelConfig.bg}`}>
        <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${levelConfig.color}`}>
          {levelConfig.label}
        </div>
        <p className="font-semibold text-gray-900 dark:text-white">{assessment.headline}</p>
        {topRole && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Your best-matched track: <span className="font-medium text-gray-900 dark:text-white">{topRole.title}</span>
          </p>
        )}
      </div>

      {/* Why this fits */}
      {assessment.reasoning.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">What&apos;s working in your favor</h3>
          <div className="space-y-2">
            {assessment.reasoning.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{r}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Watch-outs */}
      {assessment.watchOuts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Watch-outs to be aware of</h3>
          <div className="space-y-2">
            {assessment.watchOuts.map((w, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-orange-400 mt-0.5 flex-shrink-0">⚠</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{w}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Honest caveat */}
      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          This assessment is based on your self-reported answers. Real PM fit becomes clear through doing the work — talking to users, writing PRDs, analyzing metrics. The program below is designed to let you test that for yourself before committing.
        </p>
      </div>

      <button
        onClick={() => onNext(assessment.level)}
        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors"
      >
        See your next step →
      </button>
    </div>
  );
}

// ─── Step 4: Decision Point ───────────────────────────────────────────────────

function Step4({ fit, topRoleId }: { fit: FitLevel; topRoleId: string }) {
  const [choice, setChoice] = useState<"go" | "think" | "notforme" | null>(null);
  const topRole = PM_ROLES.find((r) => r.id === topRoleId);

  if (choice === "go") {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center text-3xl">
          🚀
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Let&apos;s build your PM profile</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Upload your resume, get your readiness score, and start your structured path to{" "}
            {topRole?.title ?? "PM"}.
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/auth/signup"
            className="block w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            Create your free account →
          </Link>
          <p className="text-xs text-gray-400">No credit card. Takes 2 minutes.</p>
        </div>
      </div>
    );
  }

  if (choice === "think") {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-3xl">
          🤔
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">That&apos;s a smart move</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            A PM transition is a big commitment. Bookmark this and come back when you&apos;re ready. The program will still be here.
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">When you are ready, start here:</p>
          <Link
            href="/auth/signup"
            className="block w-full py-3 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-xl font-medium text-sm hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
          >
            Start the free PM readiness assessment
          </Link>
        </div>
        <button
          onClick={() => setChoice(null)}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          ← Back
        </button>
      </div>
    );
  }

  if (choice === "notforme") {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl">
          👍
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Respect for the honesty</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Knowing what&apos;s not right for you is just as valuable as knowing what is. That clarity will help you find the right path.
          </p>
        </div>
        <p className="text-xs text-gray-400 max-w-xs mx-auto">
          If you ever change your mind or want to revisit, this assessment is always free.
        </p>
        <button
          onClick={() => setChoice(null)}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          ← Back
        </button>
      </div>
    );
  }

  const fitMessages: Record<FitLevel, { title: string; body: string }> = {
    strong: {
      title: "You have a strong foundation for PM",
      body: "The clearest way to validate is to do the work — analyze a product, write a strategy doc, get your gaps scored. That's what this program is built for.",
    },
    moderate: {
      title: "You have potential — the gaps are closeable",
      body: "Most successful PMs weren't obvious candidates on paper. What matters is how fast you close the gaps. Our structured program is built to do exactly that.",
    },
    developing: {
      title: "Starting from here is better than not starting",
      body: "The program will show you exactly where you stand and give you a concrete plan. Many PMs who look experienced today started with the same uncertainty.",
    },
  };

  const msg = fitMessages[fit];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{msg.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">{msg.body}</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setChoice("go")}
          className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-between px-5"
        >
          <span>I want to pursue this — let&apos;s go</span>
          <span>→</span>
        </button>
        <button
          onClick={() => setChoice("think")}
          className="w-full py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          I need more time to think
        </button>
        <button
          onClick={() => setChoice("notforme")}
          className="w-full py-3 text-gray-400 hover:text-gray-500 text-sm transition-colors"
        >
          PM probably isn&apos;t for me
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STEPS = ["Background", "PM Tracks", "Your Fit", "Next Step"];

export default function DiscoverPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    currentRole: "",
    yearsExp: "",
    enjoyWork: [],
    frustrations: [],
    pmAttraction: [],
  });
  const [topRoleId, setTopRoleId] = useState("general");
  const [fit, setFit] = useState<FitLevel>("moderate");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Nav */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight">PM Platform</Link>
          <Link
            href="/auth/signin"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Already have an account?
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Is product management right for you?
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
            Answer a few honest questions. We&apos;ll show you which PM tracks align with your background and give you an unfiltered assessment.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`flex-1 h-1 rounded-full transition-colors ${i < step ? "bg-blue-600" : i === step ? "bg-blue-300 dark:bg-blue-700" : "bg-gray-200 dark:bg-gray-700"}`} />
              {i === STEPS.length - 1 && null}
            </div>
          ))}
        </div>

        <div className="mb-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        {/* Step content */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          {step === 0 && (
            <Step1
              answers={answers}
              setAnswers={setAnswers}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <Step2
              answers={answers}
              onNext={(roleId) => { setTopRoleId(roleId); setStep(2); }}
            />
          )}
          {step === 2 && (
            <Step3
              answers={answers}
              topRoleId={topRoleId}
              onNext={(fitLevel) => { setFit(fitLevel); setStep(3); }}
            />
          )}
          {step === 3 && (
            <Step4 fit={fit} topRoleId={topRoleId} />
          )}
        </div>

        {/* Back button */}
        {step > 0 && step < 3 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="mt-4 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
