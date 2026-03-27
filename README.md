# PM Career Platform

Built for career switchers — not born PMs. Upload your resume, get a readiness score, follow a personalized learning path, and generate JD-optimized resumes.

**Stack:** Next.js 14 · Prisma · PostgreSQL · NextAuth v5 · Groq (llama-3.3-70b) · TypeScript · Tailwind

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in your `.env`. Minimum required to run:

| Variable | Required | How to get it |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase / Neon / Railway → pooled connection string |
| `DIRECT_URL` | Yes | Same provider → direct connection string (no pgbouncer) |
| `NEXTAUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` for local dev |
| `GROQ_API_KEY` | Yes | [console.groq.com](https://console.groq.com) — free tier |
| `RESEND_API_KEY` | No | Only for email notifications |
| `GOOGLE_CLIENT_ID/SECRET` | No | Only for Google OAuth |
| `ADMIN_EMAILS` | No | Your email — unlocks `/admin` |

> **Why two database URLs?** `DATABASE_URL` goes through a connection pooler (faster for the app). `DIRECT_URL` is a raw connection that Prisma needs for schema changes (`db push`). Supabase and Neon both provide both URLs in their dashboard.

### 3. Push schema to database

```bash
npx prisma db push
```

### 4. Seed the database

```bash
npx prisma db seed
```

**This step is required.** Without it the app has no skill taxonomy, learning stages, or question bank — core features will be empty or broken.

Loads: 8 skill categories · 38 skills · learning stages + sub-topics · question bank · role skill weights.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Start at `/auth/signup` to create an account.

> Next.js auto-increments the port (3001, 3002…) if 3000 is occupied. Check terminal output for the actual port. If port changes, delete `.next` and hard-refresh the browser (`Ctrl+Shift+R`).

---

## Key Routes

| Route | Description |
|---|---|
| `/auth/signup` | Create account |
| `/auth/login` | Sign in |
| `/onboarding/upload` | Resume upload — start here |
| `/onboarding/analysis` | AI readiness analysis |
| `/dashboard` | Main dashboard |
| `/dashboard/learning` | Learning path (gated stages) |
| `/dashboard/resume` | AI resume builder |
| `/dashboard/questions` | Interview practice |
| `/dashboard/profile` | Public profile settings |
| `/profile/[username]` | Public-facing profile |
| `/discover` | PM fit quiz (no login needed) |
| `/admin` | User management (admin only) |

---

## Scripts

```bash
# Reset a user back to onboarding
node scripts/reset-user.mjs

# Run full test suite (97 tests)
node scripts/test-suite.mjs

# Run learning flow tests
node scripts/test-learning.mjs

# Generate AI content for sub-topics
node scripts/generate-content.mjs --stage 1
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `prisma db push` hangs | Make sure `DIRECT_URL` is set — the pooled URL won't work for schema changes |
| Empty learning path / no questions | Run `npx prisma db seed` |
| AI features fail silently | Check `GROQ_API_KEY` is set. Free tier limit: 100K tokens/day |
| ChunkLoadError after restart | Delete `.next` folder, restart, hard-refresh browser |
| Port conflict on Windows (Git Bash) | `taskkill.exe //PID <pid> //F` |
