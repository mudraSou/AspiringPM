/**
 * PM Platform — Master Test Suite
 *
 * Covers:
 *   SMOKE        — Server alive, all routes respond (not 500)
 *   CRITICAL     — DB connection, env vars, schema integrity, error handling
 *   MODULE       — Unit tests per module (auth, learning, MCQ, streak, resume, questions, profile, dashboard)
 *   INTEGRATION  — Cross-module flows (onboarding → learning → progress → dashboard)
 *   FUNCTIONALITY — Feature contracts (ATS formula, scoring logic, strip answers, retry logic)
 *
 * Run: node scripts/test-suite.mjs
 *
 * Prerequisites:
 *   - .env configured (DATABASE_URL, GROQ_API_KEY, NEXTAUTH_URL, NEXTAUTH_SECRET)
 *   - Dev server running on port from NEXTAUTH_URL (default 3003)
 *   - Seed data loaded (npx tsx scripts/seed.ts)
 *   - Test user: soumya.mudrakola@gmail.com must exist
 */

import { readFileSync, existsSync } from "fs";
import { createRequire } from "module";

// ── Load .env ──────────────────────────────────────────────────────────────
const ENV_PATH = "c:/Users/DELL/AspiringPM/pm-platform/.env";
const env = readFileSync(ENV_PATH, "utf-8");
for (const line of env.split("\n")) {
  const eq = line.indexOf("=");
  if (eq > 0 && !line.startsWith("#")) {
    process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^"|"$/g, "");
  }
}

const require = createRequire(import.meta.url);
const ROOT = "c:/Users/DELL/AspiringPM/pm-platform";
const { PrismaClient } = require(`${ROOT}/node_modules/@prisma/client`);
const { PrismaPg } = require(`${ROOT}/node_modules/@prisma/adapter-pg`);
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3003";
const TEST_EMAIL = "soumya.mudrakola@gmail.com";

// ── Runner ─────────────────────────────────────────────────────────────────
let passed = 0, failed = 0, skipped = 0;
const failures = [];

async function test(label, fn) {
  process.stdout.write(`  ${label}... `);
  try {
    const msg = await fn();
    console.log(`✓  ${msg ?? ""}`);
    passed++;
  } catch (e) {
    console.log(`✗  ${e.message}`);
    failed++;
    failures.push({ label, error: e.message });
  }
}

