import clsx from "clsx";

/**
 * A ring with one open quarter, in the current text colour. Decorative: the
 * control it sits in says what is happening in words ("Placing your order…"),
 * which is what a screen reader hears. Under reduced motion it stops turning
 * and stays as a static mark beside that text.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={clsx(
        "inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent",
        className,
      )}
    />
  );
}
