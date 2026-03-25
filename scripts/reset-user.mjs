/**
 * Reset a user's onboarding state so they can go through the flow from the start.
 * Usage: node scripts/reset-user.mjs [email]
 *
 * If no email is given, resets ALL users (dev only).
 */
import { createRequire } from "module";
import { readFileSync } from "fs";

// Load .env manually
try {
  const env = readFileSync(".env", "utf-8");
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const k = trimmed.slice(0, eqIdx).trim();
    const v = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, "");
    process.env[k] = v;
  }
} catch {}

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const targetEmail = process.argv[2];

try {
  const where = targetEmail ? { email: targetEmail } : {};
  const users = await prisma.user.findMany({ where, select: { id: true, email: true } });

  if (users.length === 0) {
    console.log("No users found" + (targetEmail ? ` with email: ${targetEmail}` : ""));
    process.exit(1);
  }

  for (const user of users) {
    await prisma.experienceEntry.deleteMany({ where: { userId: user.id } });
    await prisma.workExperience.deleteMany({ where: { userId: user.id } });
    await prisma.conversationSession.deleteMany({ where: { userId: user.id } });
    await prisma.readinessSnapshot.deleteMany({ where: { userId: user.id } });
    await prisma.userSkillScore.deleteMany({ where: { userId: user.id } });
    await prisma.userLearningPath.deleteMany({ where: { userId: user.id } });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingStep: "upload",
        onboardingCompleted: false,
        targetPmRole: null,
        currentRole: null,
        industry: null,
      },
    });

    console.log(`Reset: ${user.email} (${user.id})`);
  }

  console.log("\nDone — go to http://localhost:3000/onboarding/upload");
} finally {
  await prisma.$disconnect();
}