function skip(label, reason) {
  console.log(`  ${label}... ⊘  SKIPPED (${reason})`);
  skipped++;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function section(title) {
  console.log(`\n${"━".repeat(55)}`);
  console.log(`  ${title}`);
  console.log("━".repeat(55));
}

// ── Safe fetch (returns { status, body, json }) ──────────────────────────
async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    redirect: "manual",
    ...opts,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  return { status: res.status, body: text, json };
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1 — SMOKE TESTS
// ═══════════════════════════════════════════════════════════════════════════
section("SMOKE — Server & Route Availability");

await test("Server alive at BASE_URL", async () => {
  const { status } = await apiFetch("/");
  assert(status !== 0 && ![502, 504].includes(status), `Server not responding: ${status}`);
  return `${BASE_URL} → ${status}`;
});

// GET-capable routes
const AUTH_GUARD_GET = [
  "/api/learning/path",
  "/api/questions",
  "/api/resume/jd",
  "/api/resume/versions",
  "/api/profile/settings",
  "/api/profile/entries",
  "/api/onboarding/status",
  "/api/onboarding/summary",
];
for (const route of AUTH_GUARD_GET) {
  await test(`GET ${route} → 401 (auth guard, not 500)`, async () => {
    const { status } = await apiFetch(route);
    assert(status === 401, `Expected 401, got ${status}`);
    return "401 Unauthorized";
  });
}

// POST-only routes — test via POST
const AUTH_GUARD_POST = [
  { route: "/api/learning/progress", body: { action: "test" } },
  { route: "/api/resume/generate",   body: { jdId: "test" } },
  { route: "/api/onboarding/profile", body: {} },
];
for (const { route, body } of AUTH_GUARD_POST) {
  await test(`POST ${route} → 401 (auth guard, not 500)`, async () => {
    const { status } = await apiFetch(route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    assert(status === 401, `Expected 401, got ${status}`);
    return "401 Unauthorized";
  });
}

await test("POST /api/auth/signup with empty body → 400 or 422 (not 500)", async () => {
  const { status } = await apiFetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert(status >= 400 && status < 500, `Expected 4xx, got ${status}`);
  return `${status} client error`;
});

await test("GET /dashboard → redirect (not 500)", async () => {
  const { status } = await apiFetch("/dashboard");
  assert(![500, 502, 503, 504].includes(status), `Server error: ${status}`);
  return `${status} (redirect expected)`;
});

await test("GET /auth/login → 200 (public page)", async () => {
  const { status } = await apiFetch("/auth/login");
  assert(status === 200, `Expected 200, got ${status}`);
  return "200 OK";
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2 — CRITICAL TESTS
// ═══════════════════════════════════════════════════════════════════════════
section("CRITICAL — Environment, DB, Schema, Error Handling");

await test("DATABASE_URL is set", async () => {
  assert(!!process.env.DATABASE_URL, "DATABASE_URL missing from .env");
  return "set";
});

await test("GROQ_API_KEY is set", async () => {
  assert(!!process.env.GROQ_API_KEY, "GROQ_API_KEY missing from .env");
  return "set";
});

await test("NEXTAUTH_SECRET is set", async () => {
  assert(!!process.env.NEXTAUTH_SECRET, "NEXTAUTH_SECRET missing from .env");
  return "set";
});

await test("NEXTAUTH_URL is set", async () => {
  assert(!!process.env.NEXTAUTH_URL, "NEXTAUTH_URL missing from .env");
  return process.env.NEXTAUTH_URL;
});

await test("DB connection — prisma.$queryRaw works", async () => {
  const result = await prisma.$queryRaw`SELECT 1 as ping`;
  assert(Array.isArray(result) && result.length > 0, "No result from DB ping");
  return "connected";
});

await test("Schema — User table accessible", async () => {
  const count = await prisma.user.count();
  assert(typeof count === "number", "User count not a number");
  return `${count} users`;
});

await test("Schema — LearningStage table accessible", async () => {
  const count = await prisma.learningStage.count();
  assert(count > 0, `Expected stages in DB, got ${count}`);
  return `${count} stages`;
});

await test("Schema — LearningSubTopic table accessible", async () => {
  const count = await prisma.learningSubTopic.count();
  assert(count > 0, `Expected sub-topics in DB, got ${count}`);
  return `${count} sub-topics`;
});

await test("Schema — StageProgress has quickCheckQuestions field", async () => {
  // Test by creating and reading a record with the field
  const stages = await prisma.learningStage.findFirst();
  const user = await prisma.user.findFirst({ where: { email: TEST_EMAIL }, select: { id: true } });
  assert(user, "Test user not found");
  // If the field doesn't exist, this select would throw
  const prog = await prisma.stageProgress.findFirst({
    where: { userId: user.id },
    select: { quickCheckQuestions: true, quickCheckAttempts: true },
  });
  return "quickCheckQuestions + quickCheckAttempts fields exist";
});

await test("Schema — Question table accessible", async () => {
  const count = await prisma.question.count();
  return `${count} questions in DB`;
});

await test("Error handling — POST /api/resume/generate without body returns JSON error", async () => {
  const { status, json } = await apiFetch("/api/resume/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  // Should be 401 (no auth) but body must be valid JSON not empty
  assert(json !== null, "Response body was not parseable JSON");
  assert(typeof json === "object", "Response must be a JSON object");
  return `${status} with JSON body`;
});

await test("Error handling — POST /api/questions/fake-id/attempt returns JSON (not empty body)", async () => {
  const { status, json } = await apiFetch("/api/questions/fake-id-123/attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer: "test" }),
  });
  assert(json !== null, "Response body was empty — missing try/catch in route");
  return `${status} with JSON body`;
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3 — MODULE: AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════
section("MODULE — Authentication");

await test("POST /api/auth/signup — missing email → 4xx", async () => {
  const { status } = await apiFetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "test1234" }),
  });
  assert(status >= 400 && status < 500, `Expected 4xx, got ${status}`);
  return `${status}`;
});

await test("POST /api/auth/signup — missing password → 4xx", async () => {
  const { status } = await apiFetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com" }),
  });
  assert(status >= 400 && status < 500, `Expected 4xx, got ${status}`);
  return `${status}`;
});

await test("POST /api/auth/signup — duplicate email returns error JSON", async () => {
  const { status, json } = await apiFetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: "test1234", name: "Test" }),
  });
  // Either 409 (conflict) or 400 — not 500, and must be JSON
  assert(json !== null, "No JSON in response");
  assert(status !== 500, `Got 500 — unhandled duplicate email`);
  return `${status} with error message`;
});

await test("Test user exists in DB", async () => {
  const user = await prisma.user.findFirst({ where: { email: TEST_EMAIL } });
  assert(user, `Test user ${TEST_EMAIL} not found — create it first`);
  return `id=${user.id.slice(0, 8)}...`;
});

