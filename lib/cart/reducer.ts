import type { CartLine } from "@/lib/cart/storage";

/**
 * The API enforces no cart size at all; its own documentation names this as the
 * first thing to add if checkout is abused. A checkout request with thousands
 * of lines holds a row lock on every variant inside one transaction.
 *
 * These numbers are invented rather than measured. They are a product decision
 * and should be revisited with the merchant rather than treated as technical.
 */
export const MAX_LINES = 20;
export const MAX_UNITS_PER_LINE = 10;

export type CartAction =
  /** Replaces the cart wholesale, from storage on mount or from another tab. */
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; line: CartLine }
  | { type: "setQuantity"; variantId: string; quantity: number }
  | { type: "remove"; variantId: string }
  | { type: "clear" };

function clamp(quantity: number): number {
  return Math.min(MAX_UNITS_PER_LINE, Math.max(1, Math.floor(quantity)));
}

export function cartReducer(lines: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case "hydrate":
      // Already validated by the storage parser, and clamped here anyway
      // because a hand-edited value is exactly what that parser lets through.
      return action.lines.slice(0, MAX_LINES).map((line) => ({
        ...line,
        quantity: clamp(line.quantity),
      }));

    case "add": {
      const existing = lines.find((line) => line.variantId === action.line.variantId);

      // Merging by variant id is not cosmetic: the checkout endpoint sums
      // duplicate lines before decrementing stock, so two rows displayed and one
      // charged is wrong even when the money is right.
      if (existing) {
        return lines.map((line) =>
          line.variantId === action.line.variantId
            ? { ...line, quantity: clamp(line.quantity + action.line.quantity) }
            : line,
        );
      }

      // Silently dropping the add would be worse than refusing it, but there is
      // nothing useful to say at this layer; the caller reports the cap.
      if (lines.length >= MAX_LINES) return lines;

      return [...lines, { ...action.line, quantity: clamp(action.line.quantity) }];
    }

    case "setQuantity": {
      // Setting zero is how a stepper removes a line, rather than a separate
      // action the caller has to remember to send.
      if (action.quantity < 1) {
        return lines.filter((line) => line.variantId !== action.variantId);
      }
      return lines.map((line) =>
        line.variantId === action.variantId ? { ...line, quantity: clamp(action.quantity) } : line,
      );
    }

    case "remove":
      return lines.filter((line) => line.variantId !== action.variantId);

    case "clear":
      return [];

    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

export function isFull(lines: CartLine[]): boolean {
  return lines.length >= MAX_LINES;
}
