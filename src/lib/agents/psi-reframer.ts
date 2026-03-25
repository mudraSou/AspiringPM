/**
 * PSI Reframer Agent
 *
 * Converts raw work experience descriptions into Problem → Solution → Impact format.
 * Uses Claude Sonnet (complex reasoning, nuanced reframing).
 *
 * CRITICAL RULE: Never fabricates metrics.
 * Inferred metrics are marked with [ESTIMATED — verify with user].
 * Always returns structured JSON.
 */

import { complete, parseJSONResponse } from "@/lib/ai/client";
import { SKILL_TAXONOMY_CONTEXT } from "./taxonomy-context";

export interface PSIEntry {
  problemStatement: string;
  solutionDescription: string;
  impactDescription: string;
  impactMetrics: Record<string, string> | null;
  resumePoint: string;
  skillTags: string[]; // skill IDs from taxonomy
  priority: "high" | "medium" | "low";
  hasEstimatedMetrics: boolean;
}

const SYSTEM_PROMPT = `You are an expert PM career coach who helps professionals reframe their work experience in product management language.

Your job is to convert raw job descriptions into PSI (Problem → Solution → Impact) format.

CRITICAL RULES:
1. NEVER fabricate metrics. If a metric is not stated, mark it as [ESTIMATED — verify with user]
2. Always identify the BUSINESS PROBLEM the person was solving, not just the technical task
3. Frame solutions in terms of user/business value, not technical implementation
4. Be specific — vague phrases like "improved performance" are not acceptable without context
5. Return ONLY valid JSON, no other text

${SKILL_TAXONOMY_CONTEXT}`;

export async function reframeExperience(
  workExperience: {
    companyName: string;
    roleTitle: string;
    rawDescription: string;
    startDate: string | null;
    endDate: string | null;
  },
  userContext: {
    industry: string;
    targetPmRole: string;
  }
): Promise<PSIEntry[]> {
  const prompt = `Reframe this work experience into PSI (Problem → Solution → Impact) format for a PM job application.

Work Experience:
- Company: ${workExperience.companyName}
- Role: ${workExperience.roleTitle}
- Period: ${workExperience.startDate ?? "Unknown"} to ${workExperience.endDate ?? "Present"}
- Description:
${workExperience.rawDescription}

User Context:
- Industry: ${userContext.industry}
- Target PM Role: ${userContext.targetPmRole}

Extract 1-3 distinct PSI entries from this experience. Each entry should represent a meaningful project or initiative.

Return a JSON array:
[
  {
    "problemStatement": "The business/user problem that needed solving (1-2 sentences). Focus on WHO was affected and WHAT they couldn't do.",
    "solutionDescription": "What was built/done to solve the problem (2-3 sentences). Focus on the approach and why it was chosen, not just the output.",
    "impactDescription": "The measurable or observable outcome (1-2 sentences). Use numbers if present in the original, otherwise describe qualitative impact.",
    "impactMetrics": {
      "metric_name": "value or [ESTIMATED — verify with user]"
    },
    "resumePoint": "A single-line resume bullet point (max 15 words) combining problem + solution + impact. Past tense. Action verb first.",
    "skillTags": ["skill_id_1", "skill_id_2"],
    "priority": "high|medium|low",
    "hasEstimatedMetrics": true|false
  }
]

For skillTags, use ONLY the skill IDs from the taxonomy provided. Choose 2-5 most relevant skills per entry.

For priority:
- high: Clear PM-relevant ownership, significant impact, well-articulated outcome
- medium: Some PM-relevant elements, moderate impact
- low: Mostly technical with limited PM-relevant framing

Return ONLY the JSON array.`;

  const response = await complete(prompt, {
    model: "gpt",
    maxTokens: 2000,
    system: SYSTEM_PROMPT,
    temperature: 0.3,
    timeoutMs: 45000,
  });

  return parseJSONResponse<PSIEntry[]>(response.text);
}

/**
 * Reframe multiple experiences in parallel.
 * Called after resume parsing.
 */
export async function reframeAllExperiences(
  experiences: Array<{
    companyName: string;
    roleTitle: string;
    rawDescription: string;
    startDate: string | null;
    endDate: string | null;
  }>,
  userContext: { industry: string; targetPmRole: string }
): Promise<Array<{ experienceIndex: number; entries: PSIEntry[] }>> {
  const results = await Promise.all(
    experiences.map(async (exp, index) => {
      try {
        const entries = await reframeExperience(exp, userContext);
        return { experienceIndex: index, entries };
      } catch (error) {
        console.error(`PSI reframing failed for experience ${index}:`, error);
        return { experienceIndex: index, entries: [] };
      }
    })
  );
  return results;
}
