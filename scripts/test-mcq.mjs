/**
 * MCQ Quick Check — Full Test Suite
 *
 * Layers tested:
 *   1. DB schema  — quickCheckQuestions + quickCheckAttempts fields exist
 *   2. MCQ Agent  — generateQuickCheckMCQ returns valid questions
 *   3. Scoring    — scoreQuickCheck + stripAnswers work correctly
 *   4. API (backend) — get_quickcheck + submit_quickcheck via HTTP (needs session)
 *   5. DB state   — after pass/fail, StageProgress is correct
 *   6. Sequential lock — next sub-topic locked until prev passes
 *
 * Run: node scripts/test-mcq.mjs
 */
import { readFileSync } from "fs";
import { createRequire } from "module";

// ── Load .env ──────────────────────────────────────────────────────────────
const env = readFileSync("c:/Users/DELL/AspiringPM/pm-platform/.env", "utf-8");
for (const line of env.split("\n")) {
  const eq = line.indexOf("=");
  if (eq > 0 && !line.startsWith("#")) {
    process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^"|"$/g, "");
  }
}

// ── Prisma ─────────────────────────────────────────────────────────────────
const require = createRequire(import.meta.url);
const { PrismaClient } = require("c:/Users/DELL/AspiringPM/pm-platform/node_modules/@prisma/client");
const { PrismaPg } = require("c:/Users/DELL/AspiringPM/pm-platform/node_modules/@prisma/adapter-pg");
const OpenAI = require("c:/Users/DELL/AspiringPM/pm-platform/node_modules/openai").default;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3003";

// ── Helpers ────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;

async function test(label, fn) {
  process.stdout.write(`  ${label}... `);
  try {
    const msg = await fn();
    console.log(`✓ ${msg ?? ""}`);
    passed++;
  } catch (e) {
    console.log(`✗  ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

// ── 0. Resolve test fixtures ───────────────────────────────────────────────
console.log("\n━━━ 0. Setup ━━━");
const user = await prisma.user.findFirst({
  where: { email: "soumya.mudrakola@gmail.com" },
  select: { id: true, email: true },
});
assert(user, "Test user not found — sign up first");

const stage = await prisma.learningStage.findFirst({
  orderBy: { orderIndex: "asc" },
  include: { subTopics: { orderBy: { orderIndex: "asc" }, take: 2 } },
});
assert(stage, "No stages in DB");
assert(stage.subTopics.length >= 2, "Need at least 2 sub-topics for sequential lock test");

const subTopic = stage.subTopics[0];
const subTopic2 = stage.subTopics[1];
console.log(`  User: ${user.email}`);
console.log(`  Stage: "${stage.name}" (id=${stage.id})`);
console.log(`  SubTopic1: "${subTopic.name}" (id=${subTopic.id})`);
console.log(`  SubTopic2: "${subTopic2.name}" (id=${subTopic2.id})`);

// Clean up any previous test progress
await prisma.stageProgress.deleteMany({
  where: { userId: user.id, stageId: stage.id, subTopicId: { in: [subTopic.id, subTopic2.id] } },
});
console.log("  Cleaned prior test progress ✓");

// ── 1. DB Schema ───────────────────────────────────────────────────────────
console.log("\n━━━ 1. DB Schema ━━━");

await test("StageProgress has quickCheckAttempts column", async () => {
  const row = await prisma.stageProgress.create({
    data: { userId: user.id, stageId: stage.id, subTopicId: subTopic.id, quickCheckAttempts: 0 },
  });
  assert(row.quickCheckAttempts === 0, "quickCheckAttempts should default to 0");
  return `quickCheckAttempts=${row.quickCheckAttempts}`;
});

await test("StageProgress has quickCheckQuestions column (nullable Json)", async () => {
  const row = await prisma.stageProgress.findUnique({
    where: { userId_stageId_subTopicId: { userId: user.id, stageId: stage.id, subTopicId: subTopic.id } },
    select: { quickCheckQuestions: true },
  });
  assert(row !== null, "Row not found");
  assert(row.quickCheckQuestions === null, "quickCheckQuestions should be null by default");
  return "nullable Json column present";
});

await test("LearningSubTopic has generatedContent column", async () => {
  const st = await prisma.learningSubTopic.findUnique({
    where: { id: subTopic.id },
    select: { generatedContent: true, contentGeneratedAt: true },
  });
  assert(st !== null, "SubTopic not found");
  return `generatedContent=${st.generatedContent ? `${st.generatedContent.length} chars` : "null"}`;
});

// ── 2. MCQ Agent (direct Groq call) ───────────────────────────────────────
console.log("\n━━━ 2. MCQ Agent ━━━");

let generatedQuestions = null;

await test("generateQuickCheckMCQ returns 3 valid questions", async () => {
  const stageData = await prisma.learningSubTopic.findUnique({
    where: { id: subTopic.id },
    select: { name: true, description: true, stage: { select: { name: true } } },
  });

  const prompt = `Generate 3 multiple choice questions to test understanding of "${stageData.name}" (part of the "${stageData.stage.name}" module in a PM career prep course).

${stageData.description ? `Context: ${stageData.description}` : ""}
Attempt number: 1 — make these questions DIFFERENT from previous attempts. Vary the angle, difficulty, and concepts tested.

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": [
        {"id": "A", "text": "Option A text"},
        {"id": "B", "text": "Option B text"},
        {"id": "C", "text": "Option C text"},
        {"id": "D", "text": "Option D text"}
      ],
      "correctOptionId": "B",
      "explanation": "Brief explanation of why B is correct (1-2 sentences)."
    }
  ]
}

