import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Gallery } from "@/components/catalog/Gallery";
import type { ProductImage } from "@/lib/api/types";

const images: ProductImage[] = [0, 1, 2].map((index) => ({
  url: `http://127.0.0.1:8000/media/products/tee-${index}.jpg`,
  altText: `Tee, view ${index + 1}`,
}));

function track() {
  const element = screen.getByRole("region", { name: "Photographs of Tee" });
  Object.defineProperty(element, "clientWidth", { value: 500, configurable: true });
  Array.from(element.children).forEach((slide, index) =>
    Object.defineProperty(slide, "offsetLeft", { value: index * 504, configurable: true }),
  );
  element.scrollTo = vi.fn() as typeof element.scrollTo;
  return element;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Gallery", () => {
  it("marks the first thumbnail current and disables previous at the start", () => {
    render(<Gallery images={images} name="Tee" />);

    expect(screen.getByRole("button", { name: "Show photograph 1 of 3" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: "Previous photograph" })).toBeDisabled();
  });

  it("scrolls the track to a thumbnail's photograph", async () => {
    render(<Gallery images={images} name="Tee" />);
    const element = track();

    await userEvent.click(screen.getByRole("button", { name: "Show photograph 3 of 3" }));

    expect(element.scrollTo).toHaveBeenCalledWith({ left: 1008 });
  });

  it("reads the current photograph back from where a swipe came to rest", () => {
    render(<Gallery images={images} name="Tee" />);
    const element = track();

    element.scrollLeft = 510;
    fireEvent.scroll(element);

    expect(screen.getByRole("button", { name: "Show photograph 2 of 3" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: "Previous photograph" })).toBeEnabled();
  });

  it("offers no thumbnails or buttons for a single photograph", () => {
    render(<Gallery images={images.slice(0, 1)} name="Tee" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Tee, view 1" })).toBeInTheDocument();
  });

  it("keeps its shape when there are no photographs", () => {
    render(<Gallery images={[]} name="Tee" />);

    expect(screen.getByText("No photographs of Tee yet")).toBeInTheDocument();
  });
});
