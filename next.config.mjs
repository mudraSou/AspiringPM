/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["pdfjs-dist"],
    // Explicitly include the pdfjs worker file in the Vercel deployment.
    // Vercel's file tracer only follows static imports — runtime string paths are invisible to it.
    outputFileTracingIncludes: {
      "/api/onboarding/resume": [
        "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
      ],
    },
  },
};

export default nextConfig;
