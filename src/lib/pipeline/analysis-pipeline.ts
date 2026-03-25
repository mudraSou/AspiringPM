/**
 * Onboarding Analysis Pipeline (Section 10.5)
 *
 * Resume Parser → PSI Reframer (parallel) → Gap Analyzer → Initial score
 *
 * Status is stored in Redis for polling.
 * Falls back to in-memory if Redis not configured.
 */

import { prisma } from "@/lib/db/prisma";
import { parseResume } from "@/lib/agents/resume-parser";
import { analyzeGaps } from "@/lib/agents/gap-analyzer";
import { sendWelcomeEmail } from "@/lib/email/send";

export type PipelineStep =
  | "reading_resume"
  | "extracting_experiences"
  | "reframing_experiences"
  | "mapping_skills"
  | "identifying_gaps"
  | "finalizing"
  | "complete"
  | "error";

export interface PipelineStatus {
  step: PipelineStep;
  progress: number; // 0-100
  message: string;
  error?: string;
  result?: {
    experienceCount: number;
    skillCount: number;
    initialScore: number;
    snapshotId: string;
  };
}

// In-memory fallback when Redis not available.
// Pinned to globalThis so all Next.js route modules share the same instance
// (in dev mode, each route handler gets its own module cache otherwise).
const g = globalThis as unknown as {
  _pipelineStore?: Map<string, PipelineStatus>;
  _runningPipelines?: Set<string>;
};
if (!g._pipelineStore) g._pipelineStore = new Map<string, PipelineStatus>();
if (!g._runningPipelines) g._runningPipelines = new Set<string>();
const inMemoryStore = g._pipelineStore;
const runningPipelines = g._runningPipelines;

export async function setStatus(userId: string, status: PipelineStatus) {
  inMemoryStore.set(userId, status);

  // Also try Redis if available
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      });
      await redis.setex(`pipeline:${userId}`, 3600, JSON.stringify(status));
    } catch {
      // Redis write failed — in-memory fallback will serve
    }
  }
}

export async function getStatus(userId: string): Promise<PipelineStatus | null> {
  // Try Redis first
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      });
      const raw = await redis.get<string>(`pipeline:${userId}`);
      if (raw) return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      // Fall through to in-memory
    }
  }
  return inMemoryStore.get(userId) ?? null;
}

/**
 * Extract text from a stored work experience record.
 * Handles: plain text, LLM import, and file paths.
 */
async function extractResumeText(rawDescription: string): Promise<string> {
  if (rawDescription.startsWith("__PENDING_PARSE__:")) {
    // Text extraction failed at upload time — nothing we can do here
    const fileName = rawDescription.replace("__PENDING_PARSE__:", "");
    return `Resume file "${fileName}" could not be parsed. Please re-upload or paste your resume as text.`;
  }

  if (rawDescription.startsWith("__FILE_PATH__:")) {
    // File is in Supabase Storage — fetch and extract text
    const filePath = rawDescription.replace("__FILE_PATH__:", "");

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return `Resume stored as file at "${filePath}" but Supabase is not configured. Please re-upload or paste your resume as text.`;
    }

    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
      const { data, error } = await supabase.storage
        .from("uploads")
        .download(filePath);

      if (error || !data) throw error;

      if (filePath.endsWith(".pdf")) {
        const buffer = Buffer.from(await data.arrayBuffer());
        const mod = await import("pdf-parse") as { default?: (b: Buffer) => Promise<{ text: string }> };
        const pdfParse = mod.default ?? (mod as unknown as (b: Buffer) => Promise<{ text: string }>);
        const result = await pdfParse(buffer);
        return result.text ?? "";
      }

      if (filePath.endsWith(".docx")) {
        const buffer = Buffer.from(await data.arrayBuffer());
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        return result.value ?? "";
      }

      return await data.text();
    } catch (err) {
      console.error("File extraction failed:", err);
      return "Could not extract resume text. Please ensure file is not corrupted.";
    }
  }

  return rawDescription;
}

/**
 * Run the full analysis pipeline for a user.
 * Called from the API route — runs asynchronously.
 */
