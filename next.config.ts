import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/proxy/:path*',
        destination: `${process.env.BACKEND_URL}/:path*`,
      },
      {
        source: '/ws-proxy',
        destination: `${process.env.BACKEND_URL}/api/v1/ws`,
      },
    ];
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;