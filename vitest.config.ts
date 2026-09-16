import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [path.resolve(__dirname, "src/test/setup.ts")],
    css: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", ".scratch"],
    testTimeout: 15000,
    teardownTimeout: 5000,
    pool: "threads",
    poolOptions: {
      threads: {
        isolate: true,
        maxThreads: 2,
        minThreads: 1,
      },
    },
    fileParallelism: true,
    reporters: [
      "default",
      path.resolve(__dirname, "src/test/grouped-reporter.ts"),
    ],
  },
});
