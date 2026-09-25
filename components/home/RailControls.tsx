"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";

import { Chevron } from "@/components/ui/Chevron";

/**
 * Previous and next for a horizontally scrolling list rendered elsewhere.
 *
 * Only the two buttons are client code. The list itself is server-rendered
 * markup with scroll snapping, so it scrolls by touch and trackpad with no
 * JavaScript at all, and the design places these buttons away from it — beside
 * "Go to shop" in the hero, centred under the list in "New this week".
 */
export function RailControls({ target, className }: { target: string; className?: string }) {
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  useEffect(() => {
    const rail = document.getElementById(target);
    if (rail === null) return;

    const update = () =>
      setEdges({
        atStart: rail.scrollLeft <= 1,
        atEnd: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1,
      });

    update();
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      rail.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [target]);

  function step(direction: 1 | -1) {
    const rail = document.getElementById(target);
    const item = rail?.firstElementChild;
    if (!rail || !(item instanceof HTMLElement)) return;

    const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
    // No `behavior`: the list's own CSS decides, so reduced motion jumps.
    rail.scrollBy({ left: direction * (item.offsetWidth + gap) });
  }

  return (
    <div className={clsx("flex gap-3", className)}>
      <RailButton
        label="Previous"
        disabled={edges.atStart}
        onClick={() => step(-1)}
        target={target}
      >
        <Chevron direction="left" />
      </RailButton>
      <RailButton label="Next" disabled={edges.atEnd} onClick={() => step(1)} target={target}>
        <Chevron direction="right" />
      </RailButton>
    </div>
  );
}

function RailButton({
  label,
  disabled,
  onClick,
  target,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  target: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-controls={target}
      disabled={disabled}
      onClick={onClick}
      className="border-edge text-ink hover:bg-ink/5 flex size-10 items-center justify-center border disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
