/**
 * Question Evaluator Agent
 *
 * Evaluates answers to PM interview questions.
 * Uses Claude Sonnet.
 */

import { complete, parseJSONResponse } from "@/lib/ai/client";
import { SKILL_TAXONOMY_CONTEXT } from "./taxonomy-context";

export interface QuestionEvaluation {
  score: number; // 0-100
  overallFeedback: string;
  criteriaResults: Array<{
    criterion: string;
    met: boolean;
    comment: string;
  }>;
  strengths: string[];
  improvements: string[];
  modelAnswerHints: string[];
}

const SYSTEM_PROMPT = `You are a PM interviewer evaluating candidate answers.

Be direct and honest. Do not be overly generous.
Specific feedback > generic feedback.
Always identify what was missing, not just what was done well.

${SKILL_TAXONOMY_CONTEXT}`;

export async function evaluateQuestionAnswer(params: {
  questionText: string;
  evaluationCriteria: Array<{ criterion: string; weight: number }>;
  minExpectations: string | null;
  sampleAnswerPoints: unknown;
  answer: string;
}): Promise<QuestionEvaluation> {
  const { questionText, evaluationCriteria, minExpectations, sampleAnswerPoints, answer } = params;

  const criteriaText = evaluationCriteria
    .map((c) => `- ${c.criterion} (${c.weight} pts)`)
    .join("\n");

  const prompt = `Evaluate this PM interview answer.

Question: ${questionText}

Evaluation Criteria:
${criteriaText}

Minimum Expectations: ${minExpectations ?? "Not specified"}

Key Answer Points (what a good answer covers):
${JSON.stringify(sampleAnswerPoints, null, 2)}

Candidate's Answer:
${answer}

Return JSON:
{
  "score": 0-100,
  "overallFeedback": "2-3 sentence assessment",
  "criteriaResults": [
    {
      "criterion": "criterion name",
      "met": true|false,
      "comment": "Specific feedback"
    }
  ],
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "improvements": ["Specific improvement 1", "Specific improvement 2"],
  "modelAnswerHints": ["Key point they missed 1", "Key point they missed 2"]
}

Return ONLY the JSON.`;

  const response = await complete(prompt, {
    model: "gpt",
    system: SYSTEM_PROMPT,
    maxTokens: 1500,
    temperature: 0.3,
  });

  return parseJSONResponse<QuestionEvaluation>(response.text);
}
