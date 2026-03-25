/**
 * Conversation Agent
 *
 * Gap-filling conversational agent for onboarding.
 * Runs structured but intelligent probing to surface hidden PM skills.
 *
 * Rules (from Section 6.7):
 * - Max 12 questions total
 * - Always references the user's actual work, never abstract questions
 * - Returns structured JSON with updated skill signals after each message
 * - Knows when to stop
 */

import { chat, parseJSONResponse } from "@/lib/ai/client";
import { SKILL_TAXONOMY_CONTEXT } from "./taxonomy-context";
import type { AIMessage } from "@/lib/ai/client";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ConversationState {
  messages: ConversationMessage[];
  questionsAsked: number;
  isComplete: boolean;
  extractedSignals: Array<{
    skillId: string;
    signal: string;
    strength: "strong" | "moderate" | "weak";
  }>;
  nextQuestion: string | null;
}

const MAX_QUESTIONS = 12;

function buildSystemPrompt(userContext: {
  name: string;
  currentRole: string;
  industry: string;
  targetPmRole: string;
  psiSummary: string;
  gapSkills: string[];
}): string {
  return `You are a PM career coach conducting a gap-filling conversation with a candidate.

Your goal: Surface PM-relevant skills and experiences they haven't fully articulated yet.

Candidate Profile:
- Name: ${userContext.name}
- Current Role: ${userContext.currentRole}
- Industry: ${userContext.industry}
- Target PM Role: ${userContext.targetPmRole}
- Key gaps identified: ${userContext.gapSkills.join(", ")}

Their experience summary:
${userContext.psiSummary}

CONVERSATION RULES:
1. Ask MAX ${MAX_QUESTIONS} questions total — you will be told how many have been asked
2. ALWAYS reference their actual company, role, or specific experiences when asking questions
3. Ask follow-up questions based on their answers — don't follow a rigid script
4. Focus on gaps first, then dig deeper into strengths if time allows
5. Be conversational and warm, not interrogative
6. If they give a rich answer, extract the signal and move on — don't ask the same thing twice
7. When you've asked enough OR gotten sufficient signals, conclude gracefully

After each user message, return JSON in this exact format:
{
  "assistantMessage": "Your response message to the user",
  "extractedSignals": [
    {
      "skillId": "skill_xxx",
      "signal": "Brief description of evidence",
      "strength": "strong|moderate|weak"
    }
  ],
  "isComplete": false,
  "completionReason": null
}

When isComplete is true, set completionReason to one of:
- "max_questions_reached"
- "sufficient_signals_collected"
- "user_requested_end"

${SKILL_TAXONOMY_CONTEXT}`;
}

export interface ConversationTurn {
  assistantMessage: string;
  extractedSignals: Array<{
    skillId: string;
    signal: string;
    strength: "strong" | "moderate" | "weak";
  }>;
  isComplete: boolean;
  completionReason: string | null;
}

export async function processConversationTurn(params: {
  userMessage: string;
  conversationHistory: ConversationMessage[];
  questionsAsked: number;
  userContext: {
    name: string;
    currentRole: string;
    industry: string;
    targetPmRole: string;
    psiSummary: string;
    gapSkills: string[];
  };
}): Promise<ConversationTurn> {
  const { userMessage, conversationHistory, questionsAsked, userContext } = params;

  const systemPrompt = buildSystemPrompt(userContext);

  // Build message history for Claude
  const messages: AIMessage[] = [
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user" as const,
      content: `[Questions asked so far: ${questionsAsked}/${MAX_QUESTIONS}]\n\n${userMessage}`,
    },
  ];

  const response = await chat(messages, {
    model: "gpt",
    system: systemPrompt,
    maxTokens: 1500,
    temperature: 0.6,
  });

  return parseJSONResponse<ConversationTurn>(response.text);
}

/**
 * Generate the opening message for the conversation.
 * References the user's actual experiences.
 */
export async function generateOpeningMessage(userContext: {
  name: string;
  currentRole: string;
  company: string | null;
  industry: string;
  targetPmRole: string;
  psiSummary: string;
  gapSkills: string[];
}): Promise<string> {
  const systemPrompt = buildSystemPrompt({
    ...userContext,
    psiSummary: userContext.psiSummary,
  });

  const prompt = `Generate a warm, specific opening message to start the gap-filling conversation.

The message should:
1. Acknowledge something specific from their experience (mention their company or role)
2. Explain that you want to ask a few questions to fill in the gaps
3. Start with your first question (focused on their biggest gap: ${userContext.gapSkills[0]})

Return JSON:
{
  "assistantMessage": "Your opening message with first question",
  "extractedSignals": [],
  "isComplete": false,
  "completionReason": null
}`;

  const response = await chat(
    [{ role: "user", content: prompt }],
    {
      model: "gpt",
      system: systemPrompt,
      maxTokens: 500,
      temperature: 0.6,
    }
  );

  const parsed = parseJSONResponse<ConversationTurn>(response.text);
  return parsed.assistantMessage;
}
