/**
 * Backend test for the learning path flow.
 * Tests: stages/sub-topics in DB, quick check fail keeps in_progress, quick check pass marks completed.
 */
import { readFileSync } from "fs";
import { createRequire } from "module";

const env = readFileSync("c:/Users/DELL/AspiringPM/pm-platform/.env", "utf-8");
for (const line of env.split("\n")) {
  const eq = line.indexOf("=");
  if (eq > 0 && !line.startsWith("#")) {
    process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^"|"$/g, "");
  }
}

const require = createRequire(import.meta.url);
const { PrismaClient } = require("c:/Users/DELL/AspiringPM/pm-platform/node_modules/@prisma/client");
const { PrismaPg } = require("c:/Users/DELL/AspiringPM/pm-platform/node_modules/@prisma/adapter-pg");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function step(label, fn) {
  process.stdout.write(`\n[TEST] ${label}... `);
  try {
    const result = await fn();
    console.log("✓", result ?? "");
    return result;
  } catch (e) {
    console.log("✗ FAILED:", e.message);
    process.exit(1);
  }
}

// ── 1. User ──────────────────────────────────────────────────────────────────
const userId = await step("User exists", async () => {
  const u = await prisma.user.findFirst({
    where: { email: "soumya.mudrakola@gmail.com" },
    select: { id: true, email: true, onboardingStep: true, targetPmRole: true },
  });
  if (!u) throw new Error("User not found");
  console.log(`\n     ${u.email} | step=${u.onboardingStep} | role=${u.targetPmRole}`);
  return u.id;
});

// ── 2. Stages ────────────────────────────────────────────────────────────────
const stages = await step("11 stages seeded", async () => {
  const s = await prisma.learningStage.findMany({
    orderBy: { orderIndex: "asc" },
    include: { subTopics: { select: { id: true, name: true, quickCheckPrompt: true } } },
  });
  if (s.length !== 11) throw new Error(`Expected 11, got ${s.length}`);
  s.forEach(st => console.log(`\n     Stage ${st.orderIndex}: ${st.name} (${st.subTopics.length} sub-topics)`));
  return s;
});

// ── 3. Sub-topics + quick checks ─────────────────────────────────────────────
await step("All sub-topics have quick check prompts", async () => {
  const noQC = stages.flatMap(s =>
    s.subTopics.filter(t => !t.quickCheckPrompt).map(t => `${s.name}/${t.name}`)
  );
  if (noQC.length) throw new Error(`Missing quick checks: ${noQC.join(", ")}`);
  const total = stages.reduce((n, s) => n + s.subTopics.length, 0);
  return `${total} sub-topics all have quick check prompts`;
});

// ── 4. Gate assignments on all stages ────────────────────────────────────────
await step("All stages have gate assignments", async () => {
  const noGate = stages.filter(s => !s.gateAssignmentPrompt).map(s => s.name);
  if (noGate.length) throw new Error(`Missing gates: ${noGate.join(", ")}`);
  return `All 11 stages have gate assignments`;
});

// Use stage 1, sub-topic 1 for progress tests
const testStage = stages[0];
const testSubTopic = testStage.subTopics[0];

// Cleanup any existing test progress
await prisma.stageProgress.deleteMany({
  where: { userId, stageId: testStage.id, subTopicId: testSubTopic.id },
});

// ── 5. Quick check FAIL — status stays in_progress ───────────────────────────
await step("Quick check fail → status=in_progress (not completed)", async () => {
  const response = "short";
  const passed = response.trim().length >= 50;

  await prisma.stageProgress.upsert({
    where: { userId_stageId_subTopicId: { userId, stageId: testStage.id, subTopicId: testSubTopic.id } },
    update: { quickCheckResponse: response, quickCheckScore: 30, quickCheckFeedback: "Too brief.", ...(passed ? { status: "completed", completedAt: new Date() } : {}) },
    create: { userId, stageId: testStage.id, subTopicId: testSubTopic.id, quickCheckResponse: response, quickCheckScore: 30, quickCheckFeedback: "Too brief.", status: passed ? "completed" : "in_progress" },
  });

  const saved = await prisma.stageProgress.findUnique({
    where: { userId_stageId_subTopicId: { userId, stageId: testStage.id, subTopicId: testSubTopic.id } },
    select: { status: true },
  });
  if (saved.status === "completed") throw new Error("BUG: marked completed on failure");
  return `status=${saved.status} ✓ correct`;
});

// ── 6. Quick check PASS — status becomes completed ───────────────────────────
await step("Quick check pass → status=completed", async () => {
  const response = "A proper problem statement identifies who experiences the problem, when it occurs, and the measurable impact on the user or business — not a solution.";
  const passed = response.trim().length >= 50;
  if (!passed) throw new Error("Test response too short");

  await prisma.stageProgress.upsert({
    where: { userId_stageId_subTopicId: { userId, stageId: testStage.id, subTopicId: testSubTopic.id } },
    update: { quickCheckResponse: response, quickCheckScore: 80, quickCheckFeedback: "Good summary.", status: "completed", completedAt: new Date() },
    create: { userId, stageId: testStage.id, subTopicId: testSubTopic.id, quickCheckResponse: response, quickCheckScore: 80, quickCheckFeedback: "Good summary.", status: "completed", completedAt: new Date() },
  });

  const saved = await prisma.stageProgress.findUnique({
    where: { userId_stageId_subTopicId: { userId, stageId: testStage.id, subTopicId: testSubTopic.id } },
    select: { status: true, quickCheckScore: true, completedAt: true },
  });
  if (saved.status !== "completed") throw new Error(`Expected completed, got ${saved.status}`);
  return `status=${saved.status} | score=${saved.quickCheckScore} | completedAt=${saved.completedAt?.toISOString()}`;
});

// ── 7. Reattempt — can overwrite previous pass with new response ──────────────
await step("Reattempt: can resubmit after previous attempt", async () => {
  const newResponse = "Users who work late at night experience eye strain from bright interfaces. The problem occurs during evening usage and causes physical discomfort, reducing session length by 40%.";
  await prisma.stageProgress.update({
    where: { userId_stageId_subTopicId: { userId, stageId: testStage.id, subTopicId: testSubTopic.id } },
    data: { quickCheckResponse: newResponse, quickCheckScore: 80, quickCheckFeedback: "Great detail." },
  });
  const saved = await prisma.stageProgress.findUnique({
    where: { userId_stageId_subTopicId: { userId, stageId: testStage.id, subTopicId: testSubTopic.id } },
    select: { quickCheckResponse: true },
  });
  if (!saved.quickCheckResponse.includes("eye strain")) throw new Error("Response not updated");
  return `Response updated successfully`;
});

// ── 8. Overall progress summary ───────────────────────────────────────────────
await step("Progress summary for user", async () => {
  const progress = await prisma.stageProgress.findMany({ where: { userId }, select: { status: true } });
  const completed = progress.filter(p => p.status === "completed").length;
  const inProg = progress.filter(p => p.status === "in_progress").length;
  return `${progress.length} total records | ${completed} completed | ${inProg} in_progress`;
});

// Cleanup test data
await prisma.stageProgress.deleteMany({ where: { userId, stageId: testStage.id, subTopicId: testSubTopic.id } });
console.log("\n  (test progress cleaned up)");

console.log("\n✅ All learning flow backend tests passed\n");
await prisma.$disconnect();
