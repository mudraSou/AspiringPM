/**
 * Resume Optimizer Agent
 *
 * Generates JD-specific resume content from the user's master PSI entries.
 * Uses Claude Sonnet for selection logic and rewriting.
 *
 * ATS Score formula (Section 6.12):
 *   ats_score = (0.6 × keyword_match) + (0.4 × formatting_score)
 *   keyword_match = matched_keywords / total_jd_keywords × 100
 *   formatting_score is deterministic (no AI) — see calculateAtsScore()
 */

import { complete, parseJSONResponse } from "@/lib/ai/client";
import { SKILL_TAXONOMY_CONTEXT } from "./taxonomy-context";

export interface ResumeContent {
  summary: string;
  selectedEntries: Array<{
    entryId: string;
    resumePoint: string;
    included: boolean;
    reason: string;
    order: number;
  }>;
  skillsSection: string[];
  additionalBullets: string[]; // AI-generated bullets not from PSI entries
}

export interface ATSAnalysis {
  atsScore: number;
  keywordMatchScore: number;
  formattingScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

const SYSTEM_PROMPT = `You are an expert resume writer specializing in PM career transitions.

Your job is to select and arrange PSI entries to maximize relevance for a specific job description.

Rules:
1. Prioritize entries that directly match JD requirements
2. Rewrite resume bullets to mirror JD language where appropriate (without fabrication)
3. Lead with strongest, most relevant entries
4. Keep bullets concise: action verb + what + impact (max 15 words)
5. Return ONLY valid JSON

${SKILL_TAXONOMY_CONTEXT}`;

export async function optimizeResume(params: {
  psiEntries: Array<{
    id: string;
    problemStatement: string | null;
    solutionDescription: string | null;
    impactDescription: string | null;
    resumePoint: string | null;
    priority: string;
    skillTags: unknown;
  }>;
  jobDescription: string;
  extractedKeywords: string[];
  userProfile: {
    name: string;
    currentRole: string;
    yearsOfExperience: string | null;
    targetPmRole: string;
  };
}): Promise<ResumeContent> {
  const { psiEntries, jobDescription, extractedKeywords, userProfile } = params;

  const entriesText = psiEntries
    .map(
      (e, i) =>
        `Entry ID: ${e.id}
Problem: ${e.problemStatement ?? "N/A"}
Solution: ${e.solutionDescription ?? "N/A"}
Impact: ${e.impactDescription ?? "N/A"}
Current resume point: ${e.resumePoint ?? "None"}
Priority: ${e.priority}`
    )
    .join("\n\n---\n\n");

  const prompt = `Select and optimize resume entries for this job application.

JD Keywords to target: ${extractedKeywords.join(", ")}

Job Description:
${jobDescription.slice(0, 2000)}

Candidate: ${userProfile.name}
Current Role: ${userProfile.currentRole}
Experience: ${userProfile.yearsOfExperience ?? "Not specified"}
Target PM Role: ${userProfile.targetPmRole}

Available PSI Entries:
${entriesText}

Return JSON:
{
  "summary": "3-4 sentence professional summary tailored to this JD",
  "selectedEntries": [
    {
      "entryId": "entry id",
      "resumePoint": "Optimized resume bullet (max 15 words, past tense, action verb first)",
      "included": true|false,
      "reason": "Why this was included or excluded",
      "order": 1 (ordering within the resume)
    }
  ],
  "skillsSection": ["PM-relevant skills to list, matching JD language"],
  "additionalBullets": ["Any 1-2 additional bullets if critical gaps exist (must be grounded in their experience)"]
}

Include the top 6-8 most relevant entries. Exclude low-relevance entries. Order by relevance to JD.
Return ONLY the JSON.`;

  const response = await complete(prompt, {
    model: "gpt",
    system: SYSTEM_PROMPT,
    maxTokens: 3000,
    temperature: 0.1,   // lower = more consistent entry selection across regenerations
    timeoutMs: 90000,   // resume generation is a large prompt — needs extra time
  });

  return parseJSONResponse<ResumeContent>(response.text);
}

/**
 * Extract keywords from a job description.
 * Uses GPT-4o-mini (fast, cheap).
 */
export async function extractJDKeywords(jobDescription: string): Promise<string[]> {
  const prompt = `Extract the most important keywords from this PM job description.
Focus on: skills, tools, methodologies, domain-specific terms.
Exclude generic words like "team", "work", "experience".

Job Description:
${jobDescription.slice(0, 3000)}

Return JSON array of strings:
["keyword1", "keyword2", ...]

Return ONLY the JSON array.`;

  const { complete: completeAI } = await import("@/lib/ai/client");
  const response = await completeAI(prompt, {
    model: "gpt",
    maxTokens: 500,
    temperature: 0.1,
  });

  return parseJSONResponse<string[]>(response.text);
}

/**
 * Calculate ATS score deterministically — no AI involved.
 * Formula: 0.6 × keyword_match + 0.4 × formatting_score
 */
export function calculateAtsScore(
  resumeText: string,
  jdKeywords: string[]
): ATSAnalysis {
  const resumeLower = resumeText.toLowerCase();

  // Keyword match score
  const matchedKeywords = jdKeywords.filter((kw) =>
    resumeLower.includes(kw.toLowerCase())
  );
  const keywordMatchScore =
    jdKeywords.length > 0
      ? Math.round((matchedKeywords.length / jdKeywords.length) * 100)
      : 0;
  const missingKeywords = jdKeywords.filter(
    (kw) => !resumeLower.includes(kw.toLowerCase())
  );

  // Formatting score (deterministic heuristics)
  let formattingScore = 100;

  // Penalize if no action verbs at start of bullets
  const bulletLines = resumeText.split("\n").filter((l) => l.trim().startsWith("•") || l.trim().startsWith("-"));
  const actionVerbs = ["led", "built", "designed", "improved", "launched", "managed", "created", "reduced", "increased", "developed", "implemented", "drove", "delivered", "owned", "collaborated"];
  const linesWithActionVerbs = bulletLines.filter((line) =>
    actionVerbs.some((v) => line.toLowerCase().includes(v))
  );
  if (bulletLines.length > 0) {
    const actionVerbRatio = linesWithActionVerbs.length / bulletLines.length;
    if (actionVerbRatio < 0.5) formattingScore -= 20;
  }

  // Penalize if resume is very short
  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount < 200) formattingScore -= 20;
  if (wordCount > 1000) formattingScore -= 10; // Too long

  // Penalize if no dates found (formatting issue)
  const datePattern = /\b(20\d{2}|19\d{2})\b/;
  if (!datePattern.test(resumeText)) formattingScore -= 15;

  formattingScore = Math.max(0, Math.min(100, formattingScore));

  const atsScore = Math.round(0.6 * keywordMatchScore + 0.4 * formattingScore);

  return {
    atsScore,
    keywordMatchScore,
    formattingScore,
    matchedKeywords,
    missingKeywords,
  };
}