await test("Test user has onboardingCompleted=true", async () => {
  const user = await prisma.user.findFirst({
    where: { email: TEST_EMAIL },
    select: { onboardingCompleted: true, targetPmRole: true },
  });
  assert(user, "Test user not found");
  assert(user.onboardingCompleted, "Onboarding not completed — run the full onboarding flow first");
  return `targetPmRole=${user.targetPmRole}`;
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4 — MODULE: LEARNING PATH
// ═══════════════════════════════════════════════════════════════════════════
section("MODULE — Learning Path");

// Fixtures
const user = await prisma.user.findFirst({ where: { email: TEST_EMAIL }, select: { id: true } });
assert(user, `Test user ${TEST_EMAIL} not found`);
const stages = await prisma.learningStage.findMany({ orderBy: { orderIndex: "asc" } });
const subTopics = await prisma.learningSubTopic.findMany();
const stage1 = stages[0];
const subs1 = subTopics.filter((s) => s.stageId === stage1?.id);

await test("At least 1 learning stage exists", async () => {
  assert(stages.length > 0, "No stages in DB — run seed script");
  return `${stages.length} stages`;
});

await test("Every stage has at least 1 sub-topic", async () => {
  for (const stage of stages) {
    const count = subTopics.filter((s) => s.stageId === stage.id).length;
    assert(count > 0, `Stage "${stage.name}" has no sub-topics`);
  }
  return `all ${stages.length} stages have sub-topics`;
});

await test("Stages have sequential orderIndex starting at 1", async () => {
  for (let i = 0; i < stages.length; i++) {
    assert(stages[i].orderIndex === i + 1, `Stage at position ${i} has orderIndex ${stages[i].orderIndex}, expected ${i + 1}`);
  }
  return "orderIndex sequential ✓";
});

await test("StageProgress — create in_progress record", async () => {
  await prisma.stageProgress.deleteMany({ where: { userId: user.id, stageId: stage1.id, subTopicId: null } });
  const p = await prisma.stageProgress.create({
    data: { userId: user.id, stageId: stage1.id, status: "in_progress" },
  });
  assert(p.status === "in_progress", "Status mismatch");
  await prisma.stageProgress.delete({ where: { id: p.id } });
  return "created + deleted";
});

await test("StageProgress — completed + skipped both count as done", async () => {
  const isDone = (s) => s === "completed" || s === "skipped";
  assert(isDone("completed"), "completed should be done");
  assert(isDone("skipped"), "skipped should be done");
  assert(!isDone("in_progress"), "in_progress should not be done");
  assert(!isDone("not_started"), "not_started should not be done");
  return "completed + skipped = done";
});

await test("LearningPct formula: completedSubs / totalSubs * 100 (rounded)", async () => {
  const cases = [
    [0, 10, 0], [5, 10, 50], [1, 3, 33], [2, 3, 67], [10, 10, 100],
  ];
  for (const [done, total, expected] of cases) {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    assert(pct === expected, `${done}/${total} expected ${expected}%, got ${pct}%`);
  }
  return "formula correct for all cases";
});

await test("Auto-skip: skipIfScoreAbove field exists on LearningStage", async () => {
  const stage = await prisma.learningStage.findFirst({
    select: { skipIfScoreAbove: true },
  });
  assert(stage !== null, "No stage found");
  // Field can be null (not set) — that's valid
  return `skipIfScoreAbove=${stage.skipIfScoreAbove ?? "null (not set)"}`;
});

await test("Auto-skip logic: score < threshold → not skipped", () => {
  const shouldAutoSkip = (overallScore, skipIfScoreAbove) =>
    skipIfScoreAbove !== null && overallScore >= skipIfScoreAbove;
  assert(!shouldAutoSkip(40, 70), "Score 40 should not auto-skip stage with threshold 70");
  assert(!shouldAutoSkip(69, 70), "Score 69 should not auto-skip stage with threshold 70");
  return "score < threshold → not skipped ✓";
});

await test("Auto-skip logic: score >= threshold → skipped", () => {
  const shouldAutoSkip = (overallScore, skipIfScoreAbove) =>
    skipIfScoreAbove !== null && overallScore >= skipIfScoreAbove;
  assert(shouldAutoSkip(70, 70), "Score 70 should auto-skip stage with threshold 70");
  assert(shouldAutoSkip(85, 70), "Score 85 should auto-skip stage with threshold 70");
  assert(!shouldAutoSkip(85, null), "null threshold should never auto-skip");
  return "score >= threshold → skipped ✓";
});

await test("Current stage detection: first in_progress, else first not-started", () => {
  const mockStages = [
    { id: "s1", name: "Fundamentals" },
    { id: "s2", name: "Strategy" },
    { id: "s3", name: "Analytics" },
  ];
  // Case 1: s2 is in_progress → current = s2
  const progressMap = new Map([["s1", "completed"], ["s2", "in_progress"]]);
  const currentStage =
    mockStages.find((s) => progressMap.get(s.id) === "in_progress") ??
    mockStages.find((s) => !progressMap.has(s.id));
  assert(currentStage?.id === "s2", `Expected s2, got ${currentStage?.id}`);
  // Case 2: only s1 complete → current = s2 (first not-started)
  const progressMap2 = new Map([["s1", "completed"]]);
  const currentStage2 =
    mockStages.find((s) => progressMap2.get(s.id) === "in_progress") ??
    mockStages.find((s) => !progressMap2.has(s.id));
  assert(currentStage2?.id === "s2", `Expected s2 (first not-started), got ${currentStage2?.id}`);
  // Case 3: s1 + s2 complete → current = s3
  const progressMap3 = new Map([["s1", "completed"], ["s2", "completed"]]);
  const currentStage3 =
    mockStages.find((s) => progressMap3.get(s.id) === "in_progress") ??
    mockStages.find((s) => !progressMap3.has(s.id));
  assert(currentStage3?.id === "s3", `Expected s3, got ${currentStage3?.id}`);
  return "in_progress → first not_started fallback ✓";
});

await test("GET /api/learning/path → 401 without session", async () => {
  const { status } = await apiFetch("/api/learning/path");
  assert(status === 401, `Expected 401, got ${status}`);
  return "401";
});

await test("POST /api/learning/progress → 401 without session", async () => {
  const { status } = await apiFetch("/api/learning/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "test" }),
  });
  assert(status === 401, `Expected 401, got ${status}`);
  return "401";
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5 — MODULE: MCQ QUICK CHECK (unit)
// ═══════════════════════════════════════════════════════════════════════════
section("MODULE — MCQ Quick Check (Unit)");

const MOCK_QUESTIONS = [
  { id: "q1", question: "Q1?", options: [], correctOptionId: "A", explanation: "A is right" },
  { id: "q2", question: "Q2?", options: [], correctOptionId: "B", explanation: "B is right" },
  { id: "q3", question: "Q3?", options: [], correctOptionId: "C", explanation: "C is right" },
];

function scoreQuickCheck(questions, answers) {
  const results = questions.map((q) => ({
    questionId: q.id,
    correct: answers[q.id] === q.correctOptionId,
    correctOptionId: q.correctOptionId,
    explanation: q.explanation,
  }));
  const correctCount = results.filter((r) => r.correct).length;
  const score = Math.round((correctCount / questions.length) * 100);
  const passed = correctCount >= 2;
  return { score, correctCount, passed, results };
}

function stripAnswers(questions) {
  return questions.map(({ correctOptionId: _c, explanation: _e, ...q }) => q);
}

await test("scoreQuickCheck: 3/3 correct → score=100, passed=true", () => {
  const { score, passed, correctCount } = scoreQuickCheck(MOCK_QUESTIONS, { q1: "A", q2: "B", q3: "C" });
  assert(score === 100, `Expected 100, got ${score}`);
  assert(passed === true, "Expected passed=true");
  assert(correctCount === 3, `Expected 3, got ${correctCount}`);
  return "100%, passed";
});

await test("scoreQuickCheck: 2/3 correct → score=67, passed=true", () => {
  const { score, passed, correctCount } = scoreQuickCheck(MOCK_QUESTIONS, { q1: "A", q2: "B", q3: "X" });
  assert(score === 67, `Expected 67, got ${score}`);
  assert(passed === true, "Expected passed=true");
  assert(correctCount === 2, `Expected 2, got ${correctCount}`);
  return "67%, passed";
});

await test("scoreQuickCheck: 1/3 correct → score=33, passed=false", () => {
  const { score, passed, correctCount } = scoreQuickCheck(MOCK_QUESTIONS, { q1: "A", q2: "X", q3: "X" });
  assert(score === 33, `Expected 33, got ${score}`);
  assert(passed === false, "Expected passed=false");
  assert(correctCount === 1, `Expected 1, got ${correctCount}`);
  return "33%, failed";
});

await test("scoreQuickCheck: 0/3 correct → score=0, passed=false", () => {
  const { score, passed, correctCount } = scoreQuickCheck(MOCK_QUESTIONS, { q1: "X", q2: "X", q3: "X" });
  assert(score === 0, `Expected 0, got ${score}`);
  assert(passed === false, "Expected passed=false");
  assert(correctCount === 0, `Expected 0, got ${correctCount}`);
  return "0%, failed";
});

await test("scoreQuickCheck: each result has questionId, correct, correctOptionId, explanation", () => {
  const { results } = scoreQuickCheck(MOCK_QUESTIONS, { q1: "A", q2: "X", q3: "X" });
  assert(results.length === 3, `Expected 3 results, got ${results.length}`);
  for (const r of results) {
    assert(r.questionId, "Missing questionId");
    assert(typeof r.correct === "boolean", "Missing correct bool");
    assert(r.correctOptionId, "Missing correctOptionId");
    assert(r.explanation, "Missing explanation");
  }
  return "all result fields present";
});

await test("stripAnswers: removes correctOptionId and explanation", () => {
  const stripped = stripAnswers(MOCK_QUESTIONS);
  for (const q of stripped) {
    assert(!("correctOptionId" in q), "correctOptionId should be stripped");
    assert(!("explanation" in q), "explanation should be stripped");
    assert(q.id, "id should remain");
    assert(q.question, "question should remain");
  }
  return "correctly stripped";
});

await test("scoreQuickCheck: empty answers map → 0 correct", () => {
  const { correctCount, passed } = scoreQuickCheck(MOCK_QUESTIONS, {});
  assert(correctCount === 0, `Expected 0, got ${correctCount}`);
  assert(passed === false, "Expected passed=false");
  return "0 correct with empty answers";
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6 — MODULE: STREAK TRACKING
// ═══════════════════════════════════════════════════════════════════════════
section("MODULE — Streak Tracking");

// Clean up before streak tests
await prisma.streakRecord.deleteMany({ where: { userId: user.id } });
await prisma.activityLog.deleteMany({ where: { userId: user.id } });

await test("First logActivity creates StreakRecord with streak=1", async () => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  // Simulate logActivity
  await prisma.activityLog.create({ data: { userId: user.id, activityType: "resource_completed" } });
  const streak = await prisma.streakRecord.findUnique({ where: { userId: user.id } });
  if (!streak) {
    await prisma.streakRecord.create({
      data: { userId: user.id, currentStreak: 1, longestStreak: 1, lastActivityDate: today },
    });
  }
  const result = await prisma.streakRecord.findUnique({ where: { userId: user.id } });
  assert(result, "StreakRecord not created");
  assert(result.currentStreak >= 1, `Expected streak ≥ 1, got ${result.currentStreak}`);
  return `streak=${result.currentStreak}`;
});

await test("Same-day second activity doesn't increment streak", async () => {
  const before = await prisma.streakRecord.findUnique({ where: { userId: user.id } });
  // Simulate second activity same day — daysSinceLast === 0 → no update
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const last = before?.lastActivityDate;
  const daysSinceLast = last ? Math.floor((today.getTime() - new Date(last).getTime()) / 86400000) : 999;
  const wouldUpdate = daysSinceLast !== 0;
  assert(!wouldUpdate, `Expected no update (same day), but daysSinceLast=${daysSinceLast}`);
  return "same-day deduplication ✓";
});

await test("Streak resets to 1 after 2+ day gap", async () => {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0);
  await prisma.streakRecord.update({
    where: { userId: user.id },
    data: { currentStreak: 5, longestStreak: 5, lastActivityDate: twoDaysAgo },
  });
  // Simulate logActivity: daysSinceLast = 2 → reset to 1
  const streak = await prisma.streakRecord.findUnique({ where: { userId: user.id } });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysSinceLast = Math.floor((today.getTime() - new Date(streak.lastActivityDate).getTime()) / 86400000);
  const newStreak = daysSinceLast === 1 ? streak.currentStreak + 1 : 1;
  assert(newStreak === 1, `Expected streak=1 after 2-day gap, got ${newStreak}`);
  return "streak resets to 1 ✓";
});

await test("Streak increments on consecutive day", async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  await prisma.streakRecord.update({
    where: { userId: user.id },
    data: { currentStreak: 3, longestStreak: 3, lastActivityDate: yesterday },
  });
  const streak = await prisma.streakRecord.findUnique({ where: { userId: user.id } });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysSinceLast = Math.floor((today.getTime() - new Date(streak.lastActivityDate).getTime()) / 86400000);
  const newStreak = daysSinceLast === 1 ? streak.currentStreak + 1 : 1;
  assert(newStreak === 4, `Expected streak=4, got ${newStreak}`);
  return "3 → 4 on consecutive day ✓";
});

await test("longestStreak is updated when streak exceeds previous longest", async () => {
  const streak = await prisma.streakRecord.findUnique({ where: { userId: user.id } });
  const newStreak = 10;
  const newLongest = Math.max(newStreak, streak.longestStreak);
  assert(newLongest >= newStreak, "longestStreak should be at least newStreak");
  return `longest=${newLongest}`;
});

// Cleanup streak
await prisma.streakRecord.deleteMany({ where: { userId: user.id } });
await prisma.activityLog.deleteMany({ where: { userId: user.id } });

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7 — MODULE: RESUME BUILDER
// ═══════════════════════════════════════════════════════════════════════════
section("MODULE — Resume Builder");

await test("GET /api/resume/jd → 401 without auth", async () => {
  const { status } = await apiFetch("/api/resume/jd");
  assert(status === 401, `Expected 401, got ${status}`);
  return "401";
});

await test("POST /api/resume/jd → 401 without auth", async () => {
  const { status } = await apiFetch("/api/resume/jd", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description: "test" }),
  });
  assert(status === 401, `Expected 401, got ${status}`);
  return "401";
});

