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
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com https://static.tradingview.com https://www.gstatic.com https://accounts.google.com https://static.geetest.com https://*.geetest.com https://static.sumsub.com https://*.sumsub.com",
      "connect-src 'self' https: wss: ws:",
      "img-src 'self' data: blob: https:",
      "style-src 'self' 'unsafe-inline' https://static.geetest.com https://*.geetest.com",
      "font-src 'self' data:",
      "frame-src 'self' https://accounts.google.com https://*.geetest.com https://*.sumsub.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        ],
      },
    ];
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors. Run `npm run typecheck` to verify types.
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: [
      "react-icons",
      "@mantine/core",
      "@mantine/hooks",
      "@mantine/dates",
      "@mantine/dropzone",
      "@mantine/form",
      "@mantine/modals",
      "date-fns",
      "dayjs",
      "echarts",
    ],
  },
};

export default nextConfig;
