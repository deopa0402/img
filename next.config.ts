import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // TypeScript 에러 무시
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint 에러 무시
    ignoreDuringBuilds: true,
  },
  // 실행 중 에러 비활성화
  onDemandEntries: {
    // 페이지가 메모리에 유지되는 시간 (ms)
    maxInactiveAge: 25 * 1000,
    // 동시에 메모리에 유지할 페이지 수
    pagesBufferLength: 5,
  },
  // 프로덕션 빌드에서 소스맵 생성 비활성화
  productionBrowserSourceMaps: false,
  // 실험적 기능 비활성화
  experimental: {
    // 에러 오버레이 비활성화
    disableOptimizedLoading: true,
    // 예기치 않은 에러에 대한 복구 시도
    esmExternals: 'loose'
  }
};

export default nextConfig;
