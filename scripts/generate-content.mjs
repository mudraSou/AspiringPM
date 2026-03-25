/**
 * Learning Module Content Generator — Phase 1
 *
 * Generates AI learning modules for sub-topics using Groq.
 * Each module has 3 sections: Overview, Key Concepts, PM Application.
 *
 * Usage:
 *   node scripts/generate-content.mjs            # generates 5 at a time (default)
 *   node scripts/generate-content.mjs --limit 10  # generate 10
 *   node scripts/generate-content.mjs --all       # generate all remaining
 *   node scripts/generate-content.mjs --stage 1   # only stage 1 sub-topics
 *   node scripts/generate-content.mjs --reset     # clear all generated content
 */
import { readFileSync } from "fs";
import { createRequire } from "module";

// Load .env
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
const OpenAI = require("c:/Users/DELL/AspiringPM/pm-platform/node_modules/openai").default;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });

// Parse CLI args
const args = process.argv.slice(2);
const limitArg = args.indexOf("--limit");
const stageArg = args.indexOf("--stage");
const LIMIT = args.includes("--all") ? 999 : limitArg >= 0 ? parseInt(args[limitArg + 1]) : 5;
const STAGE_FILTER = stageArg >= 0 ? parseInt(args[stageArg + 1]) : null;
const RESET = args.includes("--reset");

// ── Reset mode ────────────────────────────────────────────────────────────────
if (RESET) {
  const count = await prisma.learningSubTopic.updateMany({
    data: { generatedContent: null, contentGeneratedAt: null },
  });
  console.log(`Reset ${count.count} sub-topics.`);
  await prisma.$disconnect();
  process.exit(0);
}

// ── Fetch sub-topics needing content ─────────────────────────────────────────
const where = {
  generatedContent: null,
  ...(STAGE_FILTER ? { stage: { orderIndex: STAGE_FILTER } } : {}),
};

const subTopics = await prisma.learningSubTopic.findMany({
  where,
  include: { stage: { select: { name: true, orderIndex: true, description: true } } },
  orderBy: [{ stage: { orderIndex: "asc" } }, { orderIndex: "asc" }],
  take: LIMIT,
});

if (!subTopics.length) {
  console.log("✅ All sub-topics already have generated content.");
  await prisma.$disconnect();
  process.exit(0);
}

const total = await prisma.learningSubTopic.count({ where: { generatedContent: null } });
console.log(`\nGenerating content for ${subTopics.length} sub-topics (${total} remaining total)\n`);

// ── Generator ─────────────────────────────────────────────────────────────────
async function generateModule(subTopic) {
  const prompt = `You are an expert PM coach writing a concise learning module for aspiring Product Managers.

Topic: "${subTopic.name}"
Stage: "${subTopic.stage.name}" — ${subTopic.stage.description ?? ""}
Sub-topic description: ${subTopic.description ?? subTopic.name}

Write a learning module with EXACTLY these 3 sections in markdown. Be specific, practical, and PM-focused. No fluff.

## Overview
2-3 paragraphs explaining what this topic is and why it matters for PMs. Use real-world context.

## Key Concepts
5-7 bullet points. Each bullet: **Concept Name** — 1-2 sentence explanation with a concrete example.

## PM Application
3-4 bullet points showing exactly how a PM uses this in their day-to-day work. Frame as actions: "When X happens, a PM should Y..."

Keep total length under 500 words. Write for someone transitioning from a non-PM role.`;

  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  let lastErr;

  for (const model of models) {
    try {
      const res = await groq.chat.completions.create({
        model,
        max_tokens: 1000,
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }],
      });
      return res.choices[0]?.message?.content ?? "";
    } catch (err) {
      if (err?.status === 429) { lastErr = err; continue; }
      throw err;
    }
  }
  throw lastErr;
}

// ── Main loop ─────────────────────────────────────────────────────────────────
let succeeded = 0;
let failed = 0;

for (const st of subTopics) {
  process.stdout.write(`  Stage ${st.stage.orderIndex} / ${st.stage.name} → "${st.name}"... `);
  try {
    const content = await generateModule(st);
    await prisma.learningSubTopic.update({
      where: { id: st.id },
      data: { generatedContent: content, contentGeneratedAt: new Date() },
    });
    console.log(`✓ (${content.length} chars)`);
    succeeded++;
    // Small delay to avoid hitting RPM limits
    await new Promise(r => setTimeout(r, 1500));
  } catch (err) {
    console.log(`✗ FAILED: ${err.message}`);
    failed++;
  }
}

const remaining = await prisma.learningSubTopic.count({ where: { generatedContent: null } });
console.log(`\n✅ Done — ${succeeded} generated, ${failed} failed, ${remaining} remaining\n`);
if (remaining > 0) console.log(`Run again to continue: node scripts/generate-content.mjs\n`);

await prisma.$disconnect();
