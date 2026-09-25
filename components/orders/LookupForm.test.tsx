import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LookupForm } from "@/components/orders/LookupForm";
import { recordOrder } from "@/lib/orders/record";
import { pendingKhaltiOrder } from "@/tests/fixtures/orders";

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function apiError(status: number, code: string) {
  return jsonResponse({ error: { code, message: "Reworded at will.", details: {} } }, status);
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn((_url: string | URL | Request, _init?: RequestInit) =>
    Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function record(orderNumber: string, email: string) {
  recordOrder({
    orderNumber,
    email,
    recordedAt: "2026-09-24T10:14:00.000Z",
    paymentMethod: "cod",
    amounts: null,
  });
}

async function submit(orderNumber: string, email: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Order number"), orderNumber);
  await user.type(screen.getByLabelText("Email"), email);
  await user.click(screen.getByRole("button", { name: "Find order" }));
}

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("LookupForm", () => {
  it("prefills both fields from the most recent order on this device", () => {
    record("TL-2026-000141", "old@example.com");
    record("TL-2026-000142", "sita@example.com");

    render(<LookupForm />);

    expect(screen.getByLabelText("Order number")).toHaveValue("TL-2026-000142");
    expect(screen.getByLabelText("Email")).toHaveValue("sita@example.com");
  });

  it("posts the number and email, then shows the order", async () => {
    const fetchMock = stubFetch(jsonResponse(pendingKhaltiOrder, 200));

    render(<LookupForm />);
    await submit("TL-2026-000142", "sita@example.com");

    expect(await screen.findByText("Awaiting payment")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Order found" })).toHaveFocus();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("http://127.0.0.1:8000/api/v1/orders/lookup/");
    expect(init?.cache).toBe("no-store");
    expect(JSON.parse(String(init?.body))).toEqual({
      order_number: "TL-2026-000142",
      email: "sita@example.com",
    });
  });

  it("blames neither field for a 404", async () => {
    stubFetch(apiError(404, "not_found"));

    render(<LookupForm />);
    await submit("TL-2026-000142", "sita@example.com");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("We could not find an order with that number and email.");
    expect(alert).not.toHaveTextContent(/email (does not|doesn't) match|wrong email/i);
    expect(screen.getByLabelText("Order number")).not.toHaveAttribute("aria-invalid");
    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-invalid");
  });

  it("explains the low limit on a 429", async () => {
    stubFetch(apiError(429, "throttled"));

    render(<LookupForm />);
    await submit("TL-2026-000142", "sita@example.com");

    expect(await screen.findByRole("alert")).toHaveTextContent(/too many lookups/);
  });

  it("looks up a recent order in one click", async () => {
    record("TL-2026-000142", "sita@example.com");
    const fetchMock = stubFetch(jsonResponse(pendingKhaltiOrder, 200));

    render(<LookupForm />);
    await userEvent.click(screen.getByRole("button", { name: "View order TL-2026-000142" }));

    expect(await screen.findByText("Awaiting payment")).toBeInTheDocument();
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).email).toBe("sita@example.com");
  });
});
