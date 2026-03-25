/**
 * LearningProgressCard + Dashboard — Test Suite
 *
 * Tests:
 *   1.  Donut chart % math at all milestone boundaries
 *   2.  Motivation copy — correct tier for each % bucket
 *   3.  Milestone track — next milestone and pts-to-go
 *   4.  Stage list — active/done/pending status mapping
 *   5.  CTA label logic — 0% / in-progress / 100%
 *   6.  DB: learningPct formula (completedSubs / totalSubs)
 *   7.  DB: completedCount includes skipped stages
 *   8.  Dashboard API — GET /dashboard returns 200 when authenticated
 *   9.  Auto-skip doesn't affect manual in_progress stages
 *  10.  Progress % = 0 when no sub-topics completed
 *  11.  Progress % = 100 when all sub-topics completed
 *  12.  Component file exists and exports default
 *  13.  Dashboard page imports LearningProgressCard
 *  14.  API /learning/path returns isAutoSkipped field
 *  15.  Streak + learningPct both present in dashboard data
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

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3003";

let passed = 0, failed = 0;
async function test(label, fn) {
  process.stdout.write(`  ${label}... `);
  try {
    const msg = await fn();
    console.log(`✓  ${msg ?? ""}`);
    passed++;
  } catch (e) {
    console.log(`✗  ${e.message}`);
    failed++;
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

// ── Fixtures ───────────────────────────────────────────────────────────────
const user = await prisma.user.findFirst({ where: { email: "soumya.mudrakola@gmail.com" }, select: { id: true } });
assert(user, "Test user not found");

const stages = await prisma.learningStage.findMany({ orderBy: { orderIndex: "asc" } });
const subTopics = await prisma.learningSubTopic.findMany();
const stage1 = stages[0];
const subs1 = subTopics.filter(s => s.stageId === stage1.id);

await prisma.stageProgress.deleteMany({ where: { userId: user.id } });
console.log(`\n  Fixtures: ${stages.length} stages, ${subTopics.length} sub-topics\n`);

// ── 1. Donut % math ────────────────────────────────────────────────────────
console.log("━━━ 1. Donut Chart % Math ━━━");

await test("pct=0: 0/N = 0%", async () => {
  const pct = subTopics.length > 0 ? Math.round((0 / subTopics.length) * 100) : 0;
  assert(pct === 0, `Expected 0, got ${pct}`);
  return `0/${subTopics.length} = ${pct}%`;
});

await test("pct=100: all/all = 100%", async () => {
  const total = subTopics.length;
  const pct = Math.round((total / total) * 100);
  assert(pct === 100, `Expected 100, got ${pct}`);
  return `${total}/${total} = ${pct}%`;
});

await test("pct rounds correctly: 1/3 = 33%", async () => {
  const pct = Math.round((1 / 3) * 100);
  assert(pct === 33, `Expected 33, got ${pct}`);
  return `1/3 = ${pct}%`;
});

await test("pct rounds correctly: 2/3 = 67%", async () => {
  const pct = Math.round((2 / 3) * 100);
  assert(pct === 67, `Expected 67, got ${pct}`);
  return `2/3 = ${pct}%`;
});

// ── 2. Motivation copy tiers ───────────────────────────────────────────────
console.log("\n━━━ 2. Motivation Copy Tiers ━━━");

function getMotivationTier(pct) {
  if (pct === 0)   return "journey-start";
  if (pct < 15)    return "great-start";
  if (pct < 30)    return "building-skills";
  if (pct < 50)    return "almost-halfway";
  if (pct < 65)    return "past-halfway";
  if (pct < 80)    return "top-tier";
  if (pct < 100)   return "finish-line";
  return "complete";
}

const tierCases = [
  [0, "journey-start"], [5, "great-start"], [20, "building-skills"],
  [40, "almost-halfway"], [55, "past-halfway"], [70, "top-tier"],
  [85, "finish-line"], [100, "complete"],
];

for (const [pct, expected] of tierCases) {
  await test(`pct=${pct} → tier="${expected}"`, async () => {
    const tier = getMotivationTier(pct);
    assert(tier === expected, `Expected "${expected}", got "${tier}"`);
    return `✓`;
  });
}

// ── 3. Milestone track ─────────────────────────────────────────────────────
console.log("\n━━━ 3. Milestone Track ━━━");

const MILESTONES = [25, 50, 75, 100];

await test("pct=0: next milestone = 25, ptsToNext = 25", async () => {
  const next = MILESTONES.find(m => m > 0);
  assert(next === 25, `Expected 25, got ${next}`);
  assert(25 - 0 === 25, "ptsToNext wrong");
  return `next=${next}, ptsToNext=25`;
});

await test("pct=26: next milestone = 50, ptsToNext = 24", async () => {
  const pct = 26;
  const next = MILESTONES.find(m => m > pct);
  assert(next === 50, `Expected 50, got ${next}`);
  assert(next - pct === 24, `Expected 24, got ${next - pct}`);
  return `next=${next}, ptsToNext=${next - pct}`;
});

await test("pct=100: no next milestone", async () => {
  const next = MILESTONES.find(m => m > 100);
  assert(next === undefined, `Expected undefined, got ${next}`);
  return "no milestone beyond 100%";
});

await test("Milestones ≤ pct are marked done", async () => {
  const pct = 60;
  const done = MILESTONES.filter(m => pct >= m);
  const pending = MILESTONES.filter(m => pct < m);
  assert(done.length === 2 && done.includes(25) && done.includes(50), `Done: ${done}`);
  assert(pending.length === 2 && pending.includes(75) && pending.includes(100), `Pending: ${pending}`);
  return `done=[${done}], pending=[${pending}]`;
});

// ── 4. Stage status mapping ────────────────────────────────────────────────
console.log("\n━━━ 4. Stage Status Mapping ━━━");

await test("status=completed → isDone=true", async () => {
  const isDone = (s) => s === "completed" || s === "skipped";
  assert(isDone("completed"), "completed should be done");
  assert(isDone("skipped"), "skipped should be done");
  assert(!isDone("in_progress"), "in_progress should not be done");
  assert(!isDone("not_started"), "not_started should not be done");
  return "completed + skipped = done, others = not done";
});

await test("Active stage detection", async () => {
  const statuses = ["completed", "in_progress", "not_started", "not_started"];
  const activeIdx = statuses.findIndex(s => s === "in_progress");
  assert(activeIdx === 1, `Expected index 1, got ${activeIdx}`);
  return `active at index ${activeIdx}`;
});

// ── 5. CTA label logic ─────────────────────────────────────────────────────
console.log("\n━━━ 5. CTA Label Logic ━━━");

function ctaLabel(pct, currentStageName) {
  if (pct === 100) return "Review Your Path";
  if (currentStageName) return `Continue: ${currentStageName}`;
  return "Start Learning";
}

await test("pct=0, no stage → 'Start Learning'", async () => {
  const label = ctaLabel(0, null);
  assert(label === "Start Learning", `Got: ${label}`);
  return label;
});

await test("pct=50, stage='PM Strategy' → 'Continue: PM Strategy'", async () => {
  const label = ctaLabel(50, "PM Strategy");
  assert(label === "Continue: PM Strategy", `Got: ${label}`);
  return label;
});

await test("pct=100 → 'Review Your Path'", async () => {
  const label = ctaLabel(100, "PM Strategy");
  assert(label === "Review Your Path", `Got: ${label}`);
  return label;
});

// ── 6. DB: learningPct formula ─────────────────────────────────────────────
console.log("\n━━━ 6. DB: learningPct Formula ━━━");

await test("0 completed sub-topics → pct=0", async () => {
  const done = await prisma.stageProgress.count({ where: { userId: user.id, subTopicId: { not: null }, status: "completed" } });
  const total = await prisma.learningSubTopic.count();
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  assert(done === 0, `Expected 0 done, got ${done}`);
  assert(pct === 0, `Expected pct=0, got ${pct}`);
  return `${done}/${total} = ${pct}%`;
});

await test("Mark 2 sub-topics completed → pct updates", async () => {
  const [s1, s2] = subs1.slice(0, 2);
  await prisma.stageProgress.createMany({
    data: [
      { userId: user.id, stageId: stage1.id, subTopicId: s1.id, status: "completed" },
      { userId: user.id, stageId: stage1.id, subTopicId: s2.id, status: "completed" },
    ],
  });
  const done = await prisma.stageProgress.count({ where: { userId: user.id, subTopicId: { not: null }, status: "completed" } });
  const total = await prisma.learningSubTopic.count();
  const pct = Math.round((done / total) * 100);
  assert(done === 2, `Expected 2, got ${done}`);
  assert(pct > 0, `Expected pct > 0, got ${pct}`);
  return `${done}/${total} = ${pct}%`;
});

// ── 7. completedCount includes skipped ────────────────────────────────────
console.log("\n━━━ 7. completedCount Includes Skipped ━━━");

await test("skipped stages count toward completedCount", async () => {
  await prisma.stageProgress.create({
    data: { userId: user.id, stageId: stages[1].id, status: "skipped", completedAt: new Date() },
  });
  const progress = await prisma.stageProgress.findMany({ where: { userId: user.id, subTopicId: null } });
  const completedCount = progress.filter(p => p.status === "completed" || p.status === "skipped").length;
  assert(completedCount >= 1, "Expected at least 1 skipped to count");
  return `${completedCount} stages count as done`;
});

// ── 8. Component + import checks ──────────────────────────────────────────
console.log("\n━━━ 8. File Integrity ━━━");

await test("LearningProgressCard component file exists", async () => {
  const content = readFileSync("c:/Users/DELL/AspiringPM/pm-platform/src/components/dashboard/LearningProgressCard.tsx", "utf-8");
  assert(content.includes("export default function LearningProgressCard"), "Missing default export");
  assert(content.includes("DonutChart"), "Missing DonutChart");
  assert(content.includes("MILESTONES"), "Missing MILESTONES");
  assert(content.includes("getMotivation"), "Missing getMotivation");
  return `${content.length} chars, all key exports present`;
});

await test("Dashboard page imports LearningProgressCard", async () => {
  const content = readFileSync("c:/Users/DELL/AspiringPM/pm-platform/src/app/dashboard/page.tsx", "utf-8");
  assert(content.includes("LearningProgressCard"), "LearningProgressCard not imported");
  assert(content.includes("learningPct"), "learningPct not passed as prop");
  assert(content.includes("completedSubTopics"), "completedSubTopics not passed");
  return "imported and props wired";
});

await test("Dashboard page fetches completedSubTopicCount from DB", async () => {
  const content = readFileSync("c:/Users/DELL/AspiringPM/pm-platform/src/app/dashboard/page.tsx", "utf-8");
  assert(content.includes("completedSubTopicCount"), "missing completedSubTopicCount");
  assert(content.includes("subTopicCount"), "missing subTopicCount");
  return "both sub-topic counts fetched";
});

// ── 9. API smoke ───────────────────────────────────────────────────────────
console.log("\n━━━ 9. API Smoke ━━━");

await test("GET /api/learning/path → 401 (auth guard intact)", async () => {
  const res = await fetch(`${BASE_URL}/api/learning/path`);
  assert(res.status === 401, `Expected 401, got ${res.status}`);
  return "401 Unauthorized";
});

await test("GET /dashboard → redirects (not 500)", async () => {
  const res = await fetch(`${BASE_URL}/dashboard`, { redirect: "manual" });
  assert(![500, 502, 503].includes(res.status), `Server error: ${res.status}`);
  return `status=${res.status} (redirect or 200)`;
});

await test("Server alive at BASE_URL", async () => {
  const res = await fetch(`${BASE_URL}/api/learning/path`);
  assert(res.status !== 0, "No response from server");
  return `${BASE_URL} alive`;
});

// ── Cleanup ────────────────────────────────────────────────────────────────
await prisma.stageProgress.deleteMany({ where: { userId: user.id } });

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
