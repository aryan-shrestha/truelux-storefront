import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FilterSheet } from "@/components/catalog/FilterSheet";

describe("FilterSheet", () => {
  it("starts closed, with the applied count on the trigger", () => {
    render(
      <FilterSheet applied={3}>
        <p>Skin type filters</p>
      </FilterSheet>,
    );

    expect(screen.getByRole("button", { name: "Filters (3 applied)" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("Skin type filters")).not.toBeInTheDocument();
  });

  it("opens the filters in a dialog and closes from Show results", async () => {
    render(
      <FilterSheet applied={0}>
        <p>Skin type filters</p>
      </FilterSheet>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Filters" }));
    const dialog = screen.getByRole("dialog", { name: "Filters" });
    expect(dialog).toContainElement(screen.getByText("Skin type filters"));

    await userEvent.click(screen.getByRole("button", { name: "Show results" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
