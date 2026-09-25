import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": resolve(import.meta.dirname, ".") },
  },
  test: {
    environment: "jsdom",
    // No globals: tests import describe/it/expect from "vitest" explicitly,
    // which keeps tsconfig free of ambient test types and lets Playwright specs
    // be typechecked in the same pass.
    setupFiles: ["./tests/setup.ts"],
    // lib/env.ts fails loudly on a missing variable, which is the point of it.
    // The suite supplies its own rather than reading a developer's .env.local,
    // so a test asserting a URL asserts a known one.
    env: {
      API_BASE_URL: "http://127.0.0.1:8000",
      NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8000",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_BRAND_NAME: "Threadline",
      NEXT_PUBLIC_SHIPPING_NOTE: "Rs 150 inside the Kathmandu valley, Rs 250 elsewhere.",
    },
    // Playwright owns tests/e2e and runs them with its own runner.
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
  },
});
