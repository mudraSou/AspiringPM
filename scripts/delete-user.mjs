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

const EMAIL = process.argv[2];
if (!EMAIL) { console.error("Usage: node scripts/delete-user.mjs <email>"); process.exit(1); }

try {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) { console.log("User not found:", EMAIL); process.exit(0); }

  console.log("Deleting:", user.email, user.id);

  await prisma.activityLog.deleteMany({ where: { userId: user.id } });
  await prisma.streakRecord.deleteMany({ where: { userId: user.id } });
  await prisma.questionAttempt.deleteMany({ where: { userId: user.id } });
  await prisma.resumeVersion.deleteMany({ where: { userId: user.id } });
  await prisma.jobDescription.deleteMany({ where: { userId: user.id } });
  await prisma.stageProgress.deleteMany({ where: { userId: user.id } });
  await prisma.userLearningPath.deleteMany({ where: { userId: user.id } });
  await prisma.userSkillScore.deleteMany({ where: { userId: user.id } });
  await prisma.readinessSnapshot.deleteMany({ where: { userId: user.id } });
  await prisma.conversationSession.deleteMany({ where: { userId: user.id } });
  await prisma.experienceEntry.deleteMany({ where: { userId: user.id } });
  await prisma.workExperience.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.account.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log("Done — user deleted.");
} finally {
  await prisma.$disconnect();
}
