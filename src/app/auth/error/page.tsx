import Link from "next/link";

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const messages: Record<string, string> = {
    OAuthSignin: "There was a problem signing in with Google. Please try again.",
    OAuthCallback: "Authentication was interrupted. Please try again.",
    OAuthAccountNotLinked:
      "This email is already registered with a different sign-in method.",
    CredentialsSignin: "Invalid email or password.",
    default: "An authentication error occurred. Please try again.",
  };

  const message = messages[searchParams.error ?? "default"] ?? messages.default;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="font-bold text-xl">
          PM Platform
        </Link>
        <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Authentication Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            {message}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm text-center"
            >
              Back to sign in
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Return to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
