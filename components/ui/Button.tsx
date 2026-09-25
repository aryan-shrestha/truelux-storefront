import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

import { Spinner } from "@/components/ui/Spinner";

/**
 * Variants come from a lookup, never from merged class strings. Nothing in this
 * repository generates conflicting classes, which is why there is no
 * tailwind-merge.
 */
const VARIANTS = {
  primary: "bg-ink text-paper hover:bg-ink/90",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  /**
   * A request this button started is in flight. It shows a spinner and marks
   * the button busy and `aria-disabled` — not `disabled`, which would drop
   * keyboard focus mid-request. The caller still ignores a second press.
   */
  pending?: boolean;
};

export function Button({
  variant = "primary",
  pending = false,
  className,
  type,
  children,
  "aria-disabled": ariaDisabled,
  ...props
}: ButtonProps) {
  return (
    <button
      // An unset type inside a form submits it, which is rarely what a button
      // without one was for.
      type={type ?? "button"}
      className={clsx(
        // rounded-[--radius-control] and nothing else: in this system a corner
        // means the thing can be pressed.
        "text-ui inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] px-5",
        "font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        VARIANTS[variant],
        pending && "cursor-progress",
        className,
      )}
      {...props}
      aria-busy={pending || undefined}
      aria-disabled={pending || ariaDisabled}
    >
      {pending && <Spinner />}
      {children}
    </button>
  );
}
