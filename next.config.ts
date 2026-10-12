import type { NextConfig } from "next";
import { resolveBackendUrlsFromEnv } from "./src/lib/backend-url";

const backend = resolveBackendUrlsFromEnv(process.env);

const nextConfig: NextConfig = {
  async rewrites() {
    if (!backend) {
      console.warn(
        "[next.config] BACKEND_URL/NEXT_PUBLIC_API_URL is not set to an absolute http(s) URL — /proxy, /proxy-root and /ws-proxy rewrites are disabled."
      );
      return [];
    }

    // The destination host comes only from configuration. Everything after the
    // origin is the incoming path, so a request can reach backend endpoints but
    // can never be used to make this server proxy to an arbitrary host.
    return [
      {
        source: "/proxy/:path*",
        destination: `${backend.apiBaseUrl}/:path*`,
      },
      {
        source: "/proxy-root/:path*",
        destination: `${backend.rootBaseUrl}/:path*`,
      },
      {
        source: "/ws-proxy",
        destination: `${backend.apiBaseUrl}/ws`,
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
      "frame-src 'self' https://accounts.google.com https://*.geetest.com https://*.sumsub.com https://*.tradingview-widget.com",
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
  compress: true,
  poweredByHeader: false,
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
      "echarts-for-react",
      "@sumsub/websdk-react",
      "boring-avatars",
    ],
  },
};

export default nextConfig;
