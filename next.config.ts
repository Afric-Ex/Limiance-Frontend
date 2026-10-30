import type { NextConfig } from "next";

const originOf = (value: string | undefined): string | null => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_URL);
const wsOrigin = originOf(process.env.NEXT_PUBLIC_WS_URL);

const nextConfig: NextConfig = {
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com https://static.tradingview.com https://www.gstatic.com https://accounts.google.com https://static.geetest.com https://*.geetest.com https://static.sumsub.com https://*.sumsub.com",
      `connect-src 'self' https: wss: ws:${apiOrigin ? ` ${apiOrigin}` : ""}${wsOrigin ? ` ${wsOrigin}` : ""}`,
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
      "dayjs",
      "echarts",
      "echarts-for-react",
      "@sumsub/websdk-react",
      "boring-avatars",
    ],
  },
};

export default nextConfig;
