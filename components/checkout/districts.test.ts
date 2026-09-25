import { describe, expect, it } from "vitest";

import { DISTRICTS } from "@/components/checkout/districts";

// Mirrors the backend's KATHMANDU_VALLEY_DISTRICTS. If this list and that tuple
// disagree, valley customers are charged the outside-valley fee silently.
const BACKEND_VALLEY_DISTRICTS = ["kathmandu", "lalitpur", "bhaktapur"];

describe("DISTRICTS", () => {
  it("offers every valley district the backend matches, spelled as it matches them", () => {
    const lowered = DISTRICTS.map((district) => district.toLowerCase());

    for (const district of BACKEND_VALLEY_DISTRICTS) {
      expect(lowered).toContain(district);
    }
  });

  it("lists all 77 districts once each", () => {
    expect(new Set(DISTRICTS).size).toBe(77);
    expect(DISTRICTS).toHaveLength(77);
  });
});
