import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! WARN !!
    // ESLint 에러 무시
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;