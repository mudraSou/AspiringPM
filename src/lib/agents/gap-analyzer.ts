/**
 * Gap Analyzer Agent
 *
 * Maps extracted PSI entries and conversation signals against the skill taxonomy.
 * Calculates per-skill evidence scores and identifies gaps.
 * Stores every run as a ReadinessSnapshot — never overwrites.
 *
 * Score formula (from Section 9.1):
 *   per_skill = (0.5 × evidence_score) + (0.3 × assignment_score) + (0.2 × learning_score)
 *   per_category = average of skill scores in category
 *   overall = Σ(category_score × role_weight)
 */

import { complete, parseJSONResponse } from "@/lib/ai/client";
import { SKILL_TAXONOMY_CONTEXT } from "./taxonomy-context";
import { prisma } from "@/lib/db/prisma";

export interface SkillEvaluation {
  skillId: string;
  evidenceScore: number; // 0-100
  evidenceJustification: string;
}

export interface GapAnalysisResult {
  skillEvaluations: SkillEvaluation[];
  topStrengths: string[]; // skill IDs
  topGaps: string[];      // skill IDs
  gapFillQuestions: string[]; // suggested questions for conversation agent
}

// Evidence score tiers for reference (used in prompts, not code)
// QUANTIFIED: 90, QUALITATIVE: 70, NO_IMPACT: 50, SELF_REPORT: 30, NONE: 0

const SYSTEM_PROMPT = `You are a PM skills evaluator. Analyze a candidate's work experience and assign evidence scores for each PM skill.

Scoring guide:
- 80-100: Quantified PSI entry with clear metrics (e.g., "reduced time by 40%", "onboarded 3 clients")
- 60-79: Qualitative PSI entry with clear impact statement
- 40-59: PSI entry present but no clear impact described
- 20-39: Only self-reported in conversation, no documented evidence
- 0-19: No evidence found

${SKILL_TAXONOMY_CONTEXT}`;

