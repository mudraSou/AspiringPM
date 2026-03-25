/**
 * AI Service Layer — typed abstractions over Anthropic + OpenAI.
 * Never call the SDKs directly from route handlers — always use these.
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// Singleton clients
let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    // Groq is OpenAI-compatible and free — preferred for development.
    // Falls back to OpenAI if GROQ_API_KEY is not set.
    if (process.env.GROQ_API_KEY) {
      openaiClient = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      });
    } else if (process.env.OPENAI_API_KEY) {
      openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } else {
      throw new Error("Neither GROQ_API_KEY nor OPENAI_API_KEY is set");
    }
  }
  return openaiClient;
}

// =============================================
// Types
// =============================================

export type AIModel = "claude" | "gpt";

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AICallOptions {
  model?: AIModel;
  /** Max tokens to generate. Defaults: claude=4096, gpt=2048 */
  maxTokens?: number;
  /** System prompt */
  system?: string;
  /** Temperature 0-1. Default 0.3 for structured tasks, 0.7 for creative */
  temperature?: number;
  /** Timeout in ms. Default: 60000 */
  timeoutMs?: number;
}

export interface AIResponse {
  text: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

// =============================================
// Core completion function
// =============================================

/**
 * Send a single prompt and get a text response.
 * Use model="claude" for complex reasoning (default).
 * Use model="gpt" for parsing and simple structured extraction.
 */
export async function complete(
  prompt: string,
  options: AICallOptions = {}
): Promise<AIResponse> {
  const {
    model = "gpt",
    maxTokens,
    system,
    temperature = 0.3,
    timeoutMs = 60000,
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (model === "claude") {
      const client = getAnthropic();
      const response = await client.messages.create(
        {
          model: "claude-sonnet-4-5",
          max_tokens: maxTokens ?? 4096,
          temperature,
          system: system ?? "You are a helpful assistant. Always respond with valid JSON when asked.",
          messages: [{ role: "user", content: prompt }],
        },
        { signal: controller.signal }
      );

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text block in Claude response");
      }

      return {
        text: textBlock.text,
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    } else {
      const client = getOpenAI();
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      if (system) {
        messages.push({ role: "system", content: system });
      }
      messages.push({ role: "user", content: prompt });

      const groqModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
      const modelList = process.env.GROQ_API_KEY ? groqModels : ["gpt-4o-mini"];

      let lastError: unknown;
      for (const modelName of modelList) {
        try {
          const response = await client.chat.completions.create(
            { model: modelName, max_tokens: maxTokens ?? 2048, temperature, messages },
            { signal: controller.signal }
          );
          const text = response.choices[0]?.message?.content ?? "";
          return {
            text,
            model: response.model,
            inputTokens: response.usage?.prompt_tokens,
            outputTokens: response.usage?.completion_tokens,
          };
        } catch (err) {
          const status = (err as { status?: number })?.status;
          if (status === 429) { lastError = err; continue; } // try next model
          throw err;
        }
      }
      throw lastError;
    }
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Multi-turn conversation — sends a full message history.
 * Used by the Conversation Agent.
 */
export async function chat(
  messages: AIMessage[],
  options: AICallOptions = {}
): Promise<AIResponse> {
  const {
    model = "gpt",
    maxTokens,
    system,
    temperature = 0.5,
    timeoutMs = 60000,
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (model === "claude") {
      const client = getAnthropic();
      const response = await client.messages.create(
        {
          model: "claude-sonnet-4-5",
          max_tokens: maxTokens ?? 2048,
          temperature,
          system: system ?? "You are a helpful PM career coach.",
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
        { signal: controller.signal }
      );

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text block in Claude response");
      }

      return {
        text: textBlock.text,
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    } else {
      const client = getOpenAI();
      const oaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      if (system) {
        oaiMessages.push({ role: "system", content: system });
      }
      for (const m of messages) {
        oaiMessages.push({ role: m.role, content: m.content });
      }

      const groqModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
      const modelList = process.env.GROQ_API_KEY ? groqModels : ["gpt-4o-mini"];

      let lastError: unknown;
      for (const modelName of modelList) {
        try {
          const response = await client.chat.completions.create(
            { model: modelName, max_tokens: maxTokens ?? 2048, temperature, messages: oaiMessages },
            { signal: controller.signal }
          );
          const text = response.choices[0]?.message?.content ?? "";
          return {
            text,
            model: response.model,
            inputTokens: response.usage?.prompt_tokens,
            outputTokens: response.usage?.completion_tokens,
          };
        } catch (err) {
          const status = (err as { status?: number })?.status;
          if (status === 429) { lastError = err; continue; }
          throw err;
        }
      }
      throw lastError;
    }
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parse a JSON response from an AI call, with error handling.
 * Use this instead of JSON.parse directly on AI output.
 */
export function parseJSONResponse<T>(text: string): T {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to extract JSON object/array from the response
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as T;
    }
    throw new Error(`Failed to parse AI response as JSON: ${text.slice(0, 200)}`);
  }
}