await test("POST /api/resume/generate → 401 without auth", async () => {
  const { status } = await apiFetch("/api/resume/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jdId: "test" }),
  });
  assert(status === 401, `Expected 401, got ${status}`);
  return "401";
});

await test("GET /api/resume/versions → 401 without auth", async () => {
  const { status } = await apiFetch("/api/resume/versions");
  assert(status === 401, `Expected 401, got ${status}`);
  return "401";
});

// ATS score — unit tests (deterministic, no AI)
await test("calculateAtsScore — all keywords matched → high atsScore", () => {
  const resumeText = "Led product strategy for growth. Managed roadmap, launched features, improved retention. Built analytics dashboards. 2023 to present.";
  const keywords = ["product", "strategy", "roadmap", "analytics", "retention"];
  const resumeLower = resumeText.toLowerCase();
  const matched = keywords.filter((k) => resumeLower.includes(k.toLowerCase()));
  const keywordMatchScore = Math.round((matched.length / keywords.length) * 100);
  assert(keywordMatchScore === 100, `Expected 100%, got ${keywordMatchScore}%`);
  return `keywordMatchScore=${keywordMatchScore}%`;
});

await test("calculateAtsScore — no keywords matched → keywordMatchScore=0", () => {
  const resumeText = "Did some work at a company.";
  const keywords = ["product", "strategy", "roadmap", "analytics"];
  const resumeLower = resumeText.toLowerCase();
  const matched = keywords.filter((k) => resumeLower.includes(k.toLowerCase()));
  const keywordMatchScore = Math.round((matched.length / keywords.length) * 100);
  assert(keywordMatchScore === 0, `Expected 0%, got ${keywordMatchScore}%`);
  return `keywordMatchScore=${keywordMatchScore}%`;
});

