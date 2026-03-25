/**
 * Assignment Evaluator Agent
 *
 * Evaluates stage gate assignment submissions against rubrics.
 * Uses Claude Sonnet (complex reasoning required).
 * Returns structured JSON with score + criterion-level feedback.
 */

import { complete, parseJSONResponse } from "@/lib/ai/client";
import { SKILL_TAXONOMY_CONTEXT } from "./taxonomy-context";

export interface AssignmentEvaluation {
  totalScore: number; // 0-100
  passed: boolean;    // score >= passingScore
  overallFeedback: string;
  criteriaResults: Array<{
    criterion: string;
    score: number;        // 0 to criterion weight
    maxScore: number;     // criterion weight
    met: boolean;
    feedback: string;
  }>;
  strengths: string[];  // 2-3 things done well
  improvements: string[]; // 2-3 things to improve
}

const SYSTEM_PROMPT = `You are a PM hiring manager evaluating assignment submissions from PM candidates.

Your evaluation must be:
- Honest and specific — no generic praise
- Constructive — every critique should come with guidance
- Fair — evaluate against the rubric, not your personal preference
- Consistent — the same quality work should get the same score

${SKILL_TAXONOMY_CONTEXT}`;

export async function evaluateAssignment(params: {
  assignmentPrompt: string;
  rubric: Array<{ name: string; weight: number; description: string }>;
  submission: string;
  passingScore: number;
  userContext?: {
    targetPmRole: string;
    industry: string;
  };
}): Promise<AssignmentEvaluation> {
  const { assignmentPrompt, rubric, submission, passingScore, userContext } = params;

  const rubricText = rubric
    .map((r) => `- ${r.name} (${r.weight} points): ${r.description}`)
    .join("\n");

  const prompt = `Evaluate this PM assignment submission.

ASSIGNMENT:
${assignmentPrompt}

RUBRIC (total: ${rubric.reduce((sum, r) => sum + r.weight, 0)} points, passing: ${passingScore}):
${rubricText}

${userContext ? `Candidate Context: Target role: ${userContext.targetPmRole}, Industry: ${userContext.industry}` : ""}

SUBMISSION:
${submission}

Evaluate the submission against each rubric criterion. Be specific in your feedback — reference actual text from the submission.

Return JSON:
{
  "totalScore": 0-100,
  "passed": true|false,
  "overallFeedback": "2-3 sentence summary of the submission quality",
  "criteriaResults": [
    {
      "criterion": "criterion name",
      "score": points earned,
      "maxScore": max points for this criterion,
      "met": true|false,
      "feedback": "Specific feedback referencing the submission"
    }
  ],
  "strengths": ["What they did well (specific)", "..."],
  "improvements": ["What to improve (specific and actionable)", "..."]
}

Return ONLY the JSON.`;

  const response = await complete(prompt, {
    model: "gpt",
    system: SYSTEM_PROMPT,
    maxTokens: 2000,
    temperature: 0.3,
  });

  const result = parseJSONResponse<AssignmentEvaluation>(response.text);
  result.passed = result.totalScore >= passingScore;
  return result;
}
