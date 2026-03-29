/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // pdf-parse accesses test files at require-time — must run in Node, not bundled by webpack
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
