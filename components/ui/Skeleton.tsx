import clsx from "clsx";

/**
 * A placeholder block in the shape of what is coming.
 *
 * A faint band of light crosses it, left to right, so a slow load reads as
 * working rather than broken. Under reduced motion the band stops and the
 * block is simply grey.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={clsx("bg-wash/60 relative overflow-hidden", className)}>
      <span className="animate-shimmer absolute inset-0 bg-linear-to-r from-transparent via-white/45 to-transparent" />
    </div>
  );
}
