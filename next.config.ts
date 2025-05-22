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
  images: {
    domains: ['backend-img-silk.vercel.app', 'localhost'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  }
};

export default nextConfig;