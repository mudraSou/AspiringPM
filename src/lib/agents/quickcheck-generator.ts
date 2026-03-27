/**
 * Quick Check MCQ Generator
 * Generates 3 fresh MCQ questions per sub-topic attempt.
 * Questions are always new — never reused across attempts.
 */

import { complete, parseJSONResponse } from "@/lib/ai/client";

export interface QCOption {
  id: "A" | "B" | "C" | "D";
  text: string;
}

export interface QCQuestion {
  id: string;
  question: string;
  options: QCOption[];
  correctOptionId: "A" | "B" | "C" | "D";
  explanation: string;
}

export type QCQuestionPublic = Omit<QCQuestion, "correctOptionId" | "explanation">;

export async function generateQuickCheckMCQ(params: {
  subTopicName: string;
  stageName: string;
  subTopicDescription: string | null;
  attemptNumber: number;
}): Promise<QCQuestion[]> {
  const { subTopicName, stageName, subTopicDescription, attemptNumber } = params;

  const prompt = `Generate 3 multiple choice questions to test understanding of "${subTopicName}" (part of the "${stageName}" module in a PM career prep course).

${subTopicDescription ? `Context: ${subTopicDescription}` : ""}
Attempt number: ${attemptNumber} — make these questions DIFFERENT from previous attempts. Vary the angle, difficulty, and concepts tested.

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": [
        {"id": "A", "text": "Option A text"},
        {"id": "B", "text": "Option B text"},
        {"id": "C", "text": "Option C text"},
        {"id": "D", "text": "Option D text"}
      ],
      "correctOptionId": "B",
      "explanation": "Brief explanation of why B is correct (1-2 sentences)."
    }
  ]
}

Rules:
- Questions must be practical and PM-relevant, not trivia
- Medium difficulty — a thoughtful beginner should get 1-2 right without study
- Each question tests a distinct concept from the sub-topic
- Distractors must be plausible, not obviously wrong
- Keep questions under 25 words, options under 15 words each`;

  const response = await complete(prompt, {
    model: "gpt",
    maxTokens: 1000,
    temperature: 0.7,
    timeoutMs: 30000,
  });

  const parsed = parseJSONResponse<{ questions: QCQuestion[] }>(response.text);

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("No questions returned from MCQ generator");
  }

  // Validate structure
  const valid = parsed.questions.filter(
    (q) =>
      q.id && q.question && Array.isArray(q.options) &&
      q.options.length === 4 && ["A", "B", "C", "D"].includes(q.correctOptionId)
  );

  if (valid.length === 0) throw new Error("Generated questions failed validation");

  return valid.slice(0, 3);
}

export function scoreQuickCheck(
  questions: QCQuestion[],
  answers: Record<string, string>
): { score: number; correctCount: number; passed: boolean; results: Array<{ questionId: string; correct: boolean; correctOptionId: string; explanation: string }> } {
  const results = questions.map((q) => ({
    questionId: q.id,
    correct: answers[q.id] === q.correctOptionId,
    correctOptionId: q.correctOptionId,
    explanation: q.explanation,
  }));

  const correctCount = results.filter((r) => r.correct).length;
  const score = Math.round((correctCount / questions.length) * 100);
  const passed = correctCount >= 2; // pass if ≥ 2/3 correct

  return { score, correctCount, passed, results };
}

export function stripAnswers(questions: QCQuestion[]): QCQuestionPublic[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return questions.map(({ correctOptionId: _c, explanation: _e, ...q }) => q);
}