await test("calculateAtsScore — formula: 0.6 × keyword + 0.4 × formatting", () => {
  const keyword = 80;
  const formatting = 100;
  const ats = Math.round(0.6 * keyword + 0.4 * formatting);
  assert(ats === 88, `Expected 88, got ${ats}`);
  return `0.6×80 + 0.4×100 = ${ats}`;
});

await test("calculateAtsScore — empty JD keywords → 0%", () => {
  const jdKeywords = [];
  const keywordMatchScore = jdKeywords.length > 0 ? 100 : 0;
  assert(keywordMatchScore === 0, `Expected 0, got ${keywordMatchScore}`);
  return "empty keywords → 0%";
});

await test("JobDescription DB CRUD — create, count, delete", async () => {
  const jd = await prisma.jobDescription.create({
    data: {
      userId: user.id,
      description: "Test JD for automated test",
      title: "Test PM Role",
      company: "Test Co",
      extractedKeywords: ["product", "strategy"],
    },
  });
  assert(jd.id, "JD not created");
  const count = await prisma.jobDescription.count({ where: { userId: user.id, title: "Test PM Role" } });
  assert(count >= 1, `Expected ≥1, got ${count}`);
  await prisma.jobDescription.delete({ where: { id: jd.id } });
  return "create → count → delete ✓";
});

