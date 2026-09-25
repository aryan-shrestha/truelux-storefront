import { describe, expect, it } from "vitest";

import { isHeaderHidden } from "@/components/layout/header-scroll";

const OFFSET = 90;

describe("isHeaderHidden", () => {
  it("hides while scrolling down past the header", () => {
    expect(isHeaderHidden(400, 460, false, OFFSET)).toBe(true);
  });

  it("returns as soon as the page scrolls up", () => {
    expect(isHeaderHidden(460, 420, true, OFFSET)).toBe(false);
  });

  it("always shows near the top, whichever way the page moves", () => {
    expect(isHeaderHidden(40, 80, false, OFFSET)).toBe(false);
  });

  it("ignores jitter rather than flickering", () => {
    expect(isHeaderHidden(500, 503, true, OFFSET)).toBe(true);
    expect(isHeaderHidden(500, 497, false, OFFSET)).toBe(false);
  });
});
