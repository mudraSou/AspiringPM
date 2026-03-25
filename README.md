# PM Career Platform

Built for career switchers — not born PMs. Upload your resume, get a readiness score, follow a personalized learning path, and generate JD-optimized resumes.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up your `.env` file with your database and API keys (see `.env.example` if available).

3. Push the database schema:

```bash
npx prisma db push
npx prisma generate
```

4. Seed learning stages:

```bash
npx tsx scripts/seed.ts
```

5. Run the development server:

```bash
npm run dev -- --port 3003
```

Open [http://localhost:3003](http://localhost:3003) in your browser.

Start the user journey at [http://localhost:3003/auth/login](http://localhost:3003/auth/login).

## Key Routes

| Route | Description |
|-------|-------------|
| `/auth/login` | Sign in |
| `/auth/signup` | Create account |
| `/onboarding/upload` | Resume upload — start here |
| `/onboarding/analysis` | AI readiness analysis |
| `/dashboard` | Main dashboard |
| `/dashboard/learning` | Learning path (11 stages) |
| `/dashboard/resume` | Resume builder |
| `/dashboard/questions` | Interview practice |

## Scripts

```bash
# Generate AI learning content for sub-topics
node scripts/generate-content.mjs --stage 1

# Reset a user's onboarding data
node scripts/reset-user.mjs

# Run test suites
node scripts/test-mcq.mjs
node scripts/test-dashboard.mjs
node scripts/test-progress-card.mjs
```

## Tech Stack

- **Framework**: Next.js 14 App Router
- **Database**: PostgreSQL via Prisma
- **AI**: Groq (llama-3.3-70b) with fallback to llama-3.1-8b
- **Auth**: NextAuth v5 (email/password)
- **Email**: Resend
- **Styling**: Tailwind CSS