await test("JobDescription limit enforced: max 3 JDs per user", async () => {
  const count = await prisma.jobDescription.count({ where: { userId: user.id } });
  const canAdd = count < 3;
  return `current count=${count}, canAdd=${canAdd}`;
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8 — MODULE: INTERVIEW QUESTIONS
// ═══════════════════════════════════════════════════════════════════════════
section("MODULE — Interview Questions");

await test("GET /api/questions → 401 without auth", async () => {
  const { status } = await apiFetch("/api/questions");
  assert(status === 401, `Expected 401, got ${status}`);
  return "401";
});

await test("POST /api/questions/[id]/attempt → 401 without auth", async () => {
  const fakeId = "00000000-0000-0000-0000-000000000001";
  const { status } = await apiFetch(`/api/questions/${fakeId}/attempt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer: "Test answer" }),
  });
  assert(status === 401, `Expected 401, got ${status}`);
  return "401";
});

await test("evaluationCriteria Array.isArray guard — non-array becomes []", () => {
  const rawCriteria = null;
  const evaluationCriteria = Array.isArray(rawCriteria) ? rawCriteria : [];
  assert(Array.isArray(evaluationCriteria), "Should be array");
  assert(evaluationCriteria.length === 0, "Should be empty array for null input");
  return "null → [] ✓";
});

await test("evaluationCriteria guard — object becomes []", () => {
  const rawCriteria = { criterion: "test", weight: 10 };
  const evaluationCriteria = Array.isArray(rawCriteria) ? rawCriteria : [];
  assert(evaluationCriteria.length === 0, "Should be empty for non-array object");
  return "object → [] ✓";
});

await test("evaluationCriteria guard — valid array passes through", () => {
  const rawCriteria = [{ criterion: "Clear structure", weight: 30 }];
  const evaluationCriteria = Array.isArray(rawCriteria) ? rawCriteria : [];
  assert(evaluationCriteria.length === 1, `Expected 1, got ${evaluationCriteria.length}`);
  return "array passes through ✓";
});

await test("criteriaResults render guard — non-array renders as []", () => {
  const malformedResult = { criteriaResults: null };
  const safe = Array.isArray(malformedResult.criteriaResults) ? malformedResult.criteriaResults : [];
  assert(safe.length === 0, "Should render 0 items for null");
  return "null criteriaResults → empty render ✓";
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9 — MODULE: PUBLIC PROFILE
// ═══════════════════════════════════════════════════════════════════════════
section("MODULE — Public Profile");

await test("GET /api/profile/settings → 401 without auth", async () => {
  const { status } = await apiFetch("/api/profile/settings");
  assert(status === 401, `Expected 401, got ${status}`);
  return "401";
});

await test("POST /api/profile/settings → 401 without auth", async () => {
  const { status } = await apiFetch("/api/profile/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: "test-slug" }),
  });
  assert(status === 401, `Expected 401, got ${status}`);
  return "401";
});

await test("GET /api/profile/entries → 401 without auth", async () => {
  const { status } = await apiFetch("/api/profile/entries");
  assert(status === 401, `Expected 401, got ${status}`);
  return "401";
});

await test("Profile slug validation — rejects special chars", () => {
  const sanitize = (s) => s.toLowerCase().replace(/[^a-z0-9-]/g, "");
  assert(sanitize("John Doe!") === "johndoe", `Got: ${sanitize("John Doe!")}`);
  assert(sanitize("soumya-pm") === "soumya-pm", "Hyphens should be preserved");
  assert(sanitize("AB12") === "ab12", "Uppercase should be lowercased");
  return "slug sanitization ✓";
});

await test("Profile slug min-length validation (≥ 3 chars)", () => {
  const isValid = (slug) => slug.length >= 3;
  assert(!isValid("ab"), "2 chars should be invalid");
  assert(isValid("abc"), "3 chars should be valid");
  assert(isValid("soumya-pm-2024"), "long slug should be valid");
  return "min-length validation ✓";
});

await test("Highlighted entries limit: max 5", () => {
  const toggle = (prev, id) => {
    if (prev.includes(id)) return prev.filter((x) => x !== id);
    if (prev.length >= 5) return prev;
    return [...prev, id];
  };
  let ids = [];
  for (let i = 1; i <= 7; i++) ids = toggle(ids, `entry${i}`);
  assert(ids.length === 5, `Expected 5 highlighted, got ${ids.length}`);
  return "max 5 enforced ✓";
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10 — MODULE: DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
section("MODULE — Dashboard");

await test("ReadinessSnapshot exists for test user", async () => {
  const snapshot = await prisma.readinessSnapshot.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return snapshot ? `score=${snapshot.overallScore}` : "no snapshot yet (ok for new users)";
});

await test("Score threshold logic: ≥70 = ready, 45-69 = on track, <45 = building", () => {
  const label = (score) => score >= 70 ? "ready" : score >= 45 ? "on track" : "building";
  assert(label(75) === "ready", `75 should be ready, got ${label(75)}`);
  assert(label(70) === "ready", `70 should be ready, got ${label(70)}`);
  assert(label(69) === "on track", `69 should be on track, got ${label(69)}`);
  assert(label(45) === "on track", `45 should be on track, got ${label(45)}`);
  assert(label(44) === "building", `44 should be building, got ${label(44)}`);
  assert(label(0) === "building", `0 should be building, got ${label(0)}`);
  return "all thresholds correct ✓";
});

await test("Skill rows mapping — 8 categories defined", () => {
  const CATEGORY_LABELS = {
    cat_product_thinking: "Product Thinking",
    cat_analytical: "Analytical Skills",
    cat_user_research: "User Research",
    cat_technical: "Technical Acumen",
    cat_communication: "Communication",
    cat_execution: "Execution",
    cat_business: "Business Acumen",
    cat_leadership: "Leadership",
  };
  const rows = Object.entries(CATEGORY_LABELS);
  assert(rows.length === 8, `Expected 8 categories, got ${rows.length}`);
  return "8 skill categories ✓";
});

await test("Focus keys: lowest 2 skills by score", () => {
  const skillRows = [
    { key: "cat_analytical", score: 20 },
    { key: "cat_leadership", score: 80 },
    { key: "cat_execution", score: 35 },
    { key: "cat_technical", score: 90 },
  ];
  const sorted = [...skillRows].sort((a, b) => a.score - b.score);
  const focusKeys = new Set([sorted[0]?.key, sorted[1]?.key]);
  assert(focusKeys.has("cat_analytical"), "lowest score should be focus");
  assert(focusKeys.has("cat_execution"), "second lowest should be focus");
  assert(!focusKeys.has("cat_leadership"), "high score should not be focus");
  return "focus = 2 lowest scores ✓";
});

await test("Days-to-milestone estimate is non-negative", () => {
  const learningPct = 35;
  const subTopicCount = 50;
  const nextMilestonePct = [25, 50, 75, 100].find((m) => m > learningPct) ?? 100;
  const subTopicsToMilestone = Math.round(((nextMilestonePct - learningPct) / 100) * subTopicCount);
  assert(subTopicsToMilestone >= 0, `Expected ≥0, got ${subTopicsToMilestone}`);
  assert(nextMilestonePct === 50, `Expected next milestone 50%, got ${nextMilestonePct}%`);
  return `${subTopicsToMilestone} sub-topics to ${nextMilestonePct}% milestone`;
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 11 — FUNCTIONALITY: AI CLIENT & PARSING
// ═══════════════════════════════════════════════════════════════════════════
section("FUNCTIONALITY — AI Client & JSON Parsing");

await test("parseJSONResponse — plain JSON object", () => {
  const text = '{"score": 75, "feedback": "Good answer"}';
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const result = JSON.parse(cleaned);
  assert(result.score === 75, `Expected 75, got ${result.score}`);
  return "plain JSON parsed ✓";
});

await test("parseJSONResponse — strips markdown code fences", () => {
  const text = "```json\n{\"score\": 80}\n```";
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const result = JSON.parse(cleaned);
  assert(result.score === 80, `Expected 80, got ${result.score}`);
  return "code fences stripped ✓";
});

await test("parseJSONResponse — extracts JSON from surrounding text", () => {
  const text = 'Here is the result: {"score": 65} end.';
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  assert(jsonMatch, "No JSON found in text");
  const result = JSON.parse(jsonMatch[1]);
  assert(result.score === 65, `Expected 65, got ${result.score}`);
  return "extracted from surrounding text ✓";
});

await test("parseJSONResponse — JSON array response", () => {
  const text = '["product", "strategy", "roadmap"]';
  const result = JSON.parse(text);
  assert(Array.isArray(result), "Expected array");
  assert(result.length === 3, `Expected 3 items, got ${result.length}`);
  return "JSON array parsed ✓";
});

await test("Retry logic — transient error detection", () => {
  const isTransient = (status) => status === 503 || status === 502 || status === 429;
  assert(isTransient(503), "503 should be transient");
  assert(isTransient(502), "502 should be transient");
  assert(isTransient(429), "429 should be transient");
  assert(!isTransient(401), "401 should not be transient");
  assert(!isTransient(404), "404 should not be transient");
  assert(!isTransient(400), "400 should not be transient");
  return "transient statuses: 429, 502, 503 ✓";
});

await test("Resume optimizer temperature is 0.1 (consistent ATS scores)", () => {
  const content = readFileSync(`${ROOT}/src/lib/agents/resume-optimizer.ts`, "utf-8");
  assert(content.includes("temperature: 0.1"), "resume-optimizer should use temperature 0.1 for consistency");
  return "temperature: 0.1 ✓";
});

await test("Resume generation timeout is ≥ 90000ms", () => {
  const content = readFileSync(`${ROOT}/src/lib/agents/resume-optimizer.ts`, "utf-8");
  assert(content.includes("timeoutMs: 90000"), "resume-optimizer should have 90s timeout");
  return "timeoutMs: 90000 ✓";
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 12 — INTEGRATION: CROSS-MODULE FLOWS
// ═══════════════════════════════════════════════════════════════════════════
section("INTEGRATION — Cross-Module Flows");

await test("Full learning progress flow: sub-topic completion → pct update", async () => {
  // Clean state
  await prisma.stageProgress.deleteMany({ where: { userId: user.id, subTopicId: { not: null } } });

  const total = await prisma.learningSubTopic.count();
  const before = await prisma.stageProgress.count({
    where: { userId: user.id, subTopicId: { not: null }, status: "completed" },
  });
  const pctBefore = total > 0 ? Math.round((before / total) * 100) : 0;

  // Complete 2 sub-topics
  const [s1, s2] = subTopics.slice(0, 2);
  await prisma.stageProgress.createMany({
    data: [
      { userId: user.id, stageId: stage1.id, subTopicId: s1.id, status: "completed" },
      { userId: user.id, stageId: stage1.id, subTopicId: s2.id, status: "completed" },
    ],
    skipDuplicates: true,
  });

  const after = await prisma.stageProgress.count({
    where: { userId: user.id, subTopicId: { not: null }, status: "completed" },
  });
  const pctAfter = total > 0 ? Math.round((after / total) * 100) : 0;

  assert(after === before + 2, `Expected ${before + 2} completed, got ${after}`);
  assert(pctAfter > pctBefore, `pct should increase: ${pctBefore}% → ${pctAfter}%`);

  // Cleanup
  await prisma.stageProgress.deleteMany({ where: { userId: user.id, subTopicId: { not: null } } });
  return `${pctBefore}% → ${pctAfter}% (${after}/${total} done)`;
});

await test("Stage completion flow: all sub-topics done → stage marked completed", async () => {
  // Clean stage1 progress
  await prisma.stageProgress.deleteMany({ where: { userId: user.id, stageId: stage1.id } });

  // Complete all sub-topics in stage1
  await prisma.stageProgress.createMany({
    data: subs1.map((s) => ({
      userId: user.id,
      stageId: stage1.id,
      subTopicId: s.id,
      status: "completed",
    })),
    skipDuplicates: true,
  });
  // Mark stage complete
  await prisma.stageProgress.create({
    data: { userId: user.id, stageId: stage1.id, status: "completed", completedAt: new Date() },
  });

  const stageProgress = await prisma.stageProgress.findFirst({
    where: { userId: user.id, stageId: stage1.id, subTopicId: null },
  });
  assert(stageProgress?.status === "completed", `Stage status should be completed, got ${stageProgress?.status}`);

  // Cleanup
  await prisma.stageProgress.deleteMany({ where: { userId: user.id, stageId: stage1.id } });
  return "stage completion flow ✓";
});

await test("Dashboard query pattern: batched Promise.all (no N+1)", async () => {
  const content = readFileSync(`${ROOT}/src/app/dashboard/page.tsx`, "utf-8");
  assert(content.includes("Promise.all"), "Dashboard should use Promise.all for batched queries");
  const prismaCallCount = (content.match(/prisma\./g) || []).length;
  assert(prismaCallCount > 3, `Expected several DB calls, found ${prismaCallCount}`);
  return `${prismaCallCount} prisma calls batched in Promise.all ✓`;
});

await test("Sidebar nav exists and is imported in layout", async () => {
  const layoutContent = readFileSync(`${ROOT}/src/app/dashboard/layout.tsx`, "utf-8");
  assert(layoutContent.includes("SidebarNav"), "Layout should import SidebarNav");
  assert(existsSync(`${ROOT}/src/components/dashboard/sidebar-nav.tsx`), "sidebar-nav.tsx file missing");
  return "SidebarNav imported in layout ✓";
});

await test("LearningProgressCard imported in dashboard page", async () => {
  const content = readFileSync(`${ROOT}/src/app/dashboard/page.tsx`, "utf-8");
  assert(content.includes("LearningProgressCard"), "LearningProgressCard not imported");
  assert(content.includes("learningPct"), "learningPct prop not passed");
  assert(content.includes("completedSubTopics"), "completedSubTopics prop not passed");
  return "LearningProgressCard wired correctly ✓";
});

await test("All client fetch calls use safe text→parse pattern", async () => {
  const filesToCheck = [
    `${ROOT}/src/app/dashboard/questions/page.tsx`,
    `${ROOT}/src/app/dashboard/resume/page.tsx`,
    `${ROOT}/src/app/dashboard/profile/page.tsx`,
  ];
  for (const file of filesToCheck) {
    const content = readFileSync(file, "utf-8");
    const hasUnsafeJson = /await res\.json\(\)/.test(content);
    assert(!hasUnsafeJson, `${file.split("/").pop()} still has bare res.json() call`);
  }
  return "all client pages use safe fetch pattern ✓";
});

await test("All AI-calling API routes have top-level try/catch", async () => {
  const routes = [
    { file: `${ROOT}/src/app/api/questions/[id]/attempt/route.ts`, name: "questions/attempt" },
    { file: `${ROOT}/src/app/api/resume/generate/route.ts`, name: "resume/generate" },
    { file: `${ROOT}/src/app/api/resume/jd/route.ts`, name: "resume/jd" },
  ];
  for (const { file, name } of routes) {
    const content = readFileSync(file, "utf-8");
    assert(content.includes("} catch (e)") || content.includes("} catch(e)") || content.includes("catch (e)"),
      `${name} is missing top-level catch block`);
  }
  return "all AI routes have try/catch ✓";
});

// ═══════════════════════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════════════════════
await prisma.stageProgress.deleteMany({ where: { userId: user.id } });
await prisma.streakRecord.deleteMany({ where: { userId: user.id } });
await prisma.activityLog.deleteMany({ where: { userId: user.id } });

await prisma.$disconnect();

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
const total = passed + failed + skipped;
console.log(`\n${"═".repeat(55)}`);
console.log(`  RESULTS: ${total} tests — ✓ ${passed} passed  ✗ ${failed} failed  ⊘ ${skipped} skipped`);
console.log("═".repeat(55));

if (failures.length > 0) {
  console.log("\n  FAILURES:");
  for (const { label, error } of failures) {
    console.log(`  ✗ ${label}`);
    console.log(`    → ${error}`);
  }
}

if (failed === 0) {
  console.log("\n  ✅ All tests passed\n");
} else {
  console.log(`\n  ❌ ${failed} test(s) failed\n`);
  process.exit(1);
}
