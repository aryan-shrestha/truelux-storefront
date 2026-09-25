/**
 * The order this browser has just sent to Khalti, and nothing more.
 *
 * `/orders/[accessToken]` is reached two ways: the backend's redirect after a
 * payment, and the confirmation email, which links there for every order. Only
 * the first means "the bag you have is the bag you just paid for", so the
 * landing clears the cart only when this marker names the order it loaded. An
 * email opened a week later finds no marker and leaves the current bag alone.
 *
 * It holds an order number, which is not a credential. **Never the access
 * token.**
 */

export const HANDOFF_KEY = "tl.handoff.v1";

function readMarker(): string | null {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(HANDOFF_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { orderNumber } = parsed as Record<string, unknown>;
    return typeof orderNumber === "string" && orderNumber !== "" ? orderNumber : null;
  } catch {
    return null;
  }
}

export function markHandoff(orderNumber: string): void {
  try {
    window.localStorage.setItem(HANDOFF_KEY, JSON.stringify({ version: 1, orderNumber }));
  } catch {
    // Costs the customer an automatic bag clear, not an order.
  }
}

export function discardHandoff(): void {
  try {
    window.localStorage.removeItem(HANDOFF_KEY);
  } catch {
    // Nothing to do: an unreadable marker can never match.
  }
}

/** True once, for the order that was handed off. */
export function takeHandoff(orderNumber: string): boolean {
  if (readMarker() !== orderNumber) return false;
  discardHandoff();
  return true;
}
