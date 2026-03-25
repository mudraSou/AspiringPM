// ─── Shared layout ────────────────────────────────────────────────────────────

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>PM Platform</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; background: #0f0f10; color: #e2e8f0; }
  .wrapper { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #1a1a2e; border: 1px solid #2d2d3d; border-radius: 12px; padding: 32px; }
  .logo { font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #6366f1; margin-bottom: 28px; }
  h1 { font-size: 22px; font-weight: 700; color: #f1f5f9; line-height: 1.3; margin-bottom: 12px; }
  p { font-size: 15px; line-height: 1.65; color: #94a3b8; margin-bottom: 16px; }
  .highlight { color: #e2e8f0; font-weight: 600; }
  .btn { display: inline-block; margin-top: 8px; padding: 12px 24px; background: #6366f1; color: #fff; font-weight: 600; font-size: 14px; border-radius: 8px; text-decoration: none; }
  .divider { border: none; border-top: 1px solid #2d2d3d; margin: 24px 0; }
  .stat-row { display: flex; gap: 16px; margin: 20px 0; }
  .stat { flex: 1; background: #0f0f10; border: 1px solid #2d2d3d; border-radius: 8px; padding: 14px; text-align: center; }
  .stat-value { font-size: 26px; font-weight: 800; color: #6366f1; display: block; }
  .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; margin-top: 2px; display: block; }
  .footer { margin-top: 28px; font-size: 12px; color: #475569; text-align: center; line-height: 1.6; }
  .tag { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-right: 4px; }
  .tag-green { background: #14532d; color: #4ade80; }
  .tag-yellow { background: #713f12; color: #fbbf24; }
  .tag-blue { background: #1e3a5f; color: #60a5fa; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="logo">PM Platform</div>
    ${content}
  </div>
  <div class="footer">
    <p>You're receiving this because you signed up for PM Platform.<br />
    To unsubscribe, update your notification settings in your profile.</p>
  </div>
</div>
</body>
</html>`;
}

// ─── Welcome Email (post-onboarding) ─────────────────────────────────────────

export interface WelcomeEmailData {
  name: string;
  targetPmRole: string;
  initialScore: number;
  experienceCount: number;
  dashboardUrl: string;
}

export function welcomeEmailTemplate(data: WelcomeEmailData): {
  subject: string;
  html: string;
} {
  const roleLabel = data.targetPmRole.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const scoreColor = data.initialScore >= 70 ? "#4ade80" : data.initialScore >= 45 ? "#fbbf24" : "#f87171";

  return {
    subject: `Your PM readiness score is in — let's close the gaps`,
    html: layout(`
      <h1>Your analysis is ready, ${data.name || "future PM"}.</h1>
      <p>We've parsed your resume, mapped your skills to the <span class="highlight">${roleLabel} PM</span> track, and identified exactly where to focus.</p>

      <div class="stat-row">
        <div class="stat">
          <span class="stat-value" style="color: ${scoreColor}">${data.initialScore}</span>
          <span class="stat-label">Readiness Score</span>
        </div>
        <div class="stat">
          <span class="stat-value">${data.experienceCount}</span>
          <span class="stat-label">Experiences Mapped</span>
        </div>
      </div>

      <p>Your personalized learning path is live — ${data.initialScore < 50 ? "there's real ground to cover, and we've mapped every step" : "you're off to a strong start. Let's accelerate the rest"}.</p>

      <a href="${data.dashboardUrl}" class="btn">View your learning path →</a>

      <hr class="divider" />
      <p style="font-size: 13px; color: #64748b;">Tip: Aim to complete one sub-topic per day. Consistent daily practice beats weekend cramming every time.</p>
    `),
  };
}

// ─── Gate Pass Email ──────────────────────────────────────────────────────────

export interface GatePassEmailData {
  name: string;
  stageName: string;
  score: number;
  strengths: string[];
  nextStageName: string | null;
  dashboardUrl: string;
}

export function gatePassEmailTemplate(data: GatePassEmailData): {
  subject: string;
  html: string;
} {
  const strengthBullets = data.strengths
    .slice(0, 3)
    .map((s) => `<li style="margin-bottom:6px; color:#94a3b8;">${s}</li>`)
    .join("");

  return {
    subject: `Stage cleared: ${data.stageName} ✓`,
    html: layout(`
      <h1>You passed the gate. 🎯</h1>
      <p><span class="highlight">${data.name || "You"}</span> completed the gate assignment for <span class="highlight">${data.stageName}</span> with a score of <span class="highlight" style="color:#4ade80;">${data.score}/100</span>.</p>

      <p style="margin-bottom:8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">What you did well</p>
      <ul style="padding-left: 20px; margin-bottom: 20px;">
        ${strengthBullets}
      </ul>

      ${
        data.nextStageName
          ? `<p>Next up: <span class="highlight">${data.nextStageName}</span> is now unlocked. Keep the momentum going.</p>`
          : `<p>You've completed all available stages. Your readiness score has been updated — check your dashboard for the latest snapshot.</p>`
      }

      <a href="${data.dashboardUrl}" class="btn">Continue learning →</a>
    `),
  };
}

// ─── Streak Reminder Email ────────────────────────────────────────────────────

export interface StreakReminderEmailData {
  name: string;
  currentStreak: number;
  dashboardUrl: string;
}

export function streakReminderEmailTemplate(data: StreakReminderEmailData): {
  subject: string;
  html: string;
} {
  const streakMsg =
    data.currentStreak > 0
      ? `You're on a <span class="highlight">${data.currentStreak}-day streak</span> — don't break the chain.`
      : `Start a streak today. One sub-topic is all it takes.`;

  return {
    subject:
      data.currentStreak > 0
        ? `${data.currentStreak}-day streak at stake — 5 mins keeps it alive`
        : "Pick up where you left off",
    html: layout(`
      <h1>${data.currentStreak > 0 ? "Your streak is at stake." : "Come back — your path is waiting."}</h1>
      <p>Hey ${data.name || "there"}, ${streakMsg}</p>
      <p>Even one completed resource counts as an active day. Open your learning path, pick one sub-topic, and keep going.</p>

      ${
        data.currentStreak >= 7
          ? `<div class="stat-row"><div class="stat"><span class="stat-value" style="color:#f59e0b;">🔥 ${data.currentStreak}</span><span class="stat-label">Day Streak</span></div></div>`
          : ""
      }

      <a href="${data.dashboardUrl}/learning" class="btn">Open learning path →</a>

      <hr class="divider" />
      <p style="font-size: 13px; color: #64748b;">You'll only get this email when you miss a day. We want you to succeed, not to spam you.</p>
    `),
  };
}

// ─── Weekly Digest Email ──────────────────────────────────────────────────────

export interface WeeklyDigestEmailData {
  name: string;
  currentScore: number;
  scoreChange: number;
  stagesCompleted: number;
  questionsAttempted: number;
  currentStreak: number;
  topGapSkills: string[];
  dashboardUrl: string;
}

export function weeklyDigestEmailTemplate(data: WeeklyDigestEmailData): {
  subject: string;
  html: string;
} {
  const changeSign = data.scoreChange >= 0 ? "+" : "";
  const changeColor = data.scoreChange >= 0 ? "#4ade80" : "#f87171";
  const gapTags = data.topGapSkills
    .slice(0, 4)
    .map((g) => `<span class="tag tag-yellow">${g}</span>`)
    .join(" ");

  return {
    subject: `Your weekly PM progress — ${changeSign}${data.scoreChange} pts this week`,
    html: layout(`
      <h1>Weekly snapshot</h1>
      <p>Here's how your week looked, ${data.name || "future PM"}.</p>

      <div class="stat-row">
        <div class="stat">
          <span class="stat-value">${data.currentScore}</span>
          <span class="stat-label">Readiness Score</span>
        </div>
        <div class="stat">
          <span class="stat-value" style="color: ${changeColor}">${changeSign}${data.scoreChange}</span>
          <span class="stat-label">This Week</span>
        </div>
        <div class="stat">
          <span class="stat-value">${data.currentStreak}</span>
          <span class="stat-label">Day Streak</span>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat">
          <span class="stat-value">${data.stagesCompleted}</span>
          <span class="stat-label">Stages Done</span>
        </div>
        <div class="stat">
          <span class="stat-value">${data.questionsAttempted}</span>
          <span class="stat-label">Questions Attempted</span>
        </div>
      </div>

      ${
        gapTags
          ? `<hr class="divider" />
             <p style="font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 8px;">Focus areas this week</p>
             <p>${gapTags}</p>`
          : ""
      }

      <hr class="divider" />
      <a href="${data.dashboardUrl}" class="btn">Open dashboard →</a>
    `),
  };
}

// ─── Password Reset Email ─────────────────────────────────────────────────────

export interface PasswordResetEmailData {
  name: string;
  token: string;
  resetUrl: string;
}

export function passwordResetEmailTemplate(data: PasswordResetEmailData): {
  subject: string;
  html: string;
} {
  return {
    subject: "Reset your PM Platform password",
    html: layout(`
      <h1>Reset your password</h1>
      <p>Hey ${data.name}, we received a request to reset your PM Platform password.</p>
      <p>Click the button below to choose a new password. This link expires in <span class="highlight">1 hour</span>.</p>

      <a href="${data.resetUrl}" class="btn">Reset password →</a>

      <hr class="divider" />
      <p style="font-size: 13px; color: #64748b;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
    `),
  };
}
