import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("marks a pending request busy without dropping focus", () => {
    render(<Button pending>Placing your order…</Button>);

    const button = screen.getByRole("button", { name: "Placing your order…" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    // Not `disabled`: that would move focus to <body> mid-request.
    expect(button).toBeEnabled();
  });

  it("carries no busy state when idle", () => {
    render(<Button>Place order</Button>);

    const button = screen.getByRole("button", { name: "Place order" });
    expect(button).not.toHaveAttribute("aria-busy");
    expect(button).not.toHaveAttribute("aria-disabled");
  });
});
