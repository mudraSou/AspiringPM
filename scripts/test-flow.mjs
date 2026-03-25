/**
 * End-to-end pipeline test — runs without a browser session.
 * Simulates: resume upload → profile → analysis pipeline → assessment generation
 */
import { readFileSync } from "fs";
import { createRequire } from "module";
import { pathToFileURL } from "url";

// Load .env
const env = readFileSync(".env", "utf-8");
for (const line of env.split("\n")) {
  const eq = line.indexOf("=");
  if (eq > 0 && !line.startsWith("#")) {
    process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^"|"$/g, "");
  }
}

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const userId = "cmn4j37bx000044txzqyq30iu";

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

// ── DB checks ───────────────────────────────────────────────────────────────
await step("DB connectivity", async () => {
  const count = await prisma.skill.count();
  return `${count} skills in DB`;
});

await step("User exists", async () => {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, onboardingStep: true } });
  if (!u) throw new Error("User not found");
  return `${u.email} | step=${u.onboardingStep}`;
});

// ── Resume text extraction ───────────────────────────────────────────────────
await step("WorkExperience record exists", async () => {
  const we = await prisma.workExperience.findFirst({ where: { userId } });
  if (!we) throw new Error("No work experience — run reset then re-run this test");
  const preview = (we.rawDescription ?? "").slice(0, 60);
  return `source=${we.source} | "${preview}..."`;
});

// ── Groq connectivity ────────────────────────────────────────────────────────
await step("Groq API reachable", async () => {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
  const res = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 10,
    messages: [{ role: "user", content: "Reply OK" }],
  });
  return res.choices[0]?.message?.content ?? "no response";
});

// ── Resume parser ────────────────────────────────────────────────────────────
const we = await prisma.workExperience.findFirst({ where: { userId } });
const resumeText = we?.rawDescription ?? "";

const parsed = await step("Resume parser (Groq)", async () => {
  const { parseResume } = await import("../src/lib/agents/resume-parser.ts");
  const result = await parseResume(resumeText.slice(0, 4000));
  if (!result.workExperiences?.length) throw new Error("No work experiences parsed");
  return `${result.workExperiences.length} experiences, name="${result.fullName}"`;
});

// ── Assessment generator ─────────────────────────────────────────────────────
await step("Assessment generator (Groq)", async () => {
  const { generateAssessmentQuestions } = await import("../src/lib/agents/assessment-generator.ts");
  const skills = await prisma.skill.findMany({ select: { id: true, name: true } });
  const allSkillNames = Object.fromEntries(skills.map(s => [s.id, s.name]));
  const questions = await generateAssessmentQuestions({
    targetPmRole: "technical",
    industry: "Technology",
    currentRole: "Senior Software Engineer",
    gapSkills: ["skill_prioritization", "skill_product_sense", "skill_stakeholder"],
    allSkillNames,
    count: 3, // small count for test speed
  });
  if (!questions.length) throw new Error("No questions generated");
  const q = questions[0];
  if (!["A","B","C","D"].includes(q.correctOptionId)) throw new Error(`Bad correctOptionId: ${q.correctOptionId}`);
  return `${questions.length} questions generated | Q1 skill=${q.skillId} correct=${q.correctOptionId}`;
});

// ── Scoring ──────────────────────────────────────────────────────────────────
await step("Assessment scoring", async () => {
  const { generateAssessmentQuestions, scoreAssessment } = await import("../src/lib/agents/assessment-generator.ts");
  const skills = await prisma.skill.findMany({ select: { id: true, name: true } });
  const allSkillNames = Object.fromEntries(skills.map(s => [s.id, s.name]));
  const questions = await generateAssessmentQuestions({
    targetPmRole: "technical", industry: "Technology", currentRole: "SWE",
    gapSkills: ["skill_prioritization"], allSkillNames, count: 2,
  });
  // Answer all correctly
  const answers = Object.fromEntries(questions.map(q => [q.id, q.correctOptionId]));
  const { score, correctCount, signals } = scoreAssessment(questions, answers);
  if (correctCount !== questions.length) throw new Error(`Expected ${questions.length} correct, got ${correctCount}`);
  return `score=${score}% | ${signals.length} signals generated`;
});

// ── Skill FK safety ──────────────────────────────────────────────────────────
await step("Skill IDs are valid (no FK hallucinations)", async () => {
  const { generateAssessmentQuestions } = await import("../src/lib/agents/assessment-generator.ts");
  const skills = await prisma.skill.findMany({ select: { id: true, name: true } });
  const allSkillNames = Object.fromEntries(skills.map(s => [s.id, s.name]));
  const validIds = new Set(skills.map(s => s.id));
  const questions = await generateAssessmentQuestions({
    targetPmRole: "general", industry: "Technology", currentRole: "SWE",
    gapSkills: [], allSkillNames, count: 3,
  });
  const invalid = questions.filter(q => !validIds.has(q.skillId));
  if (invalid.length) throw new Error(`${invalid.length} invalid skillIds: ${invalid.map(q=>q.skillId).join(", ")}`);
  return `All ${questions.length} question skillIds are valid DB IDs`;
});

console.log("\n✅ All tests passed — pipeline is functional\n");
await prisma.$disconnect();
