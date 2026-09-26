import { cn } from "cn";
import type { ReactNode } from "react";

type SectionHeadingProps = {
  id: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "start" | "center";
  className?: string;
};

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "start",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && <p className="text-sm">{eyebrow}</p>}
      <h2 id={id} className="font-heading text-title">
        {title}
      </h2>
      {description && <p className="mt-4 max-w-2xl leading-relaxed">{description}</p>}
    </div>
  );
}
