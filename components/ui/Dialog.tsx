"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

/**
 * The one primitive that earns a dependency.
 *
 * Focus trapping, focus restoration, scroll locking, Escape dismissal and
 * `aria-modal` are genuinely hard to hand-roll correctly, and getting them wrong
 * locks a keyboard user inside the panel. Everything else in `components/ui` is
 * a native element with styles.
 */

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Rendered as the Radix trigger, not as a button of the caller's own.
   *
   * Radix restores focus to its trigger on close. Opening from an outside
   * button leaves focus on `<body>` when the panel closes, which drops a
   * keyboard user back at the top of the document.
   */
  trigger: ReactNode;
  /** Required: a dialog with no accessible name announces as "dialog". */
  title: string;
  children: ReactNode;
};

export function Dialog({ open, onOpenChange, trigger, title, children }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="bg-ink/40 fixed inset-0 z-40" />
        <RadixDialog.Content
          className="bg-paper text-ink fixed inset-0 z-50 flex flex-col overflow-y-auto p-6"
          aria-describedby={undefined}
        >
          <RadixDialog.Title className="sr-only">{title}</RadixDialog.Title>
          <div className="flex justify-end">
            <RadixDialog.Close className="text-ui hover:bg-ink/5 min-h-11 rounded-[2px] px-3 font-medium">
              Close
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
