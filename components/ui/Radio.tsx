"use client";

import clsx from "clsx";
import { useId } from "react";

/**
 * A radio group built on native inputs, so arrow-key navigation, the single tab
 * stop and the grouping all come from the platform rather than from a
 * hand-rolled roving tabindex.
 *
 * Unavailable options are **not** `disabled`. A disabled radio leaves the tab
 * order, and a customer needs to be able to find out that their size is sold
 * out rather than have it silently vanish. They carry `aria-disabled` and a
 * visible status word.
 *
 * The status is rendered, not hidden: two unavailable options with different
 * reasons must read differently to someone looking at the screen, not only to a
 * screen reader. Words and a struck-through label, never colour alone.
 */

export type RadioOption = {
  value: string;
  label: string;
  /** Shown and spoken beneath the label, e.g. "Sold out". Absent means available. */
  status?: string;
};

type RadioGroupProps = {
  label: string;
  name: string;
  options: RadioOption[];
  value: string | null;
  onChange: (value: string) => void;
  /** Read with the group, the same way `Field` wires its error to its control. */
  error?: string;
};

export function RadioGroup({ label, name, options, value, onChange, error }: RadioGroupProps) {
  const labelId = useId();
  const errorId = useId();

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      aria-describedby={error === undefined ? undefined : errorId}
      aria-invalid={error === undefined ? undefined : true}
      className="flex flex-col gap-2"
    >
      <span id={labelId} className="text-detail text-slate">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Option
            key={option.value}
            option={option}
            name={name}
            checked={value === option.value}
            onChange={onChange}
          />
        ))}
      </div>
      {error !== undefined && (
        <p id={errorId} className="text-detail text-ink font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

function Option({
  option,
  name,
  checked,
  onChange,
}: {
  option: RadioOption;
  name: string;
  checked: boolean;
  onChange: (value: string) => void;
}) {
  const unavailable = option.status !== undefined;

  return (
    <label
      className={clsx(
        "text-ui relative inline-flex min-h-11 min-w-11 cursor-pointer flex-col items-center justify-center",
        "rounded-[2px] border px-3 py-1 transition-colors",
        checked ? "border-indigo text-ink font-medium" : "border-wash",
        unavailable ? "text-slate cursor-not-allowed" : "hover:border-slate",
      )}
    >
      <input
        type="radio"
        name={name}
        value={option.value}
        checked={checked}
        aria-disabled={unavailable || undefined}
        onChange={() => {
          // aria-disabled rather than disabled keeps it reachable; the guard is
          // what makes it unselectable.
          if (!unavailable) onChange(option.value);
        }}
        className="absolute inset-0 cursor-[inherit] opacity-0"
      />
      <span className={clsx(unavailable && "line-through")}>{option.label}</span>
      {option.status !== undefined && (
        <span className="text-detail leading-none">{option.status}</span>
      )}
    </label>
  );
}