export async function runAnalysisPipeline(userId: string): Promise<void> {
  // Prevent concurrent runs for the same user
  if (runningPipelines.has(userId)) {
    return;
  }
  runningPipelines.add(userId);

  try {
    // Step 1: Reading resume
    await setStatus(userId, {
      step: "reading_resume",
      progress: 10,
      message: "Reading your resume...",
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        industry: true,
        targetPmRole: true,
        currentRole: true,
      },
    });

    if (!user?.targetPmRole) {
      throw new Error("User profile not complete");
    }

    // Get stored resume data
    const storedExperience = await prisma.workExperience.findFirst({
      where: { userId, source: { in: ["resume", "llm_import"] } },
      orderBy: { createdAt: "desc" },
    });

    if (!storedExperience) {
      throw new Error("No resume found");
    }

    // Fail early if resume couldn't be extracted — avoids wasting AI calls on garbage text
    if (
      storedExperience.rawDescription?.startsWith("__PENDING_PARSE__:") ||
      storedExperience.rawDescription?.startsWith("__FILE_PATH__:")
    ) {
      throw new Error(
        "Resume file could not be parsed. Please go back and re-upload your resume, or paste the text directly."
      );
    }

    const resumeText = await extractResumeText(
      storedExperience.rawDescription ?? ""
    );

    if (!resumeText.trim()) {
      throw new Error(
        "Resume appears to be empty. Please go back and re-upload your resume."
      );
    }

    // Step 2: Parse resume — update status BEFORE the AI call so user sees progress
    await setStatus(userId, {
      step: "extracting_experiences",
      progress: 20,
      message: "Extracting your work experiences...",
    });

    // Truncate to ~8000 chars (~2000 tokens) to keep AI calls fast and within limits
    const MAX_RESUME_CHARS = 8000;
    const truncatedResume =
      resumeText.length > MAX_RESUME_CHARS
        ? resumeText.slice(0, MAX_RESUME_CHARS) + "\n[truncated]"
        : resumeText;

    const parsed = await parseResume(truncatedResume);

    // Update user name if we found it and it's not set
    if (parsed.fullName && !user.name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: parsed.fullName },
      });
    }

    // Persist parsed work experiences (replace existing)
    await prisma.workExperience.deleteMany({ where: { userId } });

    const createdExperiences = await Promise.all(
      parsed.workExperiences.map((exp, i) =>
        prisma.workExperience.create({
          data: {
            userId,
            companyName: exp.companyName,
            roleTitle: exp.roleTitle,
            startDate: exp.startDate ? new Date(exp.startDate + "-01") : null,
            endDate: exp.endDate ? new Date(exp.endDate + "-01") : null,
            rawDescription: exp.rawDescription,
            source: "resume",
            orderIndex: i,
          },
        })
      )
    );

    // Step 3: PSI Reframing — throttled to 2 concurrent to avoid Groq rate limits
    await setStatus(userId, {
      step: "reframing_experiences",
      progress: 40,
      message: `Reframing ${createdExperiences.length} experience${createdExperiences.length !== 1 ? "s" : ""} in PM language...`,
    });

    const expInputs = parsed.workExperiences.map((e) => ({
      companyName: e.companyName,
      roleTitle: e.roleTitle,
      rawDescription: e.rawDescription,
      startDate: e.startDate,
      endDate: e.endDate,
    }));
    const userCtx = { industry: user.industry ?? "Technology", targetPmRole: user.targetPmRole };

    // Process in batches of 2 to respect Groq rate limits
    const BATCH_SIZE = 2;
    const psiResults: Array<{ experienceIndex: number; entries: import("@/lib/agents/psi-reframer").PSIEntry[] }> = [];
    for (let i = 0; i < expInputs.length; i += BATCH_SIZE) {
      const batch = expInputs.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (exp, batchIdx) => {
          const globalIndex = i + batchIdx;
          try {
            const { reframeExperience } = await import("@/lib/agents/psi-reframer");
            const entries = await reframeExperience(exp, userCtx);
            return { experienceIndex: globalIndex, entries };
          } catch (err) {
            console.error(`PSI reframing failed for experience ${globalIndex}:`, err);
            return { experienceIndex: globalIndex, entries: [] as import("@/lib/agents/psi-reframer").PSIEntry[] };
          }
        })
      );
      psiResults.push(...batchResults);
      // Update progress as batches complete
      const pct = 40 + Math.round(((i + BATCH_SIZE) / expInputs.length) * 20);
      await setStatus(userId, {
        step: "reframing_experiences",
        progress: Math.min(pct, 60),
        message: `Reframing experiences (${Math.min(i + BATCH_SIZE, expInputs.length)}/${expInputs.length})...`,
      });
    }

    // Persist PSI entries
    const allPsiEntries: Array<{ id: string; skillTags: unknown }> = [];
    for (const result of psiResults) {
      // Clamp experienceIndex to valid range — AI may return out-of-bounds values
      const safeIndex = Math.max(
        0,
        Math.min(result.experienceIndex, createdExperiences.length - 1)
      );
      const workExp = createdExperiences[safeIndex];
      if (!workExp) continue; // no experiences at all — skip

      for (let entryIndex = 0; entryIndex < result.entries.length; entryIndex++) {
        const entry = result.entries[entryIndex];
        const created = await prisma.experienceEntry.create({
          data: {
            userId,
            workExperienceId: workExp.id,
            problemStatement: entry.problemStatement,
            solutionDescription: entry.solutionDescription,
            impactDescription: entry.impactDescription,
            impactMetrics: entry.impactMetrics ?? undefined,
            resumePoint: entry.resumePoint,
            skillTags: entry.skillTags,
            priority: entry.priority,
            source: "ai_generated",
            orderIndex: entryIndex,
          },
        });
        allPsiEntries.push(created);
      }
    }

    // Step 4: Map skills
    await setStatus(userId, {
      step: "mapping_skills",
      progress: 65,
      message: "Mapping your skills to PM competencies...",
    });

    // Step 5: Gap analysis
    await setStatus(userId, {
      step: "identifying_gaps",
      progress: 80,
      message: `Identifying skill gaps for ${user.targetPmRole} PM role...`,
    });

    const entries = await prisma.experienceEntry.findMany({
      where: { userId },
    });

    const { snapshot, result } = await analyzeGaps({
      userId,
      psiEntries: entries.map((e) => ({
        problemStatement: e.problemStatement,
        solutionDescription: e.solutionDescription,
        impactDescription: e.impactDescription,
        impactMetrics: e.impactMetrics,
        skillTags: e.skillTags,
      })),
      conversationSignals: null,
      targetPmRole: user.targetPmRole,
      triggeredBy: "onboarding",
    });

    // Store gap questions for the conversation step
    await prisma.conversationSession.create({
      data: {
        userId,
        sessionType: "onboarding",
        status: "in_progress",
        messages: [],
        extractedData: {
          gapSkills: result.topGaps,
          suggestedQuestions: result.gapFillQuestions,
          initialSnapshotId: snapshot.id,
        },
      },
    });

    // Step 6: Finalize
    await setStatus(userId, {
      step: "finalizing",
      progress: 95,
      message: "Almost there — preparing your personalized analysis...",
    });

    await prisma.user.update({
      where: { id: userId },
      data: { onboardingStep: "summary" },
    });

    const uniqueSkillSet = new Set<string>();
    for (const e of entries) {
      const tags = e.skillTags as string[];
      if (Array.isArray(tags)) tags.forEach((t) => uniqueSkillSet.add(t));
    }
    const skillCount = uniqueSkillSet.size;

    // Send welcome email (fire-and-forget, don't block completion)
    if (user?.email) {
      sendWelcomeEmail(user.email, {
        name: user.name ?? "",
        targetPmRole: user.targetPmRole ?? "general",
        initialScore: snapshot.overallScore,
        experienceCount: createdExperiences.length,
      }).catch(() => {
        // Non-critical — silently swallow
      });
    }

    await setStatus(userId, {
      step: "complete",
      progress: 100,
      message: "Analysis complete!",
      result: {
        experienceCount: createdExperiences.length,
        skillCount,
        initialScore: snapshot.overallScore,
        snapshotId: snapshot.id,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    await setStatus(userId, {
      step: "error",
      progress: 0,
      message: "Analysis encountered an error",
      error: message,
    });
    throw error;
  } finally {
    runningPipelines.delete(userId);
  }
}
