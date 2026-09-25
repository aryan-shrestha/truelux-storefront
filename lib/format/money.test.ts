import { describe, expect, it } from "vitest";

import { formatPrice } from "@/lib/format/money";

describe("formatPrice", () => {
  it("groups thousands the way a Nepali price is written", () => {
    expect(formatPrice("2400.00")).toBe("Rs 2,400");
  });

  it("groups five-figure prices", () => {
    expect(formatPrice("120000.00")).toBe("Rs 1,20,000");
  });

  it("drops a zero paisa, because a price tag is not a receipt", () => {
    expect(formatPrice("6200.00")).toBe("Rs 6,200");
  });

  it("keeps paisa when there are any", () => {
    expect(formatPrice("1150.35")).toBe("Rs 1,150.35");
  });

  it("handles an amount with no decimal part at all", () => {
    expect(formatPrice("450")).toBe("Rs 450");
  });

  it("never renders NaN for a malformed amount", () => {
    // A contract break, not a customer-facing state: show it rather than lie.
    expect(formatPrice("not-a-price")).toBe("not-a-price");
  });

  it("formats zero", () => {
    expect(formatPrice("0.00")).toBe("Rs 0");
  });
});