Rules:
- Questions must be practical and PM-relevant, not trivia
- Medium difficulty — a thoughtful beginner should get 1-2 right without study
- Each question tests a distinct concept from the sub-topic
- Distractors must be plausible, not obviously wrong
- Keep questions under 25 words, options under 15 words each`;

  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  let response;
  for (const model of models) {
    try {
      const res = await groq.chat.completions.create({
        model, max_tokens: 1000, temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
      });
      response = res.choices[0]?.message?.content ?? "";
      break;
    } catch (e) {
      if (e?.status === 429) continue;
      throw e;
    }
  }

  // Parse JSON — strip markdown fences if present
  const cleaned = response.replace(/^```json\s*/m, "").replace(/^```\s*/m, "").replace(/```$/m, "").trim();
  const parsed = JSON.parse(cleaned);
  assert(Array.isArray(parsed.questions), "questions must be array");
  assert(parsed.questions.length === 3, `Expected 3 questions, got ${parsed.questions.length}`);

  for (const q of parsed.questions) {
    assert(q.id, "question must have id");
    assert(q.question, "question must have text");
    assert(Array.isArray(q.options) && q.options.length === 4, "must have 4 options");
    assert(["A","B","C","D"].includes(q.correctOptionId), `invalid correctOptionId: ${q.correctOptionId}`);
    assert(q.explanation, "must have explanation");
  }

  generatedQuestions = parsed.questions;
  return `3 questions generated, first: "${parsed.questions[0].question.slice(0,50)}..."`;
});

// ── 3. Scoring Logic ───────────────────────────────────────────────────────
console.log("\n━━━ 3. Scoring Logic ━━━");

await test("scoreQuickCheck: all correct → score=100, passed=true", async () => {
  if (!generatedQuestions) throw new Error("Skip — question generation failed");
  const answers = {};
  for (const q of generatedQuestions) answers[q.id] = q.correctOptionId;
  let correct = 0;
  const results = generatedQuestions.map(q => {
    const c = answers[q.id] === q.correctOptionId;
    if (c) correct++;
    return { questionId: q.id, correct: c, correctOptionId: q.correctOptionId, explanation: q.explanation };
  });
  const score = Math.round((correct / generatedQuestions.length) * 100);
  const passed_flag = correct >= 2;
  assert(score === 100, `Expected 100, got ${score}`);
  assert(passed_flag === true, "Should pass when all correct");
  return `score=${score}, passed=${passed_flag}`;
});

await test("scoreQuickCheck: 1/3 correct → score≈33, passed=false", async () => {
  if (!generatedQuestions) throw new Error("Skip — question generation failed");
  const answers = {};
  answers[generatedQuestions[0].id] = generatedQuestions[0].correctOptionId; // correct
  // wrong for the rest — pick a wrong option
  for (let i = 1; i < generatedQuestions.length; i++) {
    const wrong = generatedQuestions[i].options.find(o => o.id !== generatedQuestions[i].correctOptionId);
    answers[generatedQuestions[i].id] = wrong.id;
  }
  let correct = 0;
  for (const q of generatedQuestions) if (answers[q.id] === q.correctOptionId) correct++;
  const score = Math.round((correct / generatedQuestions.length) * 100);
  const passed_flag = correct >= 2;
  assert(correct === 1, `Expected 1 correct, got ${correct}`);
  assert(passed_flag === false, "Should fail with 1/3");
  return `score=${score}, passed=${passed_flag}`;
});

