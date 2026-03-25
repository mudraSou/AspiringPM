import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">PM Platform</span>
          <div className="flex items-center gap-4">
            <Link
              href="/discover"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Explore PM careers
            </Link>
            <Link
              href="/auth/login"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors touch-target flex items-center"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 pt-20 pb-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-sm px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            Built for career switchers — not born PMs
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white mb-6">
            You already think
            <br />
            like a PM.
            <br />
            <span className="text-blue-600">Let us prove it.</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed max-w-2xl">
            Upload your resume. We extract every PM-relevant skill buried in
            your work, give you an honest readiness score, and tell you exactly
            what to do next.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors touch-target"
            >
              Upload your resume — it&apos;s free
            </Link>
            <Link
              href="/discover"
              className="inline-flex items-center justify-center border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl font-semibold text-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors touch-target"
            >
              Not sure if PM is for me →
            </Link>
          </div>
        </div>

        {/* Social proof strip */}
        <div className="mt-24 pt-12 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-6">
            Designed for professionals from
          </p>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-gray-400 dark:text-gray-500 font-medium">
            {[
              "Software Engineering",
              "QA & Testing",
              "Product Design",
              "Management Consulting",
              "Sales & Marketing",
              "Data Analysis",
              "MBA Programs",
              "Operations",
            ].map((bg) => (
              <span key={bg}>{bg}</span>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-24 grid sm:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Upload your resume",
              description:
                "We extract every PM-relevant experience from your existing work — even if it's buried under technical job titles.",
            },
            {
              step: "02",
              title: "See where you stand",
              description:
                "Get a readiness score, skill gap analysis, and a personalized learning path — calibrated against real PM job descriptions.",
            },
            {
              step: "03",
              title: "Prove you're ready",
              description:
                "Complete gated assignments, build a public proof-of-work profile, and generate JD-optimized resumes automatically.",
            },
          ].map((item) => (
            <div key={item.step} className="space-y-3">
              <span className="text-blue-600 font-mono text-sm font-bold">
                {item.step}
              </span>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Honest section */}
        <div className="mt-24 bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 sm:p-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            We&apos;ll be honest with you.
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mb-6">
            The PM market is competitive. Entry-level roles are shrinking. Most
            aspirants spend months preparing blind, without knowing if they&apos;re
            ready. We give you the signal others won&apos;t: a real readiness score,
            the gaps that actually matter, and a concrete path to close them.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            If PM isn&apos;t the right path for you, we&apos;ll tell you that too.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 px-6 py-8">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-400">
          PM Career Platform — Built for career switchers
        </div>
      </footer>
    </div>
  );
}
