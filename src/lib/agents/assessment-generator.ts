/**
 * Assessment Generator Agent
 *
 * Generates medium-difficulty MCQ questions targeting the user's skill gaps.
 * Questions are PM scenario-based, 4 options each, one correct answer.
 * Correct answers are stored server-side only — never sent to the client.
 */

import { complete, parseJSONResponse } from "@/lib/ai/client";
import { SKILL_TAXONOMY_CONTEXT } from "./taxonomy-context";

export interface MCQOption {
  id: "A" | "B" | "C" | "D";
  text: string;
}

export interface MCQQuestion {
  id: string;
  skillId: string;
  skillName: string;
  question: string;
  options: MCQOption[];
  correctOptionId: "A" | "B" | "C" | "D";
  explanation: string;
}

// Client-safe version — no correct answer exposed
export type MCQQuestionPublic = Omit<MCQQuestion, "correctOptionId" | "explanation">;

const SYSTEM_PROMPT = `You are a PM interview assessment designer creating medium-difficulty scenario-based MCQ questions.

DIFFICULTY GUIDELINES (medium):
- Assume the candidate has 2-5 years of work experience but limited PM-specific training
- Questions should require reasoning, not just recall
- Avoid trick questions — one option should be clearly best
- Use realistic workplace scenarios
- Avoid jargon without context

QUESTION DESIGN RULES:
1. Each question presents a realistic PM scenario (2-4 sentences of context)
2. Exactly 4 options (A, B, C, D) — all plausible, one clearly best
3. Wrong options should represent common mistakes or misconceptions, not obviously wrong
4. Correct answer should reward PM thinking (user/business focus, data-driven, structured)
5. Explanation should be concise (1-2 sentences) saying WHY the correct answer is best

${SKILL_TAXONOMY_CONTEXT}`;

export async function generateAssessmentQuestions(params: {
  targetPmRole: string;
  industry: string;
  currentRole: string;
  gapSkills: string[];
  allSkillNames: Record<string, string>; // skillId → skillName
  count?: number;
}): Promise<MCQQuestion[]> {
  const { targetPmRole, industry, currentRole, gapSkills, allSkillNames, count = 8 } = params;

  // Prioritise gap skills, pad with other important skills if needed
  const importantSkills = [
    "skill_prioritization", "skill_metrics", "skill_problem_framing",
    "skill_product_sense", "skill_stakeholder", "skill_data_decisions",
    "skill_tradeoff", "skill_roadmap",
  ];
  const targetSkills = [
    ...gapSkills.slice(0, 5),
    ...importantSkills.filter((s) => !gapSkills.includes(s)),
  ].slice(0, count);

  const skillList = targetSkills
    .map((id) => `- ${id}: ${allSkillNames[id] ?? id}`)
    .join("\n");

  const prompt = `Generate exactly ${count} medium-difficulty PM assessment questions for the following candidate.

Candidate Context:
- Current Role: ${currentRole}
- Industry: ${industry}
- Target PM Role: ${targetPmRole} PM

Target these skills (in priority order):
${skillList}

Generate one question per skill. Each question must be a realistic scenario this candidate would face as a ${targetPmRole} PM.

Return a JSON array:
[
  {
    "skillId": "skill_xxx",
    "skillName": "Human-readable skill name",
    "question": "Scenario description (2-4 sentences) followed by a clear question.",
    "options": [
      { "id": "A", "text": "Option text" },
      { "id": "B", "text": "Option text" },
      { "id": "C", "text": "Option text" },
      { "id": "D", "text": "Option text" }
    ],
    "correctOptionId": "A|B|C|D",
    "explanation": "1-2 sentences explaining why this is the best answer and what the wrong options miss."
  }
]

Return ONLY the JSON array.`;

  const response = await complete(prompt, {
    model: "gpt",
    maxTokens: 3000,
    system: SYSTEM_PROMPT,
    temperature: 0.5,
    timeoutMs: 45000,
  });

  const raw = parseJSONResponse<MCQQuestion[]>(response.text);

  // Assign stable IDs and validate structure
  return raw
    .filter(
      (q) =>
        q.skillId &&
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        ["A", "B", "C", "D"].includes(q.correctOptionId)
    )
    .map((q, i) => ({
      ...q,
      id: `q_${i + 1}`,
    }));
}

/**
 * Score assessment answers and return conversation signals for gap analysis.
 */
export function scoreAssessment(
  questions: MCQQuestion[],
  answers: Record<string, string> // questionId → selectedOptionId
): {
  score: number; // 0-100
  correctCount: number;
  signals: Array<{ skillId: string; signal: string; strength: "strong" | "moderate" | "weak" }>;
  breakdown: Array<{ questionId: string; skillId: string; correct: boolean; explanation: string }>;
} {
  const breakdown = questions.map((q) => ({
    questionId: q.id,
    skillId: q.skillId,
    correct: answers[q.id] === q.correctOptionId,
    explanation: q.explanation,
  }));

  const correctCount = breakdown.filter((b) => b.correct).length;
  const score = Math.round((correctCount / questions.length) * 100);

  const signals = breakdown.map((b) => ({
    skillId: b.skillId,
    signal: b.correct
      ? `Answered correctly in scenario assessment`
      : `Answered incorrectly in scenario assessment`,
    strength: (b.correct ? "strong" : "weak") as "strong" | "weak",
  }));

  return { score, correctCount, signals, breakdown };
}
