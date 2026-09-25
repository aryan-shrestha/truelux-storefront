import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import PaymentFailedPage from "@/app/orders/failed/page";
import { HANDOFF_KEY, markHandoff } from "@/lib/orders/handoff";
import { recordOrder } from "@/lib/orders/record";

async function renderWith(reason?: string | string[]) {
  const page = await PaymentFailedPage({
    params: Promise.resolve({}),
    searchParams: Promise.resolve(reason === undefined ? {} : { reason }),
  });
  return render(page);
}

afterEach(() => {
  window.localStorage.clear();
});

describe("/orders/failed", () => {
  it.each([
    ["payment_not_completed", /did not go through, and nothing was charged/],
    ["payment_amount_mismatch", /went wrong with the payment amount/],
    ["payment_gateway_unavailable", /could not check your payment/],
  ])("gives %s its own account of what happened", async (reason, heading) => {
    await renderWith(reason);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(heading);
  });

  it.each([undefined, "user_canceled", ["payment_not_completed", "payment_not_completed"]])(
    "falls back to the generic account for %s",
    async (reason) => {
      await renderWith(reason);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Your payment did not complete.",
      );
    },
  );

  it.each([
    "payment_not_completed",
    "payment_amount_mismatch",
    "payment_gateway_unavailable",
    undefined,
  ])("offers no way to pay again for %s", async (reason) => {
    await renderWith(reason);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/try again|retry|pay now/i);
  });

  it("offers cash on delivery only when nothing was charged", async () => {
    await renderWith("payment_not_completed");
    expect(screen.getByRole("link", { name: /cash on delivery/ })).toHaveAttribute(
      "href",
      "/checkout",
    );
  });

  it("names this device's latest order, and ends the handoff", async () => {
    recordOrder({
      orderNumber: "TL-2026-000142",
      email: "sita@example.com",
      recordedAt: "2026-09-24T10:14:00.000Z",
      paymentMethod: "khalti",
      amounts: null,
    });
    markHandoff("TL-2026-000142");

    await renderWith("payment_not_completed");

    expect(screen.getByText("TL-2026-000142")).toBeInTheDocument();
    expect(window.localStorage.getItem(HANDOFF_KEY)).toBeNull();
  });
});
