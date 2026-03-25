/**
 * Resume Parser Agent
 *
 * Extracts structured work experience data from raw resume text.
 * Uses GPT-4o-mini (fast, cheap, good at structured extraction).
 * Returns structured JSON only — no freeform text.
 */

import { complete, parseJSONResponse } from "@/lib/ai/client";

export interface ParsedWorkExperience {
  companyName: string;
  roleTitle: string;
  startDate: string | null; // ISO date string YYYY-MM
  endDate: string | null;   // null = current
  rawDescription: string;
  isCurrent: boolean;
}

export interface ParsedResume {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  summary: string | null;
  workExperiences: ParsedWorkExperience[];
  education: Array<{
    institution: string;
    degree: string;
    field: string | null;
    graduationYear: number | null;
  }>;
  skills: string[];
}

const SYSTEM_PROMPT = `You are a resume parser. Extract structured data from resumes.
Always respond with valid JSON matching the exact schema requested.
Do not add commentary, markdown, or explanations outside the JSON.`;

export async function parseResume(resumeText: string): Promise<ParsedResume> {
  const prompt = `Parse this resume and extract all information into the following JSON structure:

{
  "fullName": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "summary": "string or null (professional summary/objective if present)",
  "workExperiences": [
    {
      "companyName": "string",
      "roleTitle": "string",
      "startDate": "YYYY-MM or null",
      "endDate": "YYYY-MM or null (null means current position)",
      "rawDescription": "full original description text for this role",
      "isCurrent": boolean
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string (e.g. Bachelor of Technology, MBA)",
      "field": "string or null (e.g. Computer Science)",
      "graduationYear": number or null
    }
  ],
  "skills": ["array", "of", "skills", "mentioned"]
}

Important rules:
- Extract ALL work experiences, even short ones
- Include the full original bullet points in rawDescription, joined with newlines
- If end date says "Present" or "Current", set endDate to null and isCurrent to true
- If a date is just a year (2020), format as "2020-01"
- Do not infer or hallucinate data — only extract what's present

Resume text:
---
${resumeText}
---

Return ONLY the JSON object, no other text.`;

  const response = await complete(prompt, {
    model: "gpt",
    maxTokens: 2000,
    system: SYSTEM_PROMPT,
    temperature: 0.1,
    timeoutMs: 45000,
  });

  return parseJSONResponse<ParsedResume>(response.text);
}
