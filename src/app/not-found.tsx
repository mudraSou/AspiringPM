import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-950">
      <div className="text-center max-w-sm">
        <p className="text-6xl font-black text-gray-200 dark:text-gray-800 mb-4">404</p>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          This page doesn&apos;t exist or was moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
