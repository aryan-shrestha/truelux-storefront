import { afterEach, describe, expect, it, vi } from "vitest";

import { HANDOFF_KEY, discardHandoff, markHandoff, takeHandoff } from "@/lib/orders/handoff";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("takeHandoff", () => {
  it("matches the handed-off order once, then never again", () => {
    markHandoff("TL-2026-000142");

    expect(takeHandoff("TL-2026-000142")).toBe(true);
    expect(takeHandoff("TL-2026-000142")).toBe(false);
  });

  it("does not match, or consume, a different order's marker", () => {
    markHandoff("TL-2026-000142");

    expect(takeHandoff("TL-2026-000099")).toBe(false);
    expect(takeHandoff("TL-2026-000142")).toBe(true);
  });

  it("does not match when nothing was handed off", () => {
    expect(takeHandoff("TL-2026-000142")).toBe(false);
  });

  it("treats a corrupt or wrongly shaped marker as absent", () => {
    for (const raw of ["{not json", "null", '"TL-2026-000142"', '{"orderNumber":42}']) {
      window.localStorage.setItem(HANDOFF_KEY, raw);
      expect(takeHandoff("TL-2026-000142")).toBe(false);
    }
  });

  it("does not match after a discard", () => {
    markHandoff("TL-2026-000142");
    discardHandoff();

    expect(takeHandoff("TL-2026-000142")).toBe(false);
  });

  it("survives storage that throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => markHandoff("TL-2026-000142")).not.toThrow();
    expect(takeHandoff("TL-2026-000142")).toBe(false);
  });
});
