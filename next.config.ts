import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      console.warn(
        "[next.config] BACKEND_URL is not set — /proxy and /ws-proxy rewrites are disabled."
      );
      return [];
    }
    return [
      {
        source: '/proxy/:path*',
        destination: `${backendUrl}/:path*`,
      },
      {
        source: '/ws-proxy',
        destination: `${backendUrl}/api/v1/ws`,
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
