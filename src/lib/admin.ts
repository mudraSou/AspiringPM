import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

type AdminResult =
  | { ok: true; error: null }
  | { ok: false; error: NextResponse };

export async function requireAdmin(): Promise<AdminResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  if (!adminEmails.includes((session.user.email ?? "").toLowerCase())) {
    return { ok: false, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true, error: null };
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}
