import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Gallery } from "@/components/catalog/Gallery";
import type { ProductImage } from "@/lib/api/types";

// jsdom has no layout, so Embla never settles on a slide. A stand-in API records
// the scroll and lets the test fire the "select" Embla would.
const embla = vi.hoisted(() => {
  const handlers = new Set<() => void>();
  let selected = 0;
  const api = {
    scrollTo: (index: number) => {
      selected = index;
    },
    selectedScrollSnap: () => selected,
    canScrollPrev: () => selected > 0,
    canScrollNext: () =>
      selected < document.querySelectorAll('[data-slot="carousel-item"]').length - 1,
    scrollPrev: () => {},
    scrollNext: () => {},
    on: (_event: string, handler: () => void) => handlers.add(handler),
    off: (_event: string, handler: () => void) => handlers.delete(handler),
  };
  return {
    api,
    settle: () => handlers.forEach((handler) => handler()),
    reset: () => {
      selected = 0;
      handlers.clear();
    },
  };
});

vi.mock("embla-carousel-react", () => ({ default: () => [() => {}, embla.api] }));

const images: ProductImage[] = [0, 1, 2].map((index) => ({
  url: `http://127.0.0.1:8000/media/products/serum-${index}.jpg`,
  altText: `Serum, view ${index + 1}`,
}));

describe("Gallery", () => {
  beforeEach(() => embla.reset());

  it("marks the first thumbnail current and disables previous at the start", () => {
    render(<Gallery images={images} name="Serum" />);

    expect(screen.getByRole("button", { name: "Show photograph 1 of 3" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: "Previous photograph" })).toBeDisabled();
  });

  it("moves to a thumbnail's photograph", async () => {
    const user = userEvent.setup();
    render(<Gallery images={images} name="Serum" />);

    await user.click(screen.getByRole("button", { name: "Show photograph 3 of 3" }));
    act(() => embla.settle());

    expect(screen.getByRole("button", { name: "Show photograph 3 of 3" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("keeps the strip and the buttons for a single photograph, with both buttons disabled", () => {
    render(<Gallery images={images.slice(0, 1)} name="Serum" />);

    expect(screen.getByRole("button", { name: "Show photograph 1 of 1" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: "Previous photograph" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next photograph" })).toBeDisabled();
  });

  it("keeps its shape when there are no photographs", () => {
    render(<Gallery images={[]} name="Serum" />);

    expect(screen.getByText("No photographs of Serum yet")).toBeInTheDocument();
  });
});
