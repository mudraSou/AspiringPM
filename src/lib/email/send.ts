import { getResend, FROM_ADDRESS } from "./client";
import {
  welcomeEmailTemplate,
  gatePassEmailTemplate,
  streakReminderEmailTemplate,
  weeklyDigestEmailTemplate,
  passwordResetEmailTemplate,
  type WelcomeEmailData,
  type GatePassEmailData,
  type StreakReminderEmailData,
  type WeeklyDigestEmailData,
} from "./templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    // Email not configured — log in dev, skip silently in prod
    if (process.env.NODE_ENV === "development") {
      console.log(`[email] Would send to ${to}: ${subject}`);
    }
    return;
  }

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    if (error) {
      console.error(`[email] Failed to send "${subject}" to ${to}:`, error);
    }
  } catch (err) {
    console.error(`[email] Unexpected error sending to ${to}:`, err);
  }
}

// ─── Public send functions ────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  to: string,
  data: Omit<WelcomeEmailData, "dashboardUrl">
): Promise<void> {
  const { subject, html } = welcomeEmailTemplate({
    ...data,
    dashboardUrl: `${APP_URL}/dashboard`,
  });
  await send(to, subject, html);
}

export async function sendGatePassEmail(
  to: string,
  data: Omit<GatePassEmailData, "dashboardUrl">
): Promise<void> {
  const { subject, html } = gatePassEmailTemplate({
    ...data,
    dashboardUrl: `${APP_URL}/dashboard`,
  });
  await send(to, subject, html);
}

export async function sendStreakReminderEmail(
  to: string,
  data: Omit<StreakReminderEmailData, "dashboardUrl">
): Promise<void> {
  const { subject, html } = streakReminderEmailTemplate({
    ...data,
    dashboardUrl: `${APP_URL}/dashboard`,
  });
  await send(to, subject, html);
}

export async function sendWeeklyDigestEmail(
  to: string,
  data: Omit<WeeklyDigestEmailData, "dashboardUrl">
): Promise<void> {
  const { subject, html } = weeklyDigestEmailTemplate({
    ...data,
    dashboardUrl: `${APP_URL}/dashboard`,
  });
  await send(to, subject, html);
}

export async function sendPasswordResetEmail(
  to: string,
  data: { name: string; token: string }
): Promise<void> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${data.token}`;
  const { subject, html } = passwordResetEmailTemplate({ ...data, resetUrl });
  await send(to, subject, html);
}
