import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  // The dev-server-backed suite depends on on-demand route compilation and a
  // WS→REST fallback, so run it on a single worker for deterministic warm-up.
  workers: 1,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL,
    ...devices["Desktop Chrome"],
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: `${baseURL}/auth/login`,
        reuseExistingServer: !process.env.CI,
        // Turbopack cold-compiles `/auth/login` in ~2 minutes on a cold cache;
        // allow generous headroom so the first run does not time out.
        timeout: 300_000,
      },
});
