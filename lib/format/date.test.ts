import { describe, expect, it } from "vitest";

import { formatOrderDate } from "@/lib/format/date";

describe("formatOrderDate", () => {
  it("formats in Kathmandu time", () => {
    expect(formatOrderDate("2026-09-20T10:14:00Z")).toBe("20 September 2026");
  });

  it("uses the Kathmandu date when UTC is still on the previous day", () => {
    // 20:00 UTC is 01:45 the next morning at UTC+5:45.
    expect(formatOrderDate("2026-09-20T20:00:00Z")).toBe("21 September 2026");
  });

  it("returns a malformed timestamp verbatim", () => {
    expect(formatOrderDate("not a date")).toBe("not a date");
  });
});
