import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RevealLines } from "@/components/home/RevealLines";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("RevealLines", () => {
  it("keeps the words of separate lines apart in the accessible name", () => {
    render(
      <h2>
        <RevealLines lines={["New", "this week"]} trailing="(6)" />
      </h2>,
    );

    expect(screen.getByRole("heading")).toHaveAccessibleName(/^New this week\s?\(6\)/);
  });

  it("never hides a headline that is already on screen", () => {
    render(<RevealLines lines={["Latest"]} />);

    expect(screen.getByText("Latest")).not.toHaveStyle({ transform: "translateY(105%)" });
  });

  it("holds a headline below the fold until it scrolls into view", () => {
    const observe = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn(function () {
        return { observe, unobserve: vi.fn(), disconnect: vi.fn() };
      }),
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: window.innerHeight + 200,
    } as DOMRect);

    render(<RevealLines lines={["Latest"]} />);

    expect(observe).toHaveBeenCalled();
  });
});
