import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RailControls } from "@/components/home/RailControls";

function mountRail({ scrollWidth, clientWidth }: { scrollWidth: number; clientWidth: number }) {
  const rail = document.createElement("ul");
  rail.id = "rail";
  const item = document.createElement("li");
  rail.append(item);
  document.body.append(rail);

  Object.defineProperty(rail, "scrollWidth", { value: scrollWidth });
  Object.defineProperty(rail, "clientWidth", { value: clientWidth });
  Object.defineProperty(item, "offsetWidth", { value: 300 });
  rail.style.columnGap = "20px";
  rail.scrollBy = vi.fn() as typeof rail.scrollBy;
  return rail;
}

afterEach(() => {
  document.getElementById("rail")?.remove();
});

describe("RailControls", () => {
  it("disables previous at the start and steps one tile forward", async () => {
    const rail = mountRail({ scrollWidth: 1200, clientWidth: 600 });
    render(<RailControls target="rail" />);

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(rail.scrollBy).toHaveBeenCalledWith({ left: 320 });
  });

  it("disables next once the list has scrolled to its end", () => {
    const rail = mountRail({ scrollWidth: 1200, clientWidth: 600 });
    render(<RailControls target="rail" />);

    act(() => {
      rail.scrollLeft = 600;
      rail.dispatchEvent(new Event("scroll"));
    });

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
  });

  it("disables both when everything already fits", () => {
    mountRail({ scrollWidth: 600, clientWidth: 600 });
    render(<RailControls target="rail" />);

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});
