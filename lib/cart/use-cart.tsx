"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

import { cartReducer, isFull, type CartAction } from "@/lib/cart/reducer";
import {
  CART_CHANGED_EVENT,
  CART_STORAGE_KEY,
  countLines,
  parseCart,
  writeCart,
  type CartLine,
} from "@/lib/cart/storage";

/**
 * `localStorage` is the store, and React subscribes to it.
 *
 * Not a `useState` mirror synchronised by effects: two copies of the cart drift,
 * and writing state from inside an effect causes the cascading renders React
 * now warns about. `useSyncExternalStore` is the primitive for exactly this —
 * an external store, with a server snapshot that keeps hydration honest.
 */

const EMPTY: CartLine[] = [];

// getSnapshot must return a stable reference for unchanged data, or React
// re-renders forever. The raw string is the cheap thing to compare.
let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(CART_STORAGE_KEY);
  } catch {
    // Private-mode Safari and blocked site data throw rather than returning null.
    return null;
  }
}

function getSnapshot(): CartLine[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedLines = parseCart(raw);
  }
  return cachedLines;
}

/** The server has no cart. Rendering one here is a hydration mismatch. */
function getServerSnapshot(): CartLine[] {
  return EMPTY;
}

function subscribe(onChange: () => void): () => void {
  // `storage` fires in other tabs only, so same-tab writes need their own event.
  window.addEventListener(CART_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CART_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const noopSubscribe = () => () => {};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  /**
   * False during server rendering and the first client render.
   *
   * Anything that renders the cart shows a stable placeholder until this is
   * true. It is also why the cart page shows a skeleton rather than its empty
   * state: telling someone with a full bag that it is empty is worse than
   * showing nothing for a moment.
   */
  ready: boolean;
  full: boolean;
  add: (line: CartLine) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  // Every mutation reads the store, applies the reducer and writes back. There
  // is no second copy to keep in step.
  const act = useCallback((action: CartAction) => {
    writeCart(cartReducer(getSnapshot(), action));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: countLines(lines),
      ready,
      full: isFull(lines),
      add: (line) => act({ type: "add", line }),
      setQuantity: (variantId, quantity) => act({ type: "setQuantity", variantId, quantity }),
      remove: (variantId) => act({ type: "remove", variantId }),
      clear: () => act({ type: "clear" }),
    }),
    [lines, ready, act],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (value === null) {
    throw new Error("useCart must be used inside a CartProvider.");
  }
  return value;
}