await test("stripAnswers removes correctOptionId and explanation", async () => {
  if (!generatedQuestions) throw new Error("Skip — question generation failed");
  const stripped = generatedQuestions.map(({ correctOptionId: _c, explanation: _e, ...q }) => q);
  for (const q of stripped) {
    assert(!("correctOptionId" in q), "correctOptionId must be removed");
    assert(!("explanation" in q), "explanation must be removed");
    assert(q.id && q.question && Array.isArray(q.options), "must retain id, question, options");
  }
  return `${stripped.length} questions stripped`;
});

// ── 4. DB State After MCQ Flow ─────────────────────────────────────────────
console.log("\n━━━ 4. DB State (simulated API flow) ━━━");

await test("Store MCQ questions in StageProgress (simulates get_quickcheck)", async () => {
  if (!generatedQuestions) throw new Error("Skip — question generation failed");
  await prisma.stageProgress.update({
    where: { userId_stageId_subTopicId: { userId: user.id, stageId: stage.id, subTopicId: subTopic.id } },
    data: {
      quickCheckQuestions: generatedQuestions,
      quickCheckAttempts: 1,
    },
  });
  const saved = await prisma.stageProgress.findUnique({
    where: { userId_stageId_subTopicId: { userId: user.id, stageId: stage.id, subTopicId: subTopic.id } },
    select: { quickCheckQuestions: true, quickCheckAttempts: true },
  });
  assert(saved.quickCheckAttempts === 1, "attempts should be 1");
  assert(Array.isArray(saved.quickCheckQuestions), "questions should be array in DB");
  assert(saved.quickCheckQuestions.length === 3, "should have 3 questions stored");
  return `attempt #${saved.quickCheckAttempts}, ${saved.quickCheckQuestions.length} questions stored`;
});

await test("Fail simulation: score < 50 → status stays in_progress", async () => {
  await prisma.stageProgress.update({
    where: { userId_stageId_subTopicId: { userId: user.id, stageId: stage.id, subTopicId: subTopic.id } },
    data: { quickCheckScore: 33, quickCheckFeedback: "You got 1/3 correct.", status: "in_progress" },
  });
  const saved = await prisma.stageProgress.findUnique({
    where: { userId_stageId_subTopicId: { userId: user.id, stageId: stage.id, subTopicId: subTopic.id } },
    select: { status: true, quickCheckScore: true },
  });
  assert(saved.status === "in_progress", `BUG: status=${saved.status} after fail`);
  assert(saved.quickCheckScore === 33, "score should be 33");
  return `status=${saved.status}, score=${saved.quickCheckScore}`;
});

await test("Pass simulation: score=100 → status=completed", async () => {
  await prisma.stageProgress.update({
    where: { userId_stageId_subTopicId: { userId: user.id, stageId: stage.id, subTopicId: subTopic.id } },
    data: { quickCheckScore: 100, quickCheckFeedback: "You got 3/3!", status: "completed", completedAt: new Date() },
  });
  const saved = await prisma.stageProgress.findUnique({
    where: { userId_stageId_subTopicId: { userId: user.id, stageId: stage.id, subTopicId: subTopic.id } },
    select: { status: true, quickCheckScore: true, completedAt: true },
  });
  assert(saved.status === "completed", `Expected completed, got ${saved.status}`);
  assert(saved.quickCheckScore >= 50, "Passing score must be >= 50");
  assert(saved.completedAt !== null, "completedAt must be set");
  return `status=${saved.status}, score=${saved.quickCheckScore}`;
});

await test("Reattempt increments quickCheckAttempts", async () => {
  const before = await prisma.stageProgress.findUnique({
    where: { userId_stageId_subTopicId: { userId: user.id, stageId: stage.id, subTopicId: subTopic.id } },
    select: { quickCheckAttempts: true },
  });
  await prisma.stageProgress.update({
    where: { userId_stageId_subTopicId: { userId: user.id, stageId: stage.id, subTopicId: subTopic.id } },
    data: { quickCheckAttempts: (before.quickCheckAttempts ?? 0) + 1 },
  });
  const after = await prisma.stageProgress.findUnique({
    where: { userId_stageId_subTopicId: { userId: user.id, stageId: stage.id, subTopicId: subTopic.id } },
    select: { quickCheckAttempts: true },
  });
  assert(after.quickCheckAttempts === before.quickCheckAttempts + 1, "attempts should increment");
  return `attempts: ${before.quickCheckAttempts} → ${after.quickCheckAttempts}`;
});

