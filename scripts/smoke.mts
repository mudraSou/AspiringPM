import { complete, parseJSONResponse } from "../src/lib/ai/client";
import { generateAssessmentQuestions, scoreAssessment } from "../src/lib/agents/assessment-generator";
import { prisma } from "../src/lib/db/prisma";

const userId = "cmn4j37bx000044txzqyq30iu";

async function test(label: string, fn: () => Promise<string>) {
  process.stdout.write(`[TEST] ${label}... `);
  try {
    console.log("✓", await fn());
  } catch (e) {
    console.log("✗ FAILED:", (e as Error).message);
    process.exit(1);
  }
}

// 1. DB
await test("DB: skills loaded", async () => {
  const n = await prisma.skill.count();
  return `${n} skills`;
});

// 2. DB: user state
await test("DB: user state", async () => {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { onboardingStep: true, targetPmRole: true } });
  return `step=${u?.onboardingStep} role=${u?.targetPmRole}`;
});

// 3. Groq basic call
await test("Groq: basic call", async () => {
  const r = await complete("Reply with the word OK only.", { model: "gpt", maxTokens: 10, timeoutMs: 20000 });
  return r.text.trim();
});

// 4. Assessment generation
await test("Assessment: generate 3 questions", async () => {
  const skills = await prisma.skill.findMany({ select: { id: true, name: true } });
  const allSkillNames = Object.fromEntries(skills.map((s) => [s.id, s.name]));
  const qs = await generateAssessmentQuestions({
    targetPmRole: "technical",
    industry: "Technology",
    currentRole: "Software Engineer",
    gapSkills: ["skill_prioritization", "skill_product_sense", "skill_stakeholder"],
    allSkillNames,
    count: 3,
  });
  if (!qs.length) throw new Error("No questions returned");
  const validIds = new Set(skills.map((s) => s.id));
  const bad = qs.filter((q) => !validIds.has(q.skillId));
  if (bad.length) throw new Error(`Invalid skillIds: ${bad.map((q) => q.skillId).join(", ")}`);
  return `${qs.length} questions | skills: ${qs.map((q) => q.skillId).join(", ")}`;
});

// 5. Assessment scoring
await test("Assessment: scoring", async () => {
  const skills = await prisma.skill.findMany({ select: { id: true, name: true } });
  const allSkillNames = Object.fromEntries(skills.map((s) => [s.id, s.name]));
  const qs = await generateAssessmentQuestions({
    targetPmRole: "technical", industry: "Technology", currentRole: "SWE",
    gapSkills: ["skill_metrics"], allSkillNames, count: 2,
  });
  const allCorrect = Object.fromEntries(qs.map((q) => [q.id, q.correctOptionId]));
  const allWrong = Object.fromEntries(qs.map((q) => [q.id, q.options.find((o) => o.id !== q.correctOptionId)!.id]));
  const s1 = scoreAssessment(qs, allCorrect);
  const s2 = scoreAssessment(qs, allWrong);
  return `100% correct → score=${s1.score} | 0% correct → score=${s2.score}`;
});

// 6. Groq JSON parse
await test("Groq: JSON response parsing", async () => {
  const r = await complete(
    'Return ONLY this JSON: {"status":"ok","count":42}',
    { model: "gpt", maxTokens: 50, temperature: 0, timeoutMs: 20000 }
  );
  const j = parseJSONResponse<{ status: string; count: number }>(r.text);
  if (j.status !== "ok") throw new Error(`Unexpected status: ${j.status}`);
  return `parsed ok, count=${j.count}`;
});

console.log("\n✅ All tests passed\n");
await prisma.$disconnect();
