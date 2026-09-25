"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode, RefObject } from "react";

/**
 * A panel that slides in from the right edge, over a dimmed page.
 *
 * Radix for the same reasons as `Dialog`: focus trapping, scroll locking,
 * Escape and `aria-modal`. Unlike `Dialog` it has no trigger of its own,
 * because the thing that opens it can be a link that must still work as one
 * (the cart: `/cart` without JavaScript, or in a new tab). Focus therefore
 * goes back by hand, to `returnFocusRef`, when it closes; without that a
 * keyboard user lands on <body>.
 */
type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Visible, and the dialog's accessible name. */
  title: ReactNode;
  returnFocusRef: RefObject<HTMLElement | null>;
  children: ReactNode;
};

export function Sheet({ open, onOpenChange, title, returnFocusRef, children }: SheetProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="bg-ink/35 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in fixed inset-0 z-40" />
        <RadixDialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef.current?.focus();
          }}
          className="grain bg-paper border-line data-[state=closed]:animate-sheet-out data-[state=open]:animate-sheet-in fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l"
        >
          <div className="border-line flex items-center justify-between gap-4 border-b px-6 py-4">
            <RadixDialog.Title className="font-display text-heading font-semibold">
              {title}
            </RadixDialog.Title>
            <RadixDialog.Close
              aria-label="Close"
              className="hover:bg-ink/5 -mr-3 flex size-11 items-center justify-center rounded-[2px] transition-colors"
            >
              <svg
                aria-hidden
                viewBox="0 0 14 14"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="m1.5 1.5 11 11m0-11-11 11" />
              </svg>
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