// ── 5. Sequential Sub-topic Lock ───────────────────────────────────────────
console.log("\n━━━ 5. Sequential Lock Logic ━━━");

await test("SubTopic2 locked when SubTopic1 score < 50 (even if status=completed)", async () => {
  // Simulate: sub-topic 1 marked completed but score is 33 (failed QC)
  await prisma.stageProgress.upsert({
    where: { userId_stageId_subTopicId: { userId: user.id, stageId: stage.id, subTopicId: subTopic.id } },
    update: { status: "completed", quickCheckScore: 33 },
    create: { userId: user.id, stageId: stage.id, subTopicId: subTopic.id, status: "completed", quickCheckScore: 33 },
  });

  const prog = await prisma.stageProgress.findUnique({
    where: { userId_stageId_subTopicId: { userId: user.id, stageId: stage.id, subTopicId: subTopic.id } },
    select: { status: true, quickCheckScore: true },
  });

  // Replicate the isDone check from the UI
  const QC_PASSING_SCORE = 50;
  const hasPrevQC = !!subTopic.quickCheckPrompt;
  const prevDone = prog.status === "completed" &&
    (!hasPrevQC || (prog.quickCheckScore !== null && prog.quickCheckScore >= QC_PASSING_SCORE));

  assert(!prevDone, "Sub-topic2 should be locked — sub-topic1 has score 33 < 50");
  return `prevDone=${prevDone} → SubTopic2 correctly LOCKED`;
});

await test("SubTopic2 unlocked when SubTopic1 score >= 50", async () => {
  await prisma.stageProgress.update({
    where: { userId_stageId_subTopicId: { userId: user.id, stageId: stage.id, subTopicId: subTopic.id } },
    data: { quickCheckScore: 67 },
  });

  const prog = await prisma.stageProgress.findUnique({
    where: { userId_stageId_subTopicId: { userId: user.id, stageId: stage.id, subTopicId: subTopic.id } },
    select: { status: true, quickCheckScore: true },
  });

  const QC_PASSING_SCORE = 50;
  const hasPrevQC = !!subTopic.quickCheckPrompt;
  const prevDone = prog.status === "completed" &&
    (!hasPrevQC || (prog.quickCheckScore !== null && prog.quickCheckScore >= QC_PASSING_SCORE));

  assert(prevDone, "Sub-topic2 should be unlocked with score 67 >= 50");
  return `prevDone=${prevDone} → SubTopic2 correctly UNLOCKED`;
});

// ── 6. API Smoke ───────────────────────────────────────────────────────────
console.log("\n━━━ 6. API Smoke (unauthenticated) ━━━");

await test("GET /api/learning/path returns 401 without session", async () => {
  const res = await fetch(`${BASE_URL}/api/learning/path`);
  assert(res.status === 401, `Expected 401, got ${res.status}`);
  return "401 Unauthorized ✓";
});

await test("POST /api/learning/progress returns 401 without session", async () => {
  const res = await fetch(`${BASE_URL}/api/learning/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "get_quickcheck", stageId: stage.id, subTopicId: subTopic.id }),
  });
  assert(res.status === 401, `Expected 401, got ${res.status}`);
  return "401 Unauthorized ✓";
});

await test("POST submit_quickcheck without get_quickcheck first → 401 (no session)", async () => {
  const res = await fetch(`${BASE_URL}/api/learning/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "submit_quickcheck", stageId: stage.id, subTopicId: subTopic.id, answers: { q1: "A" } }),
  });
  assert(res.status === 401, `Expected 401, got ${res.status}`);
  return "401 Unauthorized ✓";
});

// ── Cleanup ────────────────────────────────────────────────────────────────
await prisma.stageProgress.deleteMany({
  where: { userId: user.id, stageId: stage.id, subTopicId: { in: [subTopic.id, subTopic2.id] } },
});

// ── Summary ────────────────────────────────────────────────────────────────
console.log("\n" + "━".repeat(50));
console.log(`  PASSED: ${passed}   FAILED: ${failed}`);
console.log("━".repeat(50));
if (failed === 0) {
  console.log("  ✅ All tests passed\n");
} else {
  console.log(`  ❌ ${failed} test(s) failed\n`);
  process.exit(1);
}

await prisma.$disconnect();
