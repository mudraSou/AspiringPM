/**
 * POST /api/onboarding/resume
 * Accepts PDF/DOCX/TXT (max 5MB).
 * Supabase storage is optional — if not configured, text is extracted
 * in-memory and stored directly in the DB (sufficient for dev/testing).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const MAX_BYTES = 5 * 1024 * 1024;

// Detect file type by extension as fallback (browsers sometimes send application/octet-stream)
function resolveType(mimeType: string, fileName: string): string {
  if (mimeType && mimeType !== "application/octet-stream") return mimeType;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === "txt") return "text/plain";
  return mimeType;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "text/plain") {
    return buffer.toString("utf-8");
  }
  if (mimeType === "application/pdf") {
    try {
      // pdfjs-dist: no test-file side effects, works reliably in serverless
      const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist/legacy/build/pdf.mjs");
      // v5 requires an explicit workerSrc — empty string is treated as "not set"
      const { pathToFileURL } = await import("url");
      const { join } = await import("path");
      GlobalWorkerOptions.workerSrc = pathToFileURL(
        join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")
      ).href;
      const loadingTask = getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      const pages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageText = content.items.map((item: any) => item.str ?? "").join(" ");
        pages.push(pageText);
      }
      return pages.join("\n");
    } catch (err) {
      console.error("PDF parse error:", err);
      return "";
    }
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value ?? "";
    } catch {
      return "";
    }
  }
  return "";
}

async function tryUploadToSupabase(
  buffer: Buffer,
  filePath: string,
  mimeType: string
): Promise<boolean> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return false;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key);
    const { error } = await supabase.storage
      .from("uploads")
      .upload(filePath, buffer, { contentType: mimeType, upsert: false });
    if (error) {
      console.error("Supabase upload error:", error);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const pastedText = formData.get("pastedText") as string | null;

  // ── Pasted text path ───────────────────────────────────────────────────────
  if (pastedText && !file) {
    await prisma.workExperience.deleteMany({
      where: { userId, source: { in: ["resume", "llm_import"] } },
    });
    await prisma.workExperience.create({
      data: { userId, rawDescription: pastedText, source: "llm_import" },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingStep: "profile" },
    });
    return NextResponse.json({ success: true, source: "llm_import" });
  }

  if (!file) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large. Maximum size is 5 MB." }, { status: 413 });
  }

  const fileType = resolveType(file.type, file.name);

  if (!ALLOWED_TYPES.includes(fileType)) {
    return NextResponse.json(
      { error: "Only PDF, DOCX, and TXT files are supported." },
      { status: 415 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // ── Try Supabase upload (optional) ────────────────────────────────────────
  const filePath = `resumes/${userId}/${Date.now()}-${file.name}`;
  const uploaded = await tryUploadToSupabase(buffer, filePath, fileType);

  // ── Extract text in-memory ─────────────────────────────────────────────────
  let rawText = await extractText(buffer, fileType);

  // If Supabase uploaded but no text extracted (DOCX), store path for pipeline
  if (!rawText && uploaded) {
    rawText = `__FILE_PATH__:${filePath}`;
  }
  if (!rawText) {
    rawText = `__PENDING_PARSE__:${file.name}`;
  }

  // ── Persist ────────────────────────────────────────────────────────────────
  await prisma.workExperience.deleteMany({
    where: { userId, source: { in: ["resume", "llm_import"] } },
  });
  await prisma.workExperience.create({
    data: {
      userId,
      rawDescription: rawText,
      source: "resume",
      roleTitle: "__PENDING_PARSE__",
    },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingStep: "profile" },
  });

  return NextResponse.json({ success: true, source: "resume", uploaded });
}
