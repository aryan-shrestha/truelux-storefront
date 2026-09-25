import clsx from "clsx";

const ROTATION = { left: "rotate-180", right: "", down: "rotate-90" } as const;

export function Chevron({
  direction,
  className,
}: {
  direction: keyof typeof ROTATION;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 8 14"
      className={clsx("h-3.5 w-2", ROTATION[direction], className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.5 12.5 6.5 7l-5-5.5" />
    </svg>
  );
}
