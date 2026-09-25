import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Combobox, filterOptions } from "@/components/ui/Combobox";

const OPTIONS = ["Bhaktapur", "Kaski", "Kathmandu", "Lalitpur", "Makwanpur"];

function renderCombobox() {
  render(
    <form aria-label="Test form">
      <label htmlFor="district">District</label>
      <Combobox
        id="district"
        aria-describedby={undefined}
        aria-invalid={undefined}
        name="district"
        options={OPTIONS}
        placeholder="Choose a district"
        invalidMessage="Choose a district from the list."
        required
      />
    </form>,
  );
  return {
    input: screen.getByRole("combobox", { name: "District" }),
    value: () => new FormData(screen.getByRole<HTMLFormElement>("form")).get("district"),
  };
}

describe("filterOptions", () => {
  it("puts names that start with the query before names that merely contain it", () => {
    expect(filterOptions(OPTIONS, "k")).toEqual(["Kaski", "Kathmandu", "Bhaktapur", "Makwanpur"]);
  });

  it("matches regardless of case and surrounding space", () => {
    expect(filterOptions(OPTIONS, "  LALIT ")).toEqual(["Lalitpur"]);
  });
});

describe("Combobox", () => {
  it("narrows the list as you type and submits the chosen option", async () => {
    const user = userEvent.setup();
    const { input, value } = renderCombobox();

    await user.type(input, "pur");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Bhaktapur",
      "Lalitpur",
      "Makwanpur",
    ]);

    await user.click(screen.getByRole("option", { name: "Lalitpur" }));

    expect(input).toHaveValue("Lalitpur");
    expect(value()).toBe("Lalitpur");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("is operable from the keyboard alone", async () => {
    const user = userEvent.setup();
    const { input, value } = renderCombobox();

    await user.type(input, "ka");
    await user.keyboard("{ArrowDown}{Enter}");

    expect(value()).toBe("Kathmandu");
  });

  it("never submits half-typed text, and says why the form will not send", async () => {
    const user = userEvent.setup();
    const { input, value } = renderCombobox();

    await user.type(input, "Kathmand");
    await user.tab();

    expect(value()).toBe("");
    expect((input as HTMLInputElement).validationMessage).toBe("Choose a district from the list.");
  });

  it("accepts a district typed out in full, in any case", async () => {
    const user = userEvent.setup();
    const { input, value } = renderCombobox();

    await user.type(input, "kaski");
    await user.tab();

    expect(input).toHaveValue("Kaski");
    expect(value()).toBe("Kaski");
    expect((input as HTMLInputElement).validity.valid).toBe(true);
  });

  it("closes on Escape without choosing", async () => {
    const user = userEvent.setup();
    const { input, value } = renderCombobox();

    await user.click(input);
    expect(input).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");

    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(value()).toBe("");
  });

  it("says so when nothing matches", async () => {
    const user = userEvent.setup();
    renderCombobox();

    await user.type(screen.getByRole("combobox"), "zzz");

    expect(screen.getByRole("status")).toHaveTextContent("Nothing matches “zzz”.");
  });
});
