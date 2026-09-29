import { afterEach, describe, expect, it, vi } from "vitest";

import { env } from "@/lib/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("env", () => {
  it("reads a configured value", () => {
    expect(env.brandName).toBe("TrueLux");
  });

  it("validates when a field is read, not when the module loads", () => {
    // A client component importing env for the brand name must not trip over
    // API_BASE_URL, which is server-only and undefined in the browser bundle.
    vi.stubEnv("API_BASE_URL", "");

    expect(() => env.brandName).not.toThrow();
    expect(() => env.apiBaseUrl).toThrow(/API_BASE_URL is required/);
  });

  it("treats an empty value as missing, not as a value", () => {
    vi.stubEnv("NEXT_PUBLIC_BRAND_NAME", "   ");

    expect(() => env.brandName).toThrow(/required/);
  });
});
