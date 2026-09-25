import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("the test harness", () => {
  it("renders a component and matches on its text", () => {
    render(<p>Rs 4,500</p>);

    expect(screen.getByText("Rs 4,500")).toBeInTheDocument();
  });
});
