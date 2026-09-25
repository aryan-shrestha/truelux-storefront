import clsx from "clsx";

/**
 * The design's mark: a grey diamond with its right half inked. Decorative — the
 * brand name beside it, visible or `sr-only`, is what gets announced.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 36 36" className={clsx("shrink-0", className)}>
      <rect
        x="18"
        y="0.5"
        width="24.75"
        height="24.75"
        transform="rotate(45 18 0.5)"
        className="fill-wash"
      />
      <path d="M35.15 18 18.25 34.9V1.1L35.15 18Z" className="fill-ink" />
    </svg>
  );
}
