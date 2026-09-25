import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { Dialog } from "@/components/ui/Dialog";

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Categories"
      trigger={<button type="button">Menu</button>}
    >
      <button type="button">Shop everything</button>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("moves focus into the panel when it opens", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Menu" }));

    // `contains` rather than toContainElement: document.activeElement is
    // Element | null, and narrowing it with a cast would be a cast.
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("restores focus to the trigger on close", async () => {
    // Regression guard. Opening from a button outside the Radix trigger leaves
    // focus on <body>, which drops a keyboard user at the top of the document
    // with no indication of where they were.
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Menu" });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(document.activeElement).toBe(trigger);
  });

  it("has an accessible name, so it does not announce as just 'dialog'", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Menu" }));

    expect(screen.getByRole("dialog", { name: "Categories" })).toBeInTheDocument();
  });
});