export async function analyzeGaps(params: {
  userId: string;
  psiEntries: Array<{
    problemStatement: string | null;
    solutionDescription: string | null;
    impactDescription: string | null;
    impactMetrics: unknown;
    skillTags: unknown;
  }>;
  conversationSignals: string | null;
  targetPmRole: string;
  triggeredBy: "manual" | "stage_completion" | "onboarding";
}): Promise<{ snapshot: { id: string; overallScore: number }; result: GapAnalysisResult }> {
  const { userId, psiEntries, conversationSignals, targetPmRole, triggeredBy } = params;

  // Build context for the AI
  const experienceContext = psiEntries
    .map(
      (e, i) =>
        `Entry ${i + 1}:
Problem: ${e.problemStatement ?? "Not specified"}
Solution: ${e.solutionDescription ?? "Not specified"}
Impact: ${e.impactDescription ?? "Not specified"}
Skills tagged: ${JSON.stringify(e.skillTags)}`
    )
    .join("\n\n");

  const prompt = `Evaluate this PM candidate's evidence for each skill in the taxonomy.

Work Experiences (PSI format):
${experienceContext || "No PSI entries yet"}

${conversationSignals ? `Conversation Signals:\n${conversationSignals}` : ""}

Target PM Role: ${targetPmRole}

For EACH skill ID in the taxonomy, assign:
1. An evidence score (0-100) based on the scoring guide
2. A 1-sentence justification

Also identify:
- Top 3 strength skills (highest evidence)
- Top 3 gap skills (lowest evidence, but most important for ${targetPmRole})
- 3-5 gap-filling questions to ask the user in conversation (specific to their actual experiences)

Return JSON:
{
  "skillEvaluations": [
    {
      "skillId": "skill_xxx",
      "evidenceScore": 0-100,
      "evidenceJustification": "1-sentence explanation"
    }
  ],
  "topStrengths": ["skill_id_1", "skill_id_2", "skill_id_3"],
  "topGaps": ["skill_id_1", "skill_id_2", "skill_id_3"],
  "gapFillQuestions": [
    "Specific question referencing their actual experience...",
    ...
  ]
}

Return ONLY the JSON.`;

  const response = await complete(prompt, {
    model: "gpt",
    maxTokens: 3000,
    system: SYSTEM_PROMPT,
    temperature: 0.2,
    timeoutMs: 45000,
  });

  const rawResult = parseJSONResponse<GapAnalysisResult>(response.text);

  // Load valid skill IDs from DB — filter out any hallucinated IDs from the AI
  const validSkills = await prisma.skill.findMany({ select: { id: true } });
  const validSkillIds = new Set(validSkills.map((s) => s.id));

  const result: GapAnalysisResult = {
    skillEvaluations: Array.isArray(rawResult.skillEvaluations)
      ? rawResult.skillEvaluations.filter(
          (ev) => ev?.skillId && validSkillIds.has(ev.skillId)
        )
      : [],
    topStrengths: Array.isArray(rawResult.topStrengths)
      ? rawResult.topStrengths.filter((id) => validSkillIds.has(id))
      : [],
    topGaps: Array.isArray(rawResult.topGaps)
      ? rawResult.topGaps.filter((id) => validSkillIds.has(id))
      : [],
    gapFillQuestions: Array.isArray(rawResult.gapFillQuestions)
      ? rawResult.gapFillQuestions
      : [],
  };

  // Calculate scores using the formula from Section 9.1
  const skillScoreMap: Record<string, number> = {};
  for (const ev of result.skillEvaluations) {
    skillScoreMap[ev.skillId] = ev.evidenceScore;
  }

  // Get role weights from DB
  const roleWeights = await prisma.roleSkillWeight.findMany({
    where: { pmRoleType: targetPmRole },
    include: { skillCategory: { include: { skills: true } } },
  });

  // Get existing assignment and learning scores for this user
  const existingScores = await prisma.userSkillScore.findMany({
    where: { userId },
    select: { skillId: true, assignmentScore: true, learningScore: true },
  });
  type ScoreEntry = { skillId: string; assignmentScore: number; learningScore: number };
  const existingScoreMap = new Map<string, ScoreEntry>();
  for (const s of existingScores) existingScoreMap.set(s.skillId, s);

  // Calculate overall readiness score
  let overallScore = 0;
  const categoryScores: Record<string, number> = {};

  for (const rw of roleWeights) {
    const categorySkills = rw.skillCategory.skills;
    if (categorySkills.length === 0) continue;

    let categoryTotal = 0;
    for (const skill of categorySkills) {
      const evidenceScore = skillScoreMap[skill.id] ?? 0;
      const existing = existingScoreMap.get(skill.id);
      const assignmentScore = existing?.assignmentScore ?? 0;
      const learningScore = existing?.learningScore ?? 0;

      // Formula: 0.5 × evidence + 0.3 × assignment + 0.2 × learning
      const skillScore =
        0.5 * evidenceScore + 0.3 * assignmentScore + 0.2 * learningScore;
      categoryTotal += skillScore;
    }

    const categoryScore = categoryTotal / categorySkills.length;
    const categoryKey = rw.skillCategory.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");
    categoryScores[categoryKey] = Math.round(categoryScore);
    overallScore += categoryScore * Number(rw.weight);
  }

  const finalScore = Math.round(overallScore);

  // Save readiness snapshot
  const snapshot = await prisma.readinessSnapshot.create({
    data: {
      userId,
      overallScore: finalScore,
      categoryScores,
      targetRole: targetPmRole,
      triggeredBy,
    },
  });

  // Upsert skill scores — each wrapped individually so one bad ID doesn't kill the batch
  await Promise.all(
    result.skillEvaluations.map((ev) =>
      prisma.userSkillScore.upsert({
        where: { userId_skillId: { userId, skillId: ev.skillId } },
        update: {
          evidenceScore: ev.evidenceScore,
          evidenceJustification: ev.evidenceJustification,
          overallScore: Math.round(
            0.5 * ev.evidenceScore +
              0.3 * (existingScoreMap.get(ev.skillId)?.assignmentScore ?? 0) +
              0.2 * (existingScoreMap.get(ev.skillId)?.learningScore ?? 0)
          ),
          lastEvaluatedAt: new Date(),
        },
        create: {
          userId,
          skillId: ev.skillId,
          evidenceScore: ev.evidenceScore,
          evidenceJustification: ev.evidenceJustification,
          assignmentScore: 0,
          learningScore: 0,
          overallScore: Math.round(0.5 * ev.evidenceScore),
        },
      }).catch((err: unknown) => {
        console.warn(`Skipping skill score upsert for ${ev.skillId}:`, (err as Error).message);
      })
    )
  );

  return { snapshot: { id: snapshot.id, overallScore: finalScore }, result };
}
